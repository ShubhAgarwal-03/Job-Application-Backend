const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const SavedJob = require("../models/savedJobs");
const Job = require("../models/Job");

// POST /api/saved/:jobId — toggle save/unsave
router.post("/:jobId", authMiddleware, authorizeRoles("user"), async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const existing = await SavedJob.findOne({ user: userId, job: jobId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ message: "Job removed from saved", saved: false });
    }

    await SavedJob.create({ user: userId, job: jobId });
    res.status(201).json({ message: "Job saved", saved: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/saved — get all saved jobs for current user
router.get("/", authMiddleware, authorizeRoles("user"), async (req, res) => {
  try {
    const saved = await SavedJob.find({ user: req.user.id })
      .populate("job", "title company description type createdAt")
      .sort({ createdAt: -1 });

    const formatted = saved.map((s) => ({
      savedId: s._id,
      id: s.job._id,
      title: s.job.title,
      company: s.job.company,
      description: s.job.description,
      type: s.job.type,
      createdAt: s.job.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;