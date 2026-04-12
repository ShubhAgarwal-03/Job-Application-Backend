const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/mailer");

// accepted mail domains
const ALLOWED_DOMAINS = [
  "gmail.com", "yahoo.com", "yahoo.co.in", "yahoo.co.uk",
  "outlook.com", "hotmail.com", "hotmail.co.uk",
  "icloud.com", "me.com", "mac.com",
  "protonmail.com", "proton.me",
  "live.com", "msn.com",
];

function isAllowedEmail(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isAllowedEmail(normalizedEmail)) {
      return res.status(400).json({
        message: "Please use a valid email from Gmail, Yahoo, Outlook, iCloud, or ProtonMail",
      });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      // if they exist but aren't verified, resend the verification email
      if (!userExists.isVerified) {
        const verificationToken = crypto.randomBytes(32).toString("hex");      // generate a secure verification token
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);     //24h

        userExists.verificationToken = verificationToken;
        userExists.verificationTokenExpiry = verificationTokenExpiry;
        await userExists.save();

        const verifyUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
        console.log("[Auth] Resent verification URL:", verifyUrl);                // log it so you can test manually

        sendVerificationEmail(normalizedEmail, userExists.name, verifyUrl).catch((err) => {
          console.error("[Mail] Failed:", err.message);
        });

        return res.status(200).json({
          message: "Account already exists but is unverified. A new verification email has been sent.",
        });
      }
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log("[Auth] Creating user:", normalizedEmail);
    console.log("[Auth] Token to save:", verificationToken.slice(0, 16) + "...");
    console.log("[Auth] Expiry:", verificationTokenExpiry);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      isVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    // confirm what was actually saved
    console.log("[Auth] User saved, id:", user._id);
    console.log("[Auth] Saved token:", user.verificationToken?.slice(0, 16) + "...");
    console.log("[Auth] Saved expiry:", user.verificationTokenExpiry);

    const verifyUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
    console.log("[Auth] Verification URL:", verifyUrl);

    sendVerificationEmail(normalizedEmail, name.trim(), verifyUrl).catch((err) => {
      console.error("[Mail] Failed to send verification email:", err.message);
    });

    res.status(201).json({
      message: "Account created! Please check your email to verify your account before logging in.",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("[Auth] Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    console.log("[Auth] Verifying token:", token?.slice(0, 16) + "...");
    console.log("[Auth] Current time:", new Date());

    // first check if token exists at all, ignoring expiry
    const userByToken = await User.findOne({ verificationToken: token });
    console.log("[Auth] User found by token:", userByToken ? userByToken.email : "NONE");

    if (userByToken) {
      console.log("[Auth] Token expiry:", userByToken.verificationTokenExpiry);
      console.log("[Auth] Is expired:", userByToken.verificationTokenExpiry < new Date());
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },     // not expired
    });

    if (!user) {
      return res.status(400).json({
        message: userByToken
          ? "Verification link has expired. Please register again to get a new link."
          : "Invalid verification link. Please register again.",
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    console.log("[Auth] Email verified for:", user.email);
    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("[Auth] Verify error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

     // admins skip email verification — they're created manually and trusted
    if (user.role !== "admin" && !user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in. Check your inbox for the verification link.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};