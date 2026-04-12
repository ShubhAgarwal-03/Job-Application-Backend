const express = require("express");
const router = express.Router();

const {
  createJob,
  getJobs,
  deleteJob,
  getSingleJob,
} = require("../controllers/jobController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// CREATE JOB (ADMIN ONLY)
router.post("/", authMiddleware, authorizeRoles("admin"), createJob);

// GET JOBS (ALL LOGGED IN USERS)
router.get("/", authMiddleware, getJobs);

// Get single job (viewing of a single job after the get all jobs, hence the order)
router.get("/:id", authMiddleware, getSingleJob);

// DELETE JOB (ADMIN ONLY)
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteJob);

module.exports = router;
