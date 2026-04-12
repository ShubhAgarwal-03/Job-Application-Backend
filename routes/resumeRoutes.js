const express = require("express");
const router = express.Router();

const {
  uploadResume,
  getMyResumes,
  getResumeById,
} = require("../controllers/resumeController");

const authMiddleware = require("../middleware/authMiddleware");

// All resume routes require login
router.post("/upload", authMiddleware, uploadResume);
router.get("/my", authMiddleware, getMyResumes);
router.get("/:id", authMiddleware, getResumeById);

module.exports = router;