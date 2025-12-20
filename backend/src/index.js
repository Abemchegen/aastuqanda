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

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists for avatar uploads
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
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
});
