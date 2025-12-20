const mongoose = require("mongoose");

const KeywordSchema = new mongoose.Schema(
  {
    promptId: { type: mongoose.Schema.Types.ObjectId, ref: "Prompt", required: true },
    keyword: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Keyword", KeywordSchema);
