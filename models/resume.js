const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    // base64-encoded PDF data — keeps stack simple, no S3 needed
    data: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: "application/pdf",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Resume || mongoose.model("Resume", resumeSchema);