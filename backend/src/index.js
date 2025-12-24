require("dotenv").config();
const path = require("path");
const fs = require("fs");
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

// Check required environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingVars.join(", ")}`
  );
  process.exit(1);
}

const app = express();

// CORS: allow Render frontend and local dev
const allowedOrigins = [
  "https://aastuquanda-f.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || origin.endsWith(".onrender.com")) {
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

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    cloudinary: { configured: cloudinaryConfigured() },
  });
});

// Simple uploads health endpoint
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

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}/api`);
  if (!cloudinaryConfigured()) {
    console.warn(
      "[warn] Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env"
    );
  }
});
