const express = require("express");
const store = require("../data/store");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/me/spaces", requireAuth, async (req, res) => {
  const memberships = await store.getUserSpaces(req.user.id);
  const spaces = memberships.map((m) => m.space);
  res.json(spaces);
});

router.get("/me/posts", requireAuth, async (req, res) => {
  const posts = await store.getUserPosts(req.user.id);
  res.json(posts);
});

router.get("/me/comments", requireAuth, async (req, res) => {
  const comments = await store.getUserComments(req.user.id);
  res.json(comments);
});

router.get("/me/saved-posts", requireAuth, async (req, res) => {
  const posts = await store.getUserSavedPosts(req.user.id);
  res.json(posts);
});

module.exports = router;
