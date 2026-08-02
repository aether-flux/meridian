const express = require("express");
const verifyToken = require("../middlewares/auth");
const router = express.Router();

router.use(verifyToken);
router.get("/", (req, res) => res.json({ message: "List workspaces" }));

module.exports = router;
