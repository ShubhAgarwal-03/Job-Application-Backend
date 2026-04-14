// Uses Brevo (formerly Sendinblue) HTTP API
// No SMTP, no port issues, works on Render free tier
// 300 emails/day free, no domain required

const BASE_STYLES = `
  body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
  .header { padding: 32px 40px 24px; border-bottom: 1px solid #e4e4e7; }
  .logo { font-size: 18px; font-weight: 700; color: #18181b; }
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
  <div class="header"><div class="logo">Job<span>Portal</span></div></div>
  <div class="body">${content}</div>
  <div class="footer">
    <p style="margin:0">You're receiving this because you have an account on JobPortal.${footerNote ? " " + footerNote : ""}</p>
    <p style="margin:4px 0 0">© ${new Date().getFullYear()} JobPortal. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;
}

async function send(to, subject, html) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.MAIL_USER;

  if (!apiKey || !senderEmail) {
    console.warn("[Mail] BREVO_API_KEY or MAIL_USER not set — skipping email to", to);
    return;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "JobPortal", email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("[Mail] Brevo error:", JSON.stringify(data));
    throw new Error(data.message || "Brevo API error");
  }

  console.log("[Mail] Sent to", to);
}

async function sendVerificationEmail(to, name, verifyUrl) {
  await send(to, "Verify your email — JobPortal", baseTemplate(`
    <h1>Verify your email address</h1>
    <p>Hey ${name},</p>
    <p>Thanks for signing up! Click below to verify your email. This link expires in <strong>24 hours</strong>.</p>
    <a href="${verifyUrl}" class="cta">Verify my email</a>
    <p class="muted">Or copy this link into your browser:<br>${verifyUrl}</p>
    <hr class="divider">
    <p class="muted">If you didn't create an account, ignore this email.</p>
  `, "If you didn't sign up, ignore this."));
}

async function sendApplicationConfirmed(to, name, jobTitle, company) {
  await send(to, `Application received: ${jobTitle} at ${company}`, baseTemplate(`
    <h1>Application submitted</h1>
    <p>Hi ${name},</p>
    <p>Your application has been received:</p>
    <div class="highlight-box"><p>${jobTitle} at ${company}</p></div>
    <p>We'll email you as soon as there's an update.</p>
    <p class="muted">Applied on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
  `));
}

async function sendApplicationAccepted(to, name, jobTitle, company, jobsUrl) {
  await send(to, `🎉 You've been accepted — ${jobTitle} at ${company}`, baseTemplate(`
    <h1>Congratulations, ${name}! 🎉</h1>
    <p>Your application has been <strong>accepted</strong>.</p>
    <div class="success-box"><p>${jobTitle} at ${company}</p></div>
    <p>The team was impressed with your profile. Expect to hear from them soon with next steps.</p>
    <ul style="color:#3f3f46;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 20px">
      <li>Review the job description one more time</li>
      <li>Research ${company} — their mission and culture</li>
      <li>Prepare questions for the interviewer</li>
    </ul>
    <a href="${jobsUrl}" class="cta">Browse more opportunities</a>
    <hr class="divider">
    <p class="muted">New roles are added regularly. Keep exploring.</p>
  `));
}

async function sendApplicationRejected(to, name, jobTitle, company, jobsUrl) {
  await send(to, `Update on your application — ${jobTitle}`, baseTemplate(`
    <h1>An update on your application</h1>
    <p>Hi ${name},</p>
    <p>Thank you for applying for <strong>${jobTitle}</strong> at <strong>${company}</strong>. After careful consideration, the team has decided not to move forward at this time.</p>
    <p>This is far from the end of the road.</p>
    <hr class="divider">
    <p><strong>What's next for you?</strong></p>
    <ul style="color:#3f3f46;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 20px">
      <li>Your profile and resume are saved — applying takes seconds</li>
      <li>New jobs are added regularly</li>
      <li>Consider updating your resume with recent projects</li>
    </ul>
    <a href="${jobsUrl}" class="cta cta-secondary">Browse open positions</a>
    <hr class="divider">
    <p class="muted">We'll keep your profile on file. Best of luck — we're rooting for you.</p>
  `));
}

module.exports = {
  sendVerificationEmail,
  sendApplicationConfirmed,
  sendApplicationAccepted,
  sendApplicationRejected,
};