const express = require("express");
const verifyToken = require("../middlewares/auth");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
} = require("../controllers/project.controller");
const { createTask, getTasks } = require("../controllers/task.controller");
const {
  createSprint,
  getSprints,
} = require("../controllers/sprint.controller");

const router = express.Router({ mergeParams: true });

// Apply auth middleware to all project endpoints
router.use(verifyToken);

// Support both standalone project routes and nested workspace routes
router.post("/", createProject);
router.get("/", getProjects);
router.post("/:slug/projects", createProject);
router.get("/:slug/projects", getProjects);

// Nested task routes under projects: /api/v1/projects/:projectId/tasks
router.post("/:projectId/tasks", createTask);
router.get("/:projectId/tasks", getTasks);

// Nested sprint routes under projects: /api/v1/projects/:projectId/sprints
router.post("/:projectId/sprints", createSprint);
router.get("/:projectId/sprints", getSprints);

router.get("/:id", getProjectById);
router.patch("/:id", updateProject);

module.exports = router;
