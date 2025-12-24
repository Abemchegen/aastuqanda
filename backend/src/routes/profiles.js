const express = require("express");
const multer = require("multer");
const store = require("../data/store");
const { requireAuth } = require("../middleware/auth");
const { uploadBuffer, getFolder } = require("../services/cloudinary");

const router = express.Router();

// Memory storage; we upload to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

router.get("/:username", async (req, res) => {
  const profile = await store.getPublicProfile(req.params.username);
  if (!profile) return res.status(404).json({ error: "user not found" });
  res.json(profile);
});

// Public: list posts by username
router.get("/:username/posts", async (req, res) => {
  const user = await store.getUserByUsername(req.params.username);
  if (!user) return res.status(404).json({ error: "user not found" });
  const posts = await store.getUserPostsPublic(user.id);
  res.json(posts);
});

// Public: list comments by username
router.get("/:username/comments", async (req, res) => {
  const user = await store.getUserByUsername(req.params.username);
  if (!user) return res.status(404).json({ error: "user not found" });
  const comments = await store.getUserComments(user.id);
  res.json(comments);
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
    try {
      if (!req.file)
        return res.status(400).json({ error: "avatar file required" });
      const result = await uploadBuffer(
        req.file.buffer,
        req.file.mimetype,
        getFolder("avatars")
      );
      const avatarUrl = result.secure_url;
      const updated = await store.updateProfile(req.user.id, {
        avatar: avatarUrl,
      });
      res.json({
        ok: true,
        avatar: avatarUrl,
        user: {
          id: updated.id,
          username: updated.username,
          avatar: updated.avatar,
        },
      });
    } catch (err) {
      res
        .status(500)
        .json({
          error: "avatar upload failed",
          details: String((err && err.message) || err),
        });
    }
  }
);

module.exports = router;
