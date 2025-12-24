const express = require("express");
const multer = require("multer");
const store = require("../data/store");
const { requireAuth, maybeAuth } = require("../middleware/auth");
const { uploadBuffer, getFolder } = require("../services/cloudinary");

const router = express.Router();

// Memory storage; upload to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// List + paged + filters
router.get("/", maybeAuth, async (req, res) => {
  const { page, limit, sort, spaceSlug, tag } = req.query;
  const result = await store.listPosts({
    page: page ? parseInt(page, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
    sort: sort || "new",
    spaceSlug,
    tag,
    userId: req.user?.id,
  });
  res.json(result);
});

// Create
router.post("/", requireAuth, async (req, res) => {
  const { title, content, spaceId } = req.body || {};
  if (!title || !content || !spaceId)
    return res.status(400).json({ error: "title, content, spaceId required" });
  const space = await store.getSpaceById(spaceId);
  if (!space) return res.status(404).json({ error: "space not found" });
  const post = await store.addPost({
    title,
    content,
    spaceId,
    authorId: req.user.id,
  });
  res.json(post);
});

// Get by id
router.get("/:postId", maybeAuth, async (req, res) => {
  const post = await store.getPostById(req.params.postId, req.user?.id);
  if (!post) return res.status(404).json({ error: "post not found" });
  res.json(post);
});

// Delete
router.delete("/:postId", requireAuth, async (req, res) => {
  const result = await store.deletePost(req.params.postId, req.user.id);
  if (!result.ok)
    return res
      .status(result.reason === "forbidden" ? 403 : 404)
      .json({ error: result.reason });
  res.json(result);
});

// Edit post (owner only)
router.put("/:postId", requireAuth, async (req, res) => {
  const { title, content } = req.body || {};
  if (!title && !content)
    return res.status(400).json({ error: "title or content required" });
  const result = await store.updatePost({
    id: req.params.postId,
    authorId: req.user.id,
    title,
    content,
  });
  if (!result.ok)
    return res
      .status(result.reason === "forbidden" ? 403 : 404)
      .json({ error: result.reason });
  res.json(result.post);
});

// Vote
router.post("/:postId/vote", requireAuth, async (req, res) => {
  const { type } = req.body || {};
  if (!["upvote", "downvote", "none"].includes(type))
    return res.status(400).json({ error: "type must be upvote|downvote|none" });
  const result = await store.castVote({
    postId: req.params.postId,
    userId: req.user.id,
    type,
  });
  if (!result.ok) return res.status(404).json({ error: "post not found" });
  const currentUserVote = type === "none" ? null : type;
  res.json({ ...result.post, currentUserVote });
});

// Save/Unsave
router.post("/:postId/save", requireAuth, async (req, res) => {
  const ok = await store.savePost({
    postId: req.params.postId,
    userId: req.user.id,
  });
  if (!ok) return res.status(404).json({ error: "user not found" });
  res.json({ ok: true });
});
router.post("/:postId/unsave", requireAuth, async (req, res) => {
  const ok = await store.unsavePost({
    postId: req.params.postId,
    userId: req.user.id,
  });
  if (!ok) return res.status(404).json({ error: "user not found" });
  res.json({ ok: true });
});

// Comments
router.get("/:postId/comments", async (req, res) => {
  const post = await store.getPostById(req.params.postId);
  if (!post) return res.status(404).json({ error: "post not found" });
  const comments = await store.getComments(req.params.postId);
  res.json(comments);
});
router.post("/:postId/comments", requireAuth, async (req, res) => {
  const { content, parentId } = req.body || {};
  if (!content) return res.status(400).json({ error: "content required" });
  const comment = await store.addComment({
    postId: req.params.postId,
    authorId: req.user.id,
    content,
    parentId,
  });
  if (!comment) return res.status(404).json({ error: "post not found" });
  res.json(comment);
});
// Edit comment (owner only)
router.put("/:postId/comments/:commentId", requireAuth, async (req, res) => {
  const { content } = req.body || {};
  if (!content) return res.status(400).json({ error: "content required" });
  const result = await store.updateComment({
    postId: req.params.postId,
    commentId: req.params.commentId,
    userId: req.user.id,
    content,
  });
  if (!result.ok)
    return res
      .status(result.reason === "forbidden" ? 403 : 404)
      .json({ error: result.reason });
  res.json(result.comment);
});
router.delete("/:postId/comments/:commentId", requireAuth, async (req, res) => {
  const result = await store.deleteComment({
    postId: req.params.postId,
    commentId: req.params.commentId,
    userId: req.user.id,
  });
  if (!result.ok)
    return res
      .status(result.reason === "forbidden" ? 403 : 404)
      .json({ error: result.reason });
  res.json({ ok: true });
});

module.exports = router;

// Upload post images (multipart/form-data, field name: images)
router.post(
  "/images",
  requireAuth,
  upload.array("images", 6),
  async (req, res) => {
    try {
      const files = req.files;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "images required" });
      }
      const uploads = await Promise.all(
        files.map((f) => uploadBuffer(f.buffer, f.mimetype, getFolder("posts")))
      );
      const urls = uploads.map((u) => u.secure_url);
      return res.json({ ok: true, urls });
    } catch (err) {
      return res
        .status(500)
        .json({
          error: "images upload failed",
          details: String((err && err.message) || err),
        });
    }
  }
);
