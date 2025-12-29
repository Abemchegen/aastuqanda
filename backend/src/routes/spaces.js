const express = require("express");
const store = require("../data/store");
const multer = require("multer");
const { requireAuth, maybeAuth } = require("../middleware/auth");
const { uploadBuffer, getFolder } = require("../services/cloudinary");
// Memory storage; upload to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

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
  const { name, description, image } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  const space = await store.addSpace({
    name,
    description: description || "",
    image: image || "",
    createdBy: req.user.id,
  });
  res.json(space);
});

// Upload space image (multipart/form-data, field name: image)
router.post(
  "/images",
  requireAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "image required" });
      const result = await uploadBuffer(
        file.buffer,
        file.mimetype,
        getFolder("spaces")
      );
      return res.json({ ok: true, url: result.secure_url });
    } catch (err) {
      return res
        .status(500)
        .json({
          error: "image upload failed",
          details: String((err && err.message) || err),
        });
    }
  }
);

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

router.delete("/:spaceId/", requireAuth, async (req, res) => {
  const ok = await store.deleteSpace(req.params.spaceId, req.user.id);
  if (!ok) return res.status(404).json({ error: "space could not be deleted" });
  res.json({ ok: true });
});

// Update space image (owner only)
router.put("/:spaceId/image", requireAuth, async (req, res) => {
  const { image } = req.body || {};
  const result = await store.updateSpaceImage(
    req.params.spaceId,
    req.user.id,
    image || ""
  );
  if (!result.ok)
    return res
      .status(result.reason === "forbidden" ? 403 : 404)
      .json({ error: result.reason });
  res.json(result.space);
});

// Update space description (owner only)
router.put("/:spaceId/description", requireAuth, async (req, res) => {
  const { description } = req.body || {};
  const result = await store.updateSpaceDescription(
    req.params.spaceId,
    req.user.id,
    description || ""
  );
  if (!result.ok)
    return res
      .status(result.reason === "forbidden" ? 403 : 404)
      .json({ error: result.reason });
  res.json(result.space);
});

// Delete space image (owner only)
router.delete("/:spaceId/image", requireAuth, async (req, res) => {
  const result = await store.updateSpaceImage(
    req.params.spaceId,
    req.user.id,
    ""
  );
  if (!result.ok)
    return res
      .status(result.reason === "forbidden" ? 403 : 404)
      .json({ error: result.reason });
  res.json({ ok: true, space: result.space });
});

module.exports = router;
