const express = require("express");
const verifyToken = require("../middlewares/auth");
const {
  createSprint,
  getSprints,
  getSprintById,
  updateSprint,
  addTaskToSprint,
  getSprintTasks,
  removeTaskFromSprint,
} = require("../controllers/sprint.controller");

const router = express.Router({ mergeParams: true });

// Apply auth middleware to all sprint endpoints
router.use(verifyToken);

// Sprint task endpoints
// 3. POST /api/v1/sprints/:sprintId/tasks - Adds a task to a sprint
router.post("/:sprintId/tasks", addTaskToSprint);

// 4. GET /api/v1/sprints/:sprintId/tasks - Lists all tasks assigned to a specific sprint
router.get("/:sprintId/tasks", getSprintTasks);

// DELETE /api/v1/sprints/:sprintId/tasks/:taskId - Removes a task from a sprint
router.delete("/:sprintId/tasks/:taskId", removeTaskFromSprint);

// Single sprint endpoints
router.get("/:sprintId", getSprintById);
router.patch("/:sprintId", updateSprint);

// Sprint collection endpoints
router.post("/", createSprint);
router.get("/", getSprints);

module.exports = router;
