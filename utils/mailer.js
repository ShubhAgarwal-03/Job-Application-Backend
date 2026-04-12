const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Base styles shared across all emails
const BASE_STYLES = `
  body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .header { padding: 32px 40px 24px; border-bottom: 1px solid #e4e4e7; }
  .logo { font-size: 18px; font-weight: 700; color: #18181b; letter-spacing: -0.3px; }
  .logo span { color: #2563eb; }
  .body { padding: 32px 40px; }
  .footer { padding: 20px 40px; background: #f9fafb; border-top: 1px solid #e4e4e7; font-size: 12px; color: #9ca3af; }
  h1 { margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #18181b; line-height: 1.3; }
  p { margin: 0 0 16px; font-size: 15px; color: #3f3f46; line-height: 1.6; }
  .cta { display: inline-block; margin: 8px 0 24px; padding: 12px 28px; background: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; }
  .cta-secondary { background: #18181b; }
  .highlight-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
  .highlight-box p { margin: 0; color: #0369a1; font-weight: 500; }
  .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
  .success-box p { margin: 0; color: #15803d; font-weight: 500; }
  .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
  .muted { font-size: 13px; color: #71717a; }
`;

function baseTemplate(content, footerNote = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${BASE_STYLES}</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">Job<span>Portal</span></div>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p style="margin:0">You're receiving this because you have an account on JobPortal.${footerNote ? " " + footerNote : ""}</p>
    <p style="margin:4px 0 0">© ${new Date().getFullYear()} JobPortal. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;
}

// ── Email 1: Verify email ──────────────────────────────────────────────────
function verificationEmail(name, verifyUrl) {
  const content = `
    <h1>Verify your email address</h1>
    <p>Hey ${name},</p>
    <p>Thanks for signing up! Click the button below to verify your email address and activate your account. This link expires in <strong>24 hours</strong>.</p>
    <a href="${verifyUrl}" class="cta">Verify my email</a>
    <p class="muted">If the button doesn't work, copy and paste this link into your browser:<br>${verifyUrl}</p>
    <hr class="divider">
    <p class="muted">If you didn't create an account, you can safely ignore this email.</p>
  `;
  return baseTemplate(content, "If you didn't sign up, ignore this email.");
}

// ── Email 2: Application confirmed ────────────────────────────────────────
function applicationConfirmedEmail(name, jobTitle, company) {
  const content = `
    <h1>Application submitted</h1>
    <p>Hi ${name},</p>
    <p>Your application has been received. Here's a summary:</p>
    <div class="highlight-box">
      <p>${jobTitle} at ${company}</p>
    </div>
    <p>The hiring team will review your application and reach out if there's a match. We'll email you as soon as there's an update.</p>
    <p class="muted">Applied on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
  `;
  return baseTemplate(content);
}

// ── Email 3: Application accepted ─────────────────────────────────────────
function applicationAcceptedEmail(name, jobTitle, company, jobsUrl) {
  const content = `
    <h1>Congratulations, ${name}! 🎉</h1>
    <p>We have great news — your application has been <strong>accepted</strong>.</p>
    <div class="success-box">
      <p>${jobTitle} at ${company}</p>
    </div>
    <p>The team was impressed with your profile and would like to move forward. Expect to hear from them soon with next steps — keep an eye on your inbox.</p>
    <p>In the meantime, here's what we'd recommend:</p>
    <ul style="color:#3f3f46; font-size:15px; line-height:1.8; padding-left:20px; margin:0 0 20px">
      <li>Review the job description one more time so you're fully prepared</li>
      <li>Research ${company} — their mission, recent news, and culture</li>
      <li>Prepare a few questions to ask the interviewer</li>
    </ul>
    <a href="${jobsUrl}" class="cta">Browse more opportunities</a>
    <hr class="divider">
    <p class="muted">There are always new roles being added to JobPortal. Keep exploring — your next big move might already be listed.</p>
  `;
  return baseTemplate(content);
}

// ── Email 4: Application rejected ─────────────────────────────────────────
function applicationRejectedEmail(name, jobTitle, company, jobsUrl) {
  const content = `
    <h1>An update on your application</h1>
    <p>Hi ${name},</p>
    <p>Thank you for applying for <strong>${jobTitle}</strong> at <strong>${company}</strong>. After careful consideration, the team has decided not to move forward with your application at this time.</p>
    <p>We know this isn't the news you were hoping for — but this is far from the end of the road.</p>
    <hr class="divider">
    <p><strong>What's next for you?</strong></p>
    <p>Job searching is a process, and every application is a step forward. Here's how to keep the momentum going:</p>
    <ul style="color:#3f3f46; font-size:15px; line-height:1.8; padding-left:20px; margin:0 0 20px">
      <li>Your profile and resume are already saved — applying to new roles takes seconds</li>
      <li>New jobs are added regularly — the right one might already be waiting</li>
      <li>Consider updating your resume with any recent projects or skills</li>
    </ul>
    <a href="${jobsUrl}" class="cta cta-secondary">Browse open positions</a>
    <hr class="divider">
    <p class="muted">We'll keep your profile on file. If a role that matches your background opens up, we want you to be the first to know.</p>
    <p class="muted">Best of luck — we're rooting for you.</p>
  `;
  return baseTemplate(content, "If you have questions, reply to this email.");
}

// ── Send helpers ───────────────────────────────────────────────────────────
async function sendVerificationEmail(to, name, verifyUrl) {
  await transporter.sendMail({
    from: `"JobPortal" <${process.env.MAIL_USER}>`,
    to,
    subject: "Verify your email — JobPortal",
    html: verificationEmail(name, verifyUrl),
  });
}

async function sendApplicationConfirmed(to, name, jobTitle, company) {
  await transporter.sendMail({
    from: `"JobPortal" <${process.env.MAIL_USER}>`,
    to,
    subject: `Application received: ${jobTitle} at ${company}`,
    html: applicationConfirmedEmail(name, jobTitle, company),
  });
}

async function sendApplicationAccepted(to, name, jobTitle, company, jobsUrl) {
  await transporter.sendMail({
    from: `"JobPortal" <${process.env.MAIL_USER}>`,
    to,
    subject: `🎉 You've been accepted — ${jobTitle} at ${company}`,
    html: applicationAcceptedEmail(name, jobTitle, company, jobsUrl),
  });
}

async function sendApplicationRejected(to, name, jobTitle, company, jobsUrl) {
  await transporter.sendMail({
    from: `"JobPortal" <${process.env.MAIL_USER}>`,
    to,
    subject: `Update on your application — ${jobTitle}`,
    html: applicationRejectedEmail(name, jobTitle, company, jobsUrl),
  });
}

module.exports = {
  sendVerificationEmail,
  sendApplicationConfirmed,
  sendApplicationAccepted,
  sendApplicationRejected,
};