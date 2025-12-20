const mongoose = require("mongoose");

const PromptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prompt", PromptSchema);
