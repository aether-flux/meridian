const express = require("express");
const verifyToken = require("../middlewares/auth");
// const prisma = require('../config/db');
const router = express.Router();

router.use(verifyToken);
router.get("/", (req, res) => res.json({ message: "List tasks" }));
/// DEMO USAGE: How to use Prisma; Of course just for example, do not create new user in task routes
// router.post('/', async (req, res) => {
//   const user = await prisma.user.create({
//     data: {
//       email: 'john@doe.com',
//       passwordHash: 'abcdddff',
//       displayName: 'John Doe',
//     }
//   });
//   console.log(user);
//   res.status(200).json({ user });
// })

module.exports = router;
