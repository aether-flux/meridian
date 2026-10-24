const express = require("express");
const { getInviteByToken } = require("../controllers/invite.controller");

const router = express.Router();

router.get("/:token", getInviteByToken);

module.exports = router;