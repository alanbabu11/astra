const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },

    // 💳 Credits & Gemini key
    credits: { type: Number, default: 200 },   // user starts with 200
    geminiKey: { type: String, default: "" },  // stored securely in DB
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
