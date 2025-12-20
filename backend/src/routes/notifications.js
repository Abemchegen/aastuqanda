const express = require("express");
const store = require("../data/store");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  res.json(await store.getUserNotifications(req.user.id));
});

router.post("/:notificationId/read", requireAuth, async (req, res) => {
  const ok = await store.markNotificationRead(
    req.user.id,
    req.params.notificationId
  );
  if (!ok) return res.status(404).json({ error: "notification not found" });
  res.json({ ok: true });
});

router.get("/unread-count", requireAuth, async (req, res) => {
  res.json({ count: await store.getUnreadCount(req.user.id) });
});

module.exports = router;
