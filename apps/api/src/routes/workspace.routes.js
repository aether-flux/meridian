const express = require("express");
const verifyToken = require("../middlewares/auth");
const { createInvite } = require("../controllers/invite.controller");
const {
  createWorkspace,
  getWorkspaces,
  getWorkspaceBySlug,
  getWorkspaceDashboard,
} = require("../controllers/workspace.controller");
const {
  createProject,
  getProjects,
} = require("../controllers/project.controller");
const { createTask, getTasks } = require("../controllers/task.controller");
const {
  createSprint,
  getSprints,
} = require("../controllers/sprint.controller");

const router = express.Router();

// Apply auth middleware to all workspace endpoints
router.use(verifyToken);

// 1. POST /api/v1/workspaces - Creates a workspace with auto-generated slug and OWNER member
router.post("/", createWorkspace);
router.post("/:slug/invites", createInvite);

// 2. GET /api/v1/workspaces - Lists all workspaces where the logged-in user is a member
router.get("/", getWorkspaces);
router.get("/:slug/dashboard", getWorkspaceDashboard);

// Nested task routes:
// POST /api/v1/workspaces/:slug/projects/:projectId/tasks - Creates a task with auto-incremented number
router.post("/:slug/projects/:projectId/tasks", createTask);

// GET /api/v1/workspaces/:slug/projects/:projectId/tasks - Lists tasks with filters (status, priority, search)
router.get("/:slug/projects/:projectId/tasks", getTasks);

// Nested sprint routes:
// 1. POST /api/v1/workspaces/:slug/projects/:projectId/sprints - Creates a new sprint for a project
router.post("/:slug/projects/:projectId/sprints", createSprint);

// 2. GET /api/v1/workspaces/:slug/projects/:projectId/sprints - Lists all sprints belonging to that project
router.get("/:slug/projects/:projectId/sprints", getSprints);

// 3. POST /api/v1/workspaces/:slug/projects - Creates project inside workspace with admin/owner check and unique identifier
router.post("/:slug/projects", createProject);

// 4. GET /api/v1/workspaces/:slug/projects - Lists all projects for that workspace
router.get("/:slug/projects", getProjects);

// GET /api/v1/workspaces/:slug - Get workspace details by slug
router.get("/:slug", getWorkspaceBySlug);

module.exports = router;
