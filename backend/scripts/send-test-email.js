/*
 * Simple SMTP test sender.
 * Usage: node scripts/send-test-email.js recipient@example.com
 * Requires SMTP_* env vars (and optional SMTP_FROM, APP_BASE_URL).
 */

const nodemailer = require("nodemailer");

function getTransport() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error("SMTP_USER/SMTP_PASS not set");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: node scripts/send-test-email.js recipient@example.com");
    process.exit(1);
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = "CampusLoop SMTP test";
  const verifyUrl = `${process.env.APP_BASE_URL || "http://localhost:4000"}/api/auth/verify-email?token=test-token`;
  const text = `This is a test email from CampusLoop.\nVerification link example: ${verifyUrl}`;
  const html = `<p>This is a test email from CampusLoop.</p><p>Verification link example: <a href="${verifyUrl}">${verifyUrl}</a></p>`;

  try {
    const transporter = getTransport();
    const info = await transporter.sendMail({ from, to, subject, text, html });
    console.log("Test email sent", info.messageId || info);
  } catch (err) {
    console.error("Failed to send test email:", err.message || err);
    process.exit(1);
  }
}

main();
