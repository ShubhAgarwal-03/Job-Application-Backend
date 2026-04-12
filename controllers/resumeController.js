const Resume = require("../models/resume");


const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB cap

// POST /resumes/upload
// User uploads a PDF resume — stored as base64 in MongoDB
exports.uploadResume = async (req, res) => {
  try {
    const { filename, data, mimeType } = req.body;

    if (!data || !filename) {
      return res.status(400).json({ message: "filename and data are required" });
    }

    // validate it's a PDF by mime type
    if (mimeType && !mimeType.includes("pdf")) {
      return res.status(400).json({ message: "Only PDF files are accepted" });
    }
 
    // check decoded size — base64 is ~33% larger than raw
    const estimatedBytes = Math.round((data.length * 3) / 4);
    if (estimatedBytes > MAX_SIZE_BYTES) {
      return res.status(400).json({ message: "Resume must be under 5MB" });
    }

    const resume = await Resume.create({
      user: req.user.id,
      filename,
      data,
      mimeType: mimeType || "application/pdf",
    });

    res.status(201).json({
      message: "Resume uploaded successfully",
      resume: {
        id: resume._id,
        filename: resume.filename,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /resumes/my
// Returns all resumes for the logged-in user (without the raw data for speed)
exports.getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id })
      .select("-data")  // exclude base64 blob from list view
      .sort({ createdAt: -1 });
 
    res.json(resumes.map((r) => ({
      id: r._id,
      filename: r.filename,
      createdAt: r.createdAt,
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /resumes/:id
// Returns full resume including base64 data (for preview/autofill)
exports.getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Only the owner or an admin can fetch the full data
    if (resume.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      id: resume._id,
      filename: resume.filename,
      data: resume.data,
      mimeType: resume.mimeType,
      createdAt: resume.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};