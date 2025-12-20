const express = require("express");
const path = require("path");
const multer = require("multer");
const store = require("../data/store");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Basic disk storage for avatars
const storage = multer.diskStorage({
  destination: (_, __, cb) =>
    cb(null, path.join(__dirname, "..", "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `avatar-${req.user.id}${ext || ""}`);
  },
});
const upload = multer({ storage });

router.get("/:username", async (req, res) => {
  const profile = await store.getPublicProfile(req.params.username);
  if (!profile) return res.status(404).json({ error: "user not found" });
  res.json(profile);
});

router.put("/update", requireAuth, async (req, res) => {
  const updated = await store.updateProfile(req.user.id, req.body || {});
  if (!updated) return res.status(404).json({ error: "user not found" });
  res.json({
    ok: true,
    user: {
      id: updated.id,
      username: updated.username,
      bio: updated.bio,
      avatar: updated.avatar,
    },
  });
});

// Avatar upload (multipart/form-data, field name: avatar)
router.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req, res) => {
    if (!req.file)
      return res.status(400).json({ error: "avatar file required" });
    const avatarPath = `/uploads/${req.file.filename}`;
    const updated = await store.updateProfile(req.user.id, {
      avatar: avatarPath,
    });
    res.json({
      ok: true,
      avatar: avatarPath,
      user: {
        id: updated.id,
        username: updated.username,
        avatar: updated.avatar,
      },
    });
  }
);

module.exports = router;
