const express = require("express");
const store = require("../data/store");
const { requireAuth, maybeAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", maybeAuth, async (req, res) => {
  const spaces = await store.getSpaces();
  if (req.user && Array.isArray(spaces)) {
    const set = await store.getUserMembershipSpaceIds(req.user.id);
    return res.json(spaces.map((s) => ({ ...s, joined: set.has(s.id) })));
  }
  res.json(spaces);
});

// Accept either space id or slug
router.get("/:spaceId", maybeAuth, async (req, res) => {
  const key = req.params.spaceId;
  let space =
    (await store.getSpaceById(key)) || (await store.getSpaceBySlug(key));
  if (!space) return res.status(404).json({ error: "space not found" });
  if (req.user) {
    const set = await store.getUserMembershipSpaceIds(req.user.id);
    space = { ...space, joined: set.has(space.id) };
  }
  res.json(space);
});

router.post("/request", requireAuth, async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  const space = await store.addSpace({
    name,
    description: description || "",
    createdBy: req.user.id,
  });
  res.json(space);
});

router.post("/:spaceId/join", requireAuth, async (req, res) => {
  const space = await store.joinSpace(req.params.spaceId, req.user.id);
  if (!space) return res.status(404).json({ error: "space not found" });
  await store.addNotification({
    userId: req.user.id,
    type: "space_joined",
    payload: { spaceId: space.id, name: space.name },
  });
  res.json({ ok: true, space });
});

router.post("/:spaceId/leave", requireAuth, async (req, res) => {
  const space = await store.leaveSpace(req.params.spaceId, req.user.id);
  if (!space) return res.status(404).json({ error: "space not found" });
  res.json({ ok: true, space });
});

module.exports = router;
