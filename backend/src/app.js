const express = require("express");
const cors = require("cors");

const authRouter = require("./routes/auth");
const spacesRouter = require("./routes/spaces");
const postsRouter = require("./routes/posts");
const profilesRouter = require("./routes/profiles");
const notificationsRouter = require("./routes/notifications");
const tagsRouter = require("./routes/tags");
const usersRouter = require("./routes/users");
const { isConfigured: cloudinaryConfigured } = require("./services/cloudinary");

const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RESEND_API_KEY",
  "SMTP_FROM",
];

function ensureEnv() {
  const missing = requiredEnvVars.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

function createApp() {
  ensureEnv();

  const app = express();

  const allowedOrigins = [
    "https://aastuquanda-f.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith(".onrender.com")
        ) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.options("*", cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      time: new Date().toISOString(),
      cloudinary: { configured: cloudinaryConfigured() },
    });
  });

  app.get("/api/uploads/health", (req, res) => {
    res.json({ cloudinaryConfigured: cloudinaryConfigured() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/spaces", spacesRouter);
  app.use("/api/posts", postsRouter);
  app.use("/api/profiles", profilesRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/tags", tagsRouter);
  app.use("/api/users", usersRouter);

  return app;
}

module.exports = { createApp, ensureEnv };
