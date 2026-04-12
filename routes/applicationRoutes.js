const express = require("express");
const router = express.Router();

const {
  applyToJob,
  getAllApplications,
  updateApplicationStatus,
  getMyApplications,
} = require("../controllers/applicationController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// ORDER MATTERS — specific routes before parameterised ones

// User: my applications — must be before /:id or Express matches "my" as an id
router.get("/my", authMiddleware, authorizeRoles("user"), getMyApplications);

// Admin: all applications
router.get("/", authMiddleware, authorizeRoles("admin"), getAllApplications);

// User: apply to a job — resumeId must be in req.body
router.post("/:jobId", authMiddleware, authorizeRoles("user"), applyToJob);

// Admin: update status
router.put("/:id", authMiddleware, authorizeRoles("admin"), updateApplicationStatus);

module.exports = router;