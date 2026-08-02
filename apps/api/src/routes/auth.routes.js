const express = require("express");
const router = express.Router();

router.post("/register", (req, res) =>
  res.json({ message: "Auth register route" }),
);
router.post("/login", (req, res) => res.json({ message: "Auth login route" }));

module.exports = router;
