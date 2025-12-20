const nodemailer = require("nodemailer");

function getTransport() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.warn("SMTP_USER/SMTP_PASS not set; email disabled");
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendVerificationEmail({ to, token, username }) {
  const transporter = getTransport();
  if (!transporter) return { sent: false, reason: "smtp_not_configured" };
  const baseUrl =
    process.env.FRONTEND_BASE_URL ||
    process.env.APP_BASE_URL ||
    "http://localhost:5173";
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(
    token
  )}`;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = "Verify your email";
  const text = `Hi ${username},\n\nPlease verify your email by visiting: ${verifyUrl}\n\nIf you did not sign up, you can ignore this email.`;
  const html = `<p>Hi ${username},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">Verify Email</a></p><p>If you did not sign up, you can ignore this email.</p>`;
  try {
    await transporter.sendMail({ from, to, subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error("Failed to send verification email", err);
    return { sent: false, reason: "send_failed" };
  }
}

module.exports = { sendVerificationEmail };
