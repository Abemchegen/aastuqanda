const express = require("express");
const store = require("../data/store");

const router = express.Router();

router.get("/", async (req, res) => {
  res.json(await store.listTags());
});

module.exports = router;
