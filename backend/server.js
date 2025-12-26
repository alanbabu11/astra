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

// ---------------------------------------------------
app.get("/", (req, res) => {
  res.json({ msg: "Datagen API working ✅" });
});

// ---------------------------------------------------
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
  if (!name || !phone || !email || !password)
    return res.status(400).json({ msg: "All fields required" });

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      phone,
      email,
      password: hashed,
    });

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
// PROMPT → ML
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
    const user = await User.findById(decoded.id);
    if (!user || user.credits < 10)
      return res.status(400).json({ msg: "Not enough credits" });

    user.credits -= 10;
    await user.save();

    const newPrompt = await Prompt.create({
      userId: decoded.id,
      text: prompt,
      status: "processing",
    });

    await Dataset.create({
      userId: decoded.id,
      promptId: newPrompt._id,
      status: "processing",
    });

    const mlRes = await axios.post("http://127.0.0.1:5001/process", {
      prompt,
      promptId: newPrompt._id.toString(),
    });

    await Dataset.findOneAndUpdate(
      { promptId: newPrompt._id },
      {
        $set: {
          keywords: mlRes.data.generated_keywords || [],
          vector: mlRes.data.vector || [],
          status: "keywords_done",
        },
      }
    );

    await Prompt.findByIdAndUpdate(newPrompt._id, {
      status: "completed",
    });

    res.json({
      promptId: newPrompt._id,
      credits: user.credits,
    });
  } catch (err) {
    console.error("PROMPT ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------------------------------------------
// SCRAPE CALLBACK (SAFE)
// ---------------------------------------------------
app.post("/scrape", async (req, res) => {
  const { promptId, preview, downloadLink, totalItems, errorMessage } = req.body;
  if (!promptId) return res.status(400).json({ msg: "promptId required" });

  try {
    const dataset = await Dataset.findOne({
      promptId: mongoose.Types.ObjectId(promptId),
    });

    // ⛔ Dataset was deleted — ignore ML callback
    if (!dataset) {
      return res.json({ msg: "Dataset already deleted, ignoring scrape" });
    }

    await Dataset.updateOne(
      { _id: dataset._id },
      {
        $set: errorMessage
          ? { status: "failed", errorMessage }
          : {
              preview,
              downloadLink,
              totalItems,
              status: "completed",
              errorMessage: "",
            },
      }
    );

    res.json({ msg: "Final dataset saved" });
  } catch (err) {
    console.error("SCRAPE ERROR:", err);
    res.status(500).json({ msg: "Error updating dataset" });
  }
});

// ---------------------------------------------------
// GET DATASET
// ---------------------------------------------------
app.get("/prompt/:id", async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      promptId: mongoose.Types.ObjectId(req.params.id),
    }).populate("promptId", "text createdAt");

    if (!dataset) return res.status(404).json({ msg: "Dataset not found" });

    res.json({
      ...dataset.toObject(),
      promptText: dataset.promptId?.text || "",
      promptCreatedAt: dataset.promptId?.createdAt || null,
    });
  } catch (err) {
    console.error("GET PROMPT ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------------------------------------------
// DASHBOARD
// ---------------------------------------------------
app.get("/dashboard", async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
// DELETE DATASET + PROMPT (FIXED)
// ---------------------------------------------------
app.delete("/dataset/:promptId", async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const promptObjectId = mongoose.Types.ObjectId(req.params.promptId);

    const dataset = await Dataset.findOne({
      promptId: promptObjectId,
      userId: decoded.id,
    });

    if (!dataset)
      return res.status(404).json({ msg: "Dataset not found" });

    await Dataset.deleteOne({ _id: dataset._id });
    await Prompt.deleteOne({ _id: promptObjectId, userId: decoded.id });

    res.json({ success: true, msg: "Dataset deleted permanently" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------------------------------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
