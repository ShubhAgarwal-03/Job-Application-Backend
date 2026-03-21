const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Only logged-in users
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "User profile accessed",
    user: req.user,
  });
});

// Only admin
router.get("/admin", authMiddleware,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({
      message: "Admin access granted",
    });
  }
);

module.exports = router;
