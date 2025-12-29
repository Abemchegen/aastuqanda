const axios = require("axios");

function getTransport() {
  const apiKey = process.env.RESEND_API_KEY || process.env.SMTP_PASS;
  if (!apiKey) {
    console.warn("RESEND_API_KEY or SMTP_PASS not set; email disabled");
    return null;
  }
  return { apiKey };
}

async function sendVerificationEmail({ to, token, username }) {
  const transport = getTransport();
  if (!transport) return { sent: false, reason: "api_key_not_configured" };
  const baseUrl =
    process.env.FRONTEND_BASE_URL ||
    process.env.APP_BASE_URL ||
    "http://localhost:5173";
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(
    token
  )}`;
  const from = process.env.SMTP_FROM || "noreply@yourdomain.com";
  const subject = "Verify your email";
  const text = `Hi ${username},\n\nPlease verify your email by visiting: ${verifyUrl}\n\nIf you did not sign up, you can ignore this email.`;
  const html = `<p>Hi ${username},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">Verify Email</a></p><p>If you did not sign up, you can ignore this email.</p>`;

  try {
    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from,
        to: [to],
        subject,
        text,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${transport.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data.id) {
      return { sent: true };
    } else {
      throw new Error("Failed to send email");
    }
  } catch (err) {
    console.error(
      "Failed to send verification email",
      err.response?.data || err.message
    );
    return { sent: false, reason: "send_failed" };
  }
}
async function sendResetEmail({ to, token, username }) {
  const transport = getTransport();
  if (!transport) {
    console.log("Email transport not configured");
    return { sent: false, reason: "api_key_not_configured" };
  }
  const baseUrl =
    process.env.FRONTEND_BASE_URL ||
    process.env.APP_BASE_URL ||
    "http://localhost:5173";
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(
    token
  )}`;
  const from = process.env.SMTP_FROM || "noreply@yourdomain.com";
  const subject = "Reset your password";
  const text = `Hi ${username},\n\nTo reset your password, visit: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `<p>Hi ${username},</p><p>To reset your password, click the link below:</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you did not request this, you can ignore this email.</p>`;

  console.log("=== RESET EMAIL DEBUG ===");
  console.log("To:", to);
  console.log("From:", from);
  console.log("Subject:", subject);
  console.log("Reset URL:", resetUrl);
  console.log("Token:", token);
  console.log("=========================");

  console.log("Attempting to send reset email to:", to);
  try {
    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from,
        to: [to],
        subject,
        text,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${transport.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Resend API response:", response.data);
    if (response.data.id) {
      console.log("Email sent successfully");
      return { sent: true };
    } else {
      console.log("Email send failed, no ID in response");
      throw new Error("Failed to send email");
    }
  } catch (err) {
    console.error(
      "Failed to send reset email:",
      err.response?.data || err.message
    );
    return { sent: false, reason: "send_failed" };
  }
}

module.exports = { sendVerificationEmail, sendResetEmail };
