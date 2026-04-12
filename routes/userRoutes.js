const express = require("express");
const router = express.Router();

const {
  saveJob,
  unsaveJob,
  getSavedJobs,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

// ⭐ Save job
router.post("/save-job/:jobId", authMiddleware, saveJob);

// ❌ Unsave job
router.delete("/save-job/:jobId", authMiddleware, unsaveJob);

// 📄 Get saved jobs
router.get("/saved-jobs", authMiddleware, getSavedJobs);

module.exports = router;

