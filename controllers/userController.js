const User = require("../models/user");

// ⭐ Save Job
exports.saveJob = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.savedJobs.includes(req.params.jobId)) {
      user.savedJobs.push(req.params.jobId);
      await user.save();
    }

    res.json({ message: "Job saved successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ❌ Unsave Job
exports.unsaveJob = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.savedJobs = user.savedJobs.filter(
      (job) => job.toString() !== req.params.jobId
    );

    await user.save();

    res.json({ message: "Job removed from saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📄 Get Saved Jobs
exports.getSavedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("savedJobs");

    res.json(user.savedJobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
