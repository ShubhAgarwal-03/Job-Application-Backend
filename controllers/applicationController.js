const Application = require("../models/application");
const Job = require("../models/job");
const Resume = require("../models/resume");
const User = require("../models/user");
const {
  sendApplicationConfirmed,
  sendApplicationAccepted,
  sendApplicationRejected,
} = require("../utils/mailer");

const JOBS_URL = `${process.env.FRONTEND_URL}/jobs`;

// APPLY TO JOB (USER ONLY)
exports.applyToJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const userId = req.user.id;
    const { resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ message: "A resume is required to apply" });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    if (resume.user.toString() !== userId) {
      return res.status(403).json({ message: "That resume does not belong to you" });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const existing = await Application.findOne({ user: userId, job: jobId });
    if (existing) return res.status(400).json({ message: "You have already applied to this job" });

    const application = await Application.create({ user: userId, job: jobId, resume: resumeId });

    // send confirmation email — non-blocking
    const user = await User.findById(userId).select("name email");
    if (user) {
      sendApplicationConfirmed(user.email, user.name, job.title, job.company).catch((e) =>
        console.error("[Mail] Application confirmed:", e.message)
      );
    }

    res.status(201).json({ message: "Applied successfully", application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL APPLICATIONS (ADMIN ONLY)
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("user", "name email")
      .populate("job", "title company description")
      .populate("resume", "id filename createdAt");

    const formatted = applications.map((app) => ({
      id: app._id,
      status: app.status,
      user: { id: app.user._id, name: app.user.name, email: app.user.email },
      job: { id: app.job._id, title: app.job.title, company: app.job.company, description: app.job.description },
      resume: app.resume ? { id: app.resume._id, filename: app.resume.filename, createdAt: app.resume.createdAt } : null,
      createdAt: app.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE APPLICATION STATUS (ADMIN ONLY)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ["pending", "accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const application = await Application.findById(req.params.id)
      .populate("user", "name email")
      .populate("job", "title company");

    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.status !== "pending") {
      return res.status(400).json({ message: "Status already decided" });
    }

    application.status = status;
    await application.save();

    // send status email — non-blocking
    const { user, job } = application;
    if (user?.email) {
      if (status === "accepted") {
        sendApplicationAccepted(user.email, user.name, job.title, job.company, JOBS_URL).catch((e) =>
          console.error("[Mail] Accepted email:", e.message)
        );
      } else if (status === "rejected") {
        sendApplicationRejected(user.email, user.name, job.title, job.company, JOBS_URL).catch((e) =>
          console.error("[Mail] Rejected email:", e.message)
        );
      }
    }

    res.json({ message: "Application status updated", application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// USER: VIEW MY APPLICATIONS
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user.id })
      .populate("job", "title company")
      .populate("resume", "id filename createdAt");

    const formatted = applications
      .filter((app) => app.job) // skip if job was deleted
      .map((app) => ({
        id: app._id,
        status: app.status,
        job: {
          id: app.job?._id,
          title: app.job?.title,
          company: app.job?.company,
        },
        resume: app.resume
          ? { id: app.resume._id, filename: app.resume.filename, createdAt: app.resume.createdAt }
          : null,
        createdAt: app.createdAt,
      }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
