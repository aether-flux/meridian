const { z } = require("zod");
const prisma = require("../config/db");

const dateSchema = z.union([
  z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .transform((val) => new Date(val)),
  z.date(),
]);

const createSprintSchema = z
  .object({
    name: z
      .string({ required_error: "Sprint name is required" })
      .trim()
      .min(1, "Sprint name cannot be empty")
      .max(100, "Sprint name cannot exceed 100 characters"),
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "endDate must be after or equal to startDate",
    path: ["endDate"],
  });

const updateSprintSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Sprint name cannot be empty")
      .max(100, "Sprint name cannot exceed 100 characters")
      .optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "endDate must be after or equal to startDate",
      path: ["endDate"],
    },
  );

const addTaskToSprintSchema = z.object({
  taskId: z
    .string({ required_error: "Task ID is required" })
    .uuid("Task ID must be a valid UUID"),
});

/**
 * Helper to check project and workspace access for a user.
 */
const verifyProjectAccess = async (userId, { slug, projectId }) => {
  let workspace;
  if (slug) {
    workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId },
        },
      },
    });
    if (!workspace) {
      return { error: "Workspace not found", status: 404 };
    }
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...(workspace ? { workspaceId: workspace.id } : {}),
      deletedAt: null,
    },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!project) {
    return { error: "Project not found in this workspace", status: 404 };
  }

  const projectWorkspace = project.workspace;
  const membership = projectWorkspace.members[0];
  const isOwner =
    projectWorkspace.ownerId === userId || membership?.role === "OWNER";

  if (!membership && !isOwner) {
    return {
      error: "Forbidden: You are not a member of this workspace",
      status: 403,
    };
  }

  return { project, workspace: projectWorkspace, membership, isOwner };
};

/**
 * POST /api/v1/workspaces/:slug/projects/:projectId/sprints
 * Creates a new sprint for a project.
 */
const createSprint = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  const slug = req.params.slug || req.body.workspaceSlug;
  const projectId = req.params.projectId || req.body.projectId;

  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  const access = await verifyProjectAccess(userId, { slug, projectId });
  if (access.error) {
    return res.status(access.status).json({ error: access.error });
  }

  const { project, membership, isOwner } = access;

  if (!isOwner && membership?.role === "VIEWER") {
    return res
      .status(403)
      .json({ error: "Forbidden: Viewers cannot create sprints" });
  }

  const parsed = createSprintSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid sprint details",
      details: parsed.error.issues.map(({ path, message }) => ({
        path: path.join("."),
        message,
      })),
    });
  }

  try {
    const sprint = await prisma.sprint.create({
      data: {
        name: parsed.data.name,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        projectId: project.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            identifier: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Sprint created successfully",
      sprint,
    });
  } catch (error) {
    console.error("Sprint creation failed:", error);
    return res
      .status(500)
      .json({ error: "Unable to create sprint", message: error.message });
  }
};

/**
 * GET /api/v1/workspaces/:slug/projects/:projectId/sprints
 * Lists all sprints belonging to that project.
 */
const getSprints = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  const slug = req.params.slug || req.query.workspaceSlug;
  const projectId = req.params.projectId || req.query.projectId;

  if (!projectId) {
    return res
      .status(400)
      .json({ error: "Project ID is required to list sprints" });
  }

  const access = await verifyProjectAccess(userId, { slug, projectId });
  if (access.error) {
    return res.status(access.status).json({ error: access.error });
  }

  const { project } = access;

  try {
    const sprints = await prisma.sprint.findMany({
      where: {
        projectId: project.id,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return res.status(200).json({
      project: {
        id: project.id,
        name: project.name,
        identifier: project.identifier,
      },
      sprints,
    });
  } catch (error) {
    console.error("Failed to fetch sprints:", error);
    return res
      .status(500)
      .json({ error: "Unable to fetch sprints", message: error.message });
  }
};

/**
 * GET /api/v1/sprints/:sprintId
 * Retrieves a single sprint by ID.
 */
const getSprintById = async (req, res) => {
  const { sprintId } = req.params;
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId },
                },
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!sprint) {
      return res.status(404).json({ error: "Sprint not found" });
    }

    const workspace = sprint.project.workspace;
    const isMember =
      workspace.members.length > 0 || workspace.ownerId === userId;
    if (!isMember) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not a member of this workspace" });
    }

    return res.status(200).json({ sprint });
  } catch (error) {
    console.error("Failed to fetch sprint:", error);
    return res
      .status(500)
      .json({ error: "Unable to fetch sprint", message: error.message });
  }
};

/**
 * PATCH /api/v1/sprints/:sprintId
 * Updates sprint details (name, startDate, endDate).
 */
const updateSprint = async (req, res) => {
  const { sprintId } = req.params;
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  const parsed = updateSprintSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid update data",
      details: parsed.error.issues.map(({ path, message }) => ({
        path: path.join("."),
        message,
      })),
    });
  }

  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    });

    if (!sprint) {
      return res.status(404).json({ error: "Sprint not found" });
    }

    const workspace = sprint.project.workspace;
    const membership = workspace.members[0];
    const isOwner =
      workspace.ownerId === userId || membership?.role === "OWNER";

    if (!membership && !isOwner) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not a member of this workspace" });
    }

    if (!isOwner && membership?.role === "VIEWER") {
      return res
        .status(403)
        .json({ error: "Forbidden: Viewers cannot modify sprints" });
    }

    // Verify date range consistency when only one date is updated
    const finalStartDate = parsed.data.startDate || sprint.startDate;
    const finalEndDate = parsed.data.endDate || sprint.endDate;
    if (finalEndDate < finalStartDate) {
      return res
        .status(400)
        .json({ error: "endDate must be after or equal to startDate" });
    }

    const updatedSprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        name: parsed.data.name !== undefined ? parsed.data.name : undefined,
        startDate:
          parsed.data.startDate !== undefined
            ? parsed.data.startDate
            : undefined,
        endDate:
          parsed.data.endDate !== undefined ? parsed.data.endDate : undefined,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Sprint updated successfully",
      sprint: updatedSprint,
    });
  } catch (error) {
    console.error("Sprint update failed:", error);
    return res
      .status(500)
      .json({ error: "Unable to update sprint", message: error.message });
  }
};

/**
 * POST /api/v1/sprints/:sprintId/tasks
 * Adds a task to a sprint (creates a record in sprint_tasks).
 */
const addTaskToSprint = async (req, res) => {
  const { sprintId } = req.params;
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  const parsed = addTaskToSprintSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid task addition details",
      details: parsed.error.issues.map(({ path, message }) => ({
        path: path.join("."),
        message,
      })),
    });
  }

  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    });

    if (!sprint) {
      return res.status(404).json({ error: "Sprint not found" });
    }

    const workspace = sprint.project.workspace;
    const membership = workspace.members[0];
    const isOwner =
      workspace.ownerId === userId || membership?.role === "OWNER";

    if (!membership && !isOwner) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not a member of this workspace" });
    }

    if (!isOwner && membership?.role === "VIEWER") {
      return res
        .status(403)
        .json({ error: "Forbidden: Viewers cannot modify sprint tasks" });
    }

    // Verify task exists and is not deleted
    const task = await prisma.task.findFirst({
      where: {
        id: parsed.data.taskId,
        deletedAt: null,
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Ensure the task belongs to the same project as the sprint
    if (task.projectId !== sprint.projectId) {
      return res.status(400).json({
        error: "Task does not belong to the same project as this sprint",
      });
    }

    // Check if task is already in this sprint
    const existingSprintTask = await prisma.sprintTask.findUnique({
      where: {
        sprintId_taskId: {
          sprintId,
          taskId: task.id,
        },
      },
    });

    if (existingSprintTask) {
      return res
        .status(409)
        .json({ error: "Task is already assigned to this sprint" });
    }

    const sprintTask = await prisma.sprintTask.create({
      data: {
        sprintId,
        taskId: task.id,
      },
      include: {
        task: {
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            project: {
              select: { id: true, name: true, identifier: true },
            },
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Task added to sprint successfully",
      sprintTask: {
        sprintId: sprintTask.sprintId,
        taskId: sprintTask.taskId,
        sprint: sprintTask.sprint,
        task: {
          ...sprintTask.task,
          key: `${sprintTask.task.project.identifier}-${sprintTask.task.number}`,
          formattedIdentifier: `${sprintTask.task.project.identifier}:${sprintTask.task.number}`,
        },
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Task is already assigned to this sprint" });
    }

    console.error("Adding task to sprint failed:", error);
    return res
      .status(500)
      .json({ error: "Unable to add task to sprint", message: error.message });
  }
};

/**
 * GET /api/v1/sprints/:sprintId/tasks
 * Lists all tasks assigned to a specific sprint.
 */
const getSprintTasks = async (req, res) => {
  const { sprintId } = req.params;
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    });

    if (!sprint) {
      return res.status(404).json({ error: "Sprint not found" });
    }

    const workspace = sprint.project.workspace;
    const isMember =
      workspace.members.length > 0 || workspace.ownerId === userId;

    if (!isMember) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not a member of this workspace" });
    }

    const sprintTasks = await prisma.sprintTask.findMany({
      where: {
        sprintId,
        task: {
          deletedAt: null,
          project: { is: { workspaceId: workspace.id } },
        },
      },
      include: {
        task: {
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            project: {
              select: { id: true, name: true, identifier: true },
            },
          },
        },
      },
      orderBy: {
        task: {
          number: "asc",
        },
      },
    });

    const tasks = sprintTasks.map((st) => ({
      ...st.task,
      key: `${st.task.project.identifier}-${st.task.number}`,
      formattedIdentifier: `${st.task.project.identifier}:${st.task.number}`,
    }));

    return res.status(200).json({
      sprint: {
        id: sprint.id,
        name: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        projectId: sprint.projectId,
      },
      tasks,
    });
  } catch (error) {
    console.error("Failed to fetch sprint tasks:", error);
    return res
      .status(500)
      .json({ error: "Unable to fetch sprint tasks", message: error.message });
  }
};

/**
 * DELETE /api/v1/sprints/:sprintId/tasks/:taskId
 * Removes a task from a sprint.
 */
const removeTaskFromSprint = async (req, res) => {
  const { sprintId, taskId } = req.params;
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    });

    if (!sprint) {
      return res.status(404).json({ error: "Sprint not found" });
    }

    const workspace = sprint.project.workspace;
    const membership = workspace.members[0];
    const isOwner =
      workspace.ownerId === userId || membership?.role === "OWNER";

    if (!membership && !isOwner) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not a member of this workspace" });
    }

    if (!isOwner && membership?.role === "VIEWER") {
      return res
        .status(403)
        .json({ error: "Forbidden: Viewers cannot modify sprint tasks" });
    }

    const existingSprintTask = await prisma.sprintTask.findUnique({
      where: {
        sprintId_taskId: {
          sprintId,
          taskId,
        },
      },
    });

    if (!existingSprintTask) {
      return res
        .status(404)
        .json({ error: "Task is not assigned to this sprint" });
    }

    await prisma.sprintTask.delete({
      where: {
        sprintId_taskId: {
          sprintId,
          taskId,
        },
      },
    });

    return res
      .status(200)
      .json({ message: "Task removed from sprint successfully" });
  } catch (error) {
    console.error("Failed to remove task from sprint:", error);
    return res
      .status(500)
      .json({
        error: "Unable to remove task from sprint",
        message: error.message,
      });
  }
};

module.exports = {
  createSprint,
  getSprints,
  getSprintById,
  updateSprint,
  addTaskToSprint,
  getSprintTasks,
  removeTaskFromSprint,
};
