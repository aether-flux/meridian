const express = require("express");
const verifyToken = require("../middlewares/auth");
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskComments,
  createTaskComment,
  createSubTask,
} = require("../controllers/task.controller");

const router = express.Router({ mergeParams: true });

// Apply auth middleware to all task endpoints
router.use(verifyToken);

// Task collection endpoints
router.get("/", getTasks);
router.post("/", createTask);

// Single task endpoints
router.get("/:id", getTaskById);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);
router.get("/:id/comments", getTaskComments);
router.post("/:id/comments", createTaskComment);
router.post("/:id/subtasks", createSubTask);

module.exports = router;
