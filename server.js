const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const rateLimit = require("express-rate-limit");
// const authRoutes = require("./routes/authRoutes")


// Load env
dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb"}));    //increased limit for base64 pdf payload


// Rate limiting on auth routes — max 20 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authLimiter, authRoutes);



//// testing of it ////////////
const testRoutes = require("./routes/testRoute");
app.use("/api/test", testRoutes);

const jobRoutes = require("./routes/jobRoutes");
app.use("/api/jobs", jobRoutes);

const applicationRoutes = require("./routes/applicationRoutes");
app.use("/api/applications", applicationRoutes);

const resumeRoutes = require("./routes/resumeRoutes");
app.use("/api/resumes", resumeRoutes);

const aiRoutes = require("./routes/aiRoutes");
app.use("/api/ai", aiRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const savedJobsRoutes = require("./routes/savedJobsRoutes");
app.use("/api/saved", savedJobsRoutes);
 

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
