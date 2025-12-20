const mongoose = require("mongoose");

const DatasetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    promptId: { type: mongoose.Schema.Types.ObjectId, ref: "Prompt", required: true },

    // Step 1 → ML Response
    keywords: [String],      // ML-generated keywords
    vector: [Number],        // embedding vector

    // Step 2 → Scraper Response (preview)
    preview: [
      {
        title: String,
        url: String,
        content: String,
        keywordUsed: String,
      },
    ],

    downloadLink: String,    // full JSON dataset
    totalItems: Number,      // total scraped items

    status: {
      type: String,
      enum: ["processing", "keywords_done", "completed", "failed"],
      default: "processing",
    },

    errorMessage: String,    // optional error field
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dataset", DatasetSchema);
