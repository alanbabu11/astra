// server.js
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const User = require("./models/User");
const Prompt = require("./models/Prompt");
const Dataset = require("./models/Dataset");

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// ---------------------------------------------------
// MONGO CONNECTION
// ---------------------------------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Simple health route
app.get("/", (req, res) => {
  res.json({ msg: "Datagen API working ✅" });
});

// Helper to read Bearer token
function getToken(req) {
  const authHeader = req.headers.authorization || "";
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") return parts[1];
  return null;
}

// ---------------------------------------------------
// REGISTER
// ---------------------------------------------------
app.post("/register", async (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({ msg: "All fields required" });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, phone, email, password: hashed });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      msg: "Registered",
      token,
      user: {
        name: user.name,
        email: user.email,
        credits: user.credits,
        geminiKey: user.geminiKey || "",
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------------------------------------------
// LOGIN
// ---------------------------------------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ msg: "Missing fields" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        credits: user.credits,
        geminiKey: user.geminiKey || "",
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------------------------------------------
// STEP 1: USER SENDS PROMPT → ML API (keywords/vector)
// ---------------------------------------------------
app.post("/prompt", async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ msg: "No token" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ msg: "Invalid token" });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ msg: "Prompt required" });

  try {
    // 0. Load user & deduct credits (10 per generation)
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    if (user.credits < 10) {
      return res.status(400).json({ msg: "Not enough credits" });
    }

    user.credits -= 10;
    await user.save();

    // 1. Save Prompt Document
    const newPrompt = await Prompt.create({
      userId: decoded.id,
      text: prompt,
      status: "processing",
    });

    // 2. Create Dataset document in "processing"
    const dataset = await Dataset.create({
      userId: decoded.id,
      promptId: newPrompt._id,
      keywords: [],
      vector: [],
      status: "processing",
    });

    // 3. Send prompt → ML keyword extraction (dummy ML)
    let mlRes;
    try {
      mlRes = await axios.post("http://127.0.0.1:5001/process", {
        prompt,
        promptId: newPrompt._id.toString(), // send promptId so ML can call /scrape
      });
    } catch (err) {
      console.error("❌ ML API ERROR:", err.message);
      newPrompt.status = "failed";
      await newPrompt.save();

      dataset.status = "failed";
      dataset.errorMessage = "ML API offline";
      await dataset.save();

      return res.status(500).json({ msg: "ML API offline" });
    }

    // 4. Update dataset with ML results
    dataset.keywords = mlRes.data.generated_keywords || [];
    dataset.vector = mlRes.data.vector || [];
    dataset.status = "keywords_done";
    await dataset.save();

    // 5. Update prompt status to completed (keywords step done)
    newPrompt.status = "completed";
    await newPrompt.save();

    // Response to frontend – scraping may still be "processing" on backend
    res.json({
      msg: "Prompt processed (keywords generated). Scraping in progress...",
      promptId: newPrompt._id,
      datasetId: dataset._id,
      keywords: dataset.keywords,
      credits: user.credits, // ⚡ updated credits
    });
  } catch (err) {
    console.error("PROMPT ROUTE ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------------------------------------------
// STEP 2: ML / SCRAPER RETURNS FINAL DATASET TO BACKEND
// (Dummy ML will call this)
// ---------------------------------------------------
app.post("/scrape", async (req, res) => {
  const { promptId, preview, downloadLink, totalItems, errorMessage } = req.body;

  if (!promptId) {
    return res.status(400).json({ msg: "promptId required" });
  }

  try {
    const dataset = await Dataset.findOne({ promptId });
    if (!dataset) return res.status(404).json({ msg: "Dataset not found" });

    if (errorMessage) {
      dataset.status = "failed";
      dataset.errorMessage = errorMessage;
    } else {
      dataset.preview = preview || [];
      dataset.downloadLink = downloadLink || null;
      dataset.totalItems = totalItems || (preview ? preview.length : 0);
      dataset.status = "completed";
      dataset.errorMessage = "";
    }

    await dataset.save();

    return res.json({ msg: "Final dataset saved" });
  } catch (err) {
    console.error("SCRAPE ROUTE ERROR:", err);
    return res.status(500).json({ msg: "Error updating dataset" });
  }
});

// ---------------------------------------------------
// GET FINAL DATASET FOR FRONTEND OUTPUT PAGE
// ---------------------------------------------------
app.get("/prompt/:id", async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      promptId: req.params.id,
    }).populate("promptId", "text createdAt");

    if (!dataset) return res.status(404).json({ msg: "Dataset not found" });

    const plain = dataset.toObject();
    plain.promptText = dataset.promptId?.text || "";
    plain.promptCreatedAt = dataset.promptId?.createdAt || null;

    res.json(plain);
  } catch (err) {
    console.error("GET /prompt/:id ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------------------------------------------
// DASHBOARD HISTORY (for "Your Datasets" page)
// ---------------------------------------------------
app.get("/dashboard", async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ msg: "No token" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ msg: "Invalid token" });
  }

  try {
    const history = await Dataset.find({ userId: decoded.id })
      .sort({ createdAt: -1 })
      .populate("promptId", "text createdAt");

    res.json(history);
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------------------------------------------
// SAVE GEMINI API KEY
// ---------------------------------------------------
app.post("/user/apikey", async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ msg: "No token" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ msg: "Invalid token" });
  }

  const { geminiKey } = req.body;
  if (!geminiKey) return res.status(400).json({ msg: "Key required" });

  try {
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { geminiKey },
      { new: true }
    );

    res.json({
      msg: "Gemini API key saved",
      geminiKey: user.geminiKey,
    });
  } catch (err) {
    console.error("API KEY SAVE ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------------------------------------------
// GET GEMINI API KEY
// ---------------------------------------------------
app.get("/user/apikey", async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ msg: "No token" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ msg: "Invalid token" });
  }

  try {
    const user = await User.findById(decoded.id);
    res.json({ geminiKey: user.geminiKey || "" });
  } catch (err) {
    console.error("GET API KEY ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------------------------------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
