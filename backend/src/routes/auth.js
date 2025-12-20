const express = require("express");
const store = require("../data/store");
const { issueAccessToken, requireAuth } = require("../middleware/auth");
const { sendVerificationEmail } = require("../services/mailer");

const router = express.Router();

// Register (email first, username must be unique and immutable)
router.post("/register", async (req, res) => {
  const { email, password, username } = req.body || {};
  if (!username || !email || !password)
    return res
      .status(400)
      .json({ error: "username, email, password required" });
  const existingEmail = await store.getUserByEmail(email);
  if (existingEmail) return res.status(409).json({ error: "email taken" });
  const existing = await store.getUserByUsername(username);
  if (existing) return res.status(409).json({ error: "username taken" });
  const user = await store.addUser({ username, email, password });
  const verificationToken = await store.createVerificationToken(user.id);
  // Send verification email (best effort)
  try {
    await sendVerificationEmail({
      to: user.email,
      token: verificationToken,
      username: user.username,
    });
    return res.json({
      ok: true,
      id: user.id,
      username: user.username,
      email: user.email,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (err) {
    console.error("Failed to send verification email", err);
    return res.json({
      ok: false,
      id: user.id,
      username: user.username,
      email: user.email,
      message: "Failed to send verification email" + err,
    });
  }
});

// Login (email + password)
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  Promise.resolve(store.getUserByEmail(email))
    .then((user) => {
      if (!user || user.password !== password)
        return res.status(401).json({ error: "invalid credentials" });
      if (!user.isVerified)
        return res.status(403).json({
          error: "email_not_verified",
          message: "Please verify your email before logging in.",
        });
      const accessToken = issueAccessToken(user);
      return store.createRefreshToken(user.id).then((refreshToken) =>
        res.json({
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
          },
        })
      );
    })
    .catch((e) =>
      res.status(500).json({ error: "server", details: String(e) })
    );
});

// Refresh token
router.post("/refresh-token", async (req, res) => {
  const { token } = req.body || {};
  const userId = await store.getUserIdByRefreshToken(token);
  if (!userId) return res.status(401).json({ error: "invalid refresh token" });
  const user = await store.getUserById(userId);
  const accessToken = issueAccessToken(user);
  return res.json({ accessToken });
});

// Verify email
router.post("/verify-email", async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: "token required" });
  const user = await store.verifyEmailByToken(token);
  if (!user)
    return res.status(400).json({
      error: "invalid_or_expired",
      message: "Verification token is invalid or expired.",
    });
  return res.json({ ok: true });
});

// Verify email (GET for emailed link)
router.get("/verify-email", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ error: "token required" });
  const user = await store.verifyEmailByToken(token);
  if (!user)
    return res.status(400).json({
      error: "invalid_or_expired",
      message: "Verification token is invalid or expired.",
    });
  return res.json({ ok: true });
});

// Resend verification email
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email required" });

  const user = await store.getUserByEmail(email);
  if (!user) {
    // Do not leak existence; respond success
    return res.json({
      ok: true,
      message:
        "If that account exists and is unverified, a new verification email has been sent.",
    });
  }
  if (user.isVerified) {
    return res.json({
      ok: true,
      alreadyVerified: true,
      message: "Email already verified. You can log in.",
    });
  }

  const verificationToken = await store.reissueVerificationToken(user.id);
  const sendResult = await sendVerificationEmail({
    to: user.email,
    token: verificationToken,
    username: user.username,
  });

  if (!sendResult?.sent) {
    const isSmtpMissing = sendResult?.reason === "smtp_not_configured";
    const message = isSmtpMissing
      ? "Email is not configured on the server. Contact support to complete verification."
      : "Could not send verification email right now. Please try again.";
    return res.json({
      ok: true,
      emailSent: false,
      reason: sendResult?.reason || "send_failed",
      message,
    });
  }

  return res.json({
    ok: true,
    emailSent: true,
    message: "Verification email re-sent.",
  });
});

// Me
router.get("/me", requireAuth, async (req, res) => {
  const user = await store.getUserById(req.user.id);
  return res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    createdAt: user.createdAt,
  });
});

// Logout
router.post("/logout", requireAuth, async (req, res) => {
  await store.revokeRefreshTokensForUser(req.user.id);
  return res.json({ ok: true });
});

module.exports = router;
