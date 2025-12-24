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

module.exports = { sendVerificationEmail };
