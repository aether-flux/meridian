const { z } = require("zod");
const prisma = require("../config/db");

const taskStatusEnum = z.enum([
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELLED",
]);
const priorityEnum = z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"]);

const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Task title is required" })
    .trim()
    .min(1, "Task title cannot be empty")
    .max(255, "Task title cannot exceed 255 characters"),
  description: z.string().trim().max(10000).optional().nullable(),
  status: z.preprocess(
    (val) => (typeof val === "string" ? val.toUpperCase() : val),
    taskStatusEnum.optional().default("TODO"),
  ),
  priority: z.preprocess(
    (val) => (typeof val === "string" ? val.toUpperCase() : val),
    priorityEnum.optional().default("NONE"),
  ),
  dueDate: z
    .union([
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid dueDate format",
        })
        .transform((val) => new Date(val)),
      z.date(),
    ])
    .optional()
    .nullable(),
  parentId: z
    .string()
    .uuid("Parent task ID must be a valid UUID")
    .optional()
    .nullable(),
  assigneeIds: z
    .array(z.string().uuid("Assignee ID must be a valid UUID"))
    .optional(),
});

const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title cannot be empty")
    .max(255, "Task title cannot exceed 255 characters")
    .optional(),
  description: z.string().trim().max(10000).optional().nullable(),
  status: z.preprocess(
    (val) => (typeof val === "string" ? val.toUpperCase() : val),
    taskStatusEnum.optional(),
  ),
  priority: z.preprocess(
    (val) => (typeof val === "string" ? val.toUpperCase() : val),
    priorityEnum.optional(),
  ),
  dueDate: z
    .union([
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid dueDate format",
        })
        .transform((val) => new Date(val)),
      z.date(),
    ])
    .optional()
    .nullable(),
  parentId: z
    .string()
    .uuid("Parent task ID must be a valid UUID")
    .optional()
    .nullable(),
  assigneeIds: z
    .array(z.string().uuid("Assignee ID must be a valid UUID"))
    .optional(),
});

/**
 * Format a task object to include computed display keys (e.g. 'PROJ-01-1' and 'PROJ-01:1').
 */
const formatTask = (task, projectIdentifier = null) => {
  const identifier = projectIdentifier || task.project?.identifier || "TASK";
  return {
    ...task,
    key: `${identifier}-${task.number}`,
    formattedIdentifier: `${identifier}:${task.number}`,
  };
};

/**
 * Helper to check workspace & project access for a user.
 */
const verifyProjectAccess = async (userId, { slug, projectId }) => {
  // If slug is provided, find workspace by slug first
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

  // Find project and its workspace
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
 * POST /api/v1/workspaces/:slug/projects/:projectId/tasks
 * Creates a task with an auto-incremented 'number' relative to the project.
 */
const createTask = async (req, res) => {
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

  const { project, workspace, membership, isOwner } = access;

  if (!isOwner && membership?.role === "VIEWER") {
    return res
      .status(403)
      .json({ error: "Forbidden: Viewers cannot create tasks" });
  }

  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid task details",
      details: parsed.error.issues.map(({ path, message }) => ({
        path: path.join("."),
        message,
      })),
    });
  }

  try {
    // Foreign key check: parentId
    if (parsed.data.parentId) {
      const parentTask = await prisma.task.findFirst({
        where: {
          id: parsed.data.parentId,
          projectId: project.id,
          deletedAt: null,
        },
      });
      if (!parentTask) {
        return res
          .status(400)
          .json({ error: "Parent task not found in this project" });
      }
    }

    // Foreign key check: assigneeIds
    if (parsed.data.assigneeIds && parsed.data.assigneeIds.length > 0) {
      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: workspace.id,
          userId: { in: parsed.data.assigneeIds },
        },
        select: { userId: true },
      });
      const validUserIds = new Set(workspaceMembers.map((m) => m.userId));
      const invalidAssignees = parsed.data.assigneeIds.filter(
        (id) => !validUserIds.has(id),
      );
      if (invalidAssignees.length > 0) {
        return res.status(400).json({
          error: "One or more assignees are not members of this workspace",
          invalidAssignees,
        });
      }
    }

    // Calculate next auto-increment task number for this project
    const maxTask = await prisma.task.aggregate({
      where: { projectId: project.id },
      _max: { number: true },
    });
    const nextNumber = (maxTask._max.number ?? 0) + 1;

    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        number: nextNumber,
        title: parsed.data.title,
        description: parsed.data.description || null,
        status: parsed.data.status || "TODO",
        priority: parsed.data.priority || "NONE",
        dueDate: parsed.data.dueDate || null,
        parentId: parsed.data.parentId || null,
        createdById: userId,
        assignees: parsed.data.assigneeIds?.length
          ? {
              create: parsed.data.assigneeIds.map((assigneeId) => ({
                userId: assigneeId,
              })),
            }
          : undefined,
      },
      include: {
        createdBy: {
          select: { id: true, email: true, displayName: true, avatarUrl: true },
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
    });

    return res.status(201).json({
      message: "Task created successfully",
      task: formatTask(task, project.identifier),
    });
  } catch (error) {
    console.error("Task creation failed:", error);
    return res
      .status(500)
      .json({ error: "Unable to create task", message: error.message });
  }
};

/**
 * GET /api/v1/workspaces/:slug/projects/:projectId/tasks
 * Lists tasks with optional filters: status, priority, search keyword.
 */
const getTasks = async (req, res) => {
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
      .json({ error: "Project ID is required to list tasks" });
  }

  const access = await verifyProjectAccess(userId, { slug, projectId });
  if (access.error) {
    return res.status(access.status).json({ error: access.error });
  }

  const { project, workspace } = access;

  // Build query filters
  const where = {
    projectId: project.id,
    project: { is: { workspaceId: workspace.id } },
    deletedAt: null,
  };

  // Status filter (supports comma-separated list: ?status=TODO,IN_PROGRESS)
  if (req.query.status) {
    const statuses = req.query.status
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) =>
        ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"].includes(s),
      );
    if (statuses.length > 0) {
      where.status = { in: statuses };
    }
  }

  // Priority filter (supports comma-separated list: ?priority=URGENT,HIGH)
  if (req.query.priority) {
    const priorities = req.query.priority
      .split(",")
      .map((p) => p.trim().toUpperCase())
      .filter((p) => ["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"].includes(p));
    if (priorities.length > 0) {
      where.priority = { in: priorities };
    }
  }

  // Search keyword in title or description
  const search = req.query.search || req.query.keyword || req.query.q;
  if (search && typeof search === "string" && search.trim()) {
    const trimmed = search.trim();
    const orConditions = [
      { title: { contains: trimmed, mode: "insensitive" } },
      { description: { contains: trimmed, mode: "insensitive" } },
    ];

    // If search term is a number, also match task number
    const parsedNumber = parseInt(trimmed, 10);
    if (!isNaN(parsedNumber)) {
      orConditions.push({ number: parsedNumber });
    }

    where.OR = orConditions;
  }

  // Optional assignee filter
  if (req.query.assigneeId) {
    where.assignees = {
      some: {
        userId: req.query.assigneeId,
      },
    };
  }

  try {
    const tasks = await prisma.task.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, email: true, displayName: true, avatarUrl: true },
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
        _count: {
          select: {
            comments: true,
            subTasks: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: {
        number: "asc",
      },
    });

    const formattedTasks = tasks.map((task) =>
      formatTask(task, project.identifier),
    );

    return res.status(200).json({
      project: {
        id: project.id,
        name: project.name,
        identifier: project.identifier,
      },
      tasks: formattedTasks,
    });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return res
      .status(500)
      .json({ error: "Unable to fetch tasks", message: error.message });
  }
};

/**
 * GET /api/v1/tasks/:id
 * Fetches a single task by ID.
 */
const getTaskById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  try {
    const task = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
        project: {
          is: {
            workspace: {
              is: {
                OR: [
                  { ownerId: userId },
                  { members: { some: { userId } } },
                ],
              },
            },
          },
        },
      },
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
        createdBy: {
          select: { id: true, email: true, displayName: true, avatarUrl: true },
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
        parent: {
          select: { id: true, number: true, title: true, status: true },
        },
        subTasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            priority: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const workspace = task.project.workspace;
    const isMember = workspace.members.length > 0;
    const isOwner = workspace.ownerId === userId;

    if (!isMember && !isOwner) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not a member of this workspace" });
    }

    return res
      .status(200)
      .json({ task: formatTask(task, task.project.identifier) });
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return res
      .status(500)
      .json({ error: "Unable to fetch task", message: error.message });
  }
};

/**
 * PATCH /api/v1/tasks/:id
 * Updates task fields (status, priority, title, description, due date, parentId, assignees).
 */
const updateTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  const parsed = updateTaskSchema.safeParse(req.body);
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
    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null },
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

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const workspace = task.project.workspace;
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
        .json({ error: "Forbidden: Viewers cannot modify tasks" });
    }

    // Foreign key check: parentId
    if (parsed.data.parentId !== undefined && parsed.data.parentId !== null) {
      if (parsed.data.parentId === task.id) {
        return res
          .status(400)
          .json({ error: "A task cannot be its own parent" });
      }
      const parentTask = await prisma.task.findFirst({
        where: {
          id: parsed.data.parentId,
          projectId: task.projectId,
          deletedAt: null,
        },
      });
      if (!parentTask) {
        return res
          .status(400)
          .json({ error: "Parent task not found in this project" });
      }
    }

    // Foreign key check: assigneeIds
    if (
      parsed.data.assigneeIds !== undefined &&
      parsed.data.assigneeIds.length > 0
    ) {
      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: workspace.id,
          userId: { in: parsed.data.assigneeIds },
        },
        select: { userId: true },
      });
      const validUserIds = new Set(workspaceMembers.map((m) => m.userId));
      const invalidAssignees = parsed.data.assigneeIds.filter(
        (uid) => !validUserIds.has(uid),
      );
      if (invalidAssignees.length > 0) {
        return res.status(400).json({
          error: "One or more assignees are not members of this workspace",
          invalidAssignees,
        });
      }
    }

    // Prepare update data
    const dataToUpdate = {};
    if (parsed.data.title !== undefined) dataToUpdate.title = parsed.data.title;
    if (parsed.data.description !== undefined)
      dataToUpdate.description = parsed.data.description;
    if (parsed.data.status !== undefined)
      dataToUpdate.status = parsed.data.status;
    if (parsed.data.priority !== undefined)
      dataToUpdate.priority = parsed.data.priority;
    if (parsed.data.dueDate !== undefined)
      dataToUpdate.dueDate = parsed.data.dueDate;
    if (parsed.data.parentId !== undefined)
      dataToUpdate.parentId = parsed.data.parentId;

    // Handle assignee updates atomically if specified
    if (parsed.data.assigneeIds !== undefined) {
      dataToUpdate.assignees = {
        deleteMany: {},
        create: parsed.data.assigneeIds.map((assigneeId) => ({
          userId: assigneeId,
        })),
      };
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: dataToUpdate,
      include: {
        createdBy: {
          select: { id: true, email: true, displayName: true, avatarUrl: true },
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
    });

    return res.status(200).json({
      message: "Task updated successfully",
      task: formatTask(updatedTask, task.project.identifier),
    });
  } catch (error) {
    console.error("Task update failed:", error);
    return res
      .status(500)
      .json({ error: "Unable to update task", message: error.message });
  }
};

/**
 * DELETE /api/v1/tasks/:id
 * Delete task entry (validating workspace rights and clearing subtask parent references).
 */
const deleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  try {
    const task = await prisma.task.findFirst({
      where: { id },
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

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const workspace = task.project.workspace;
    const membership = workspace.members[0];
    const isOwner =
      workspace.ownerId === userId || membership?.role === "OWNER";
    const isAdmin = membership?.role === "ADMIN";
    const isCreator = task.createdById === userId;

    if (!membership && !isOwner) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not a member of this workspace" });
    }

    // Must be Owner, Admin, or the task creator to delete
    if (!isOwner && !isAdmin && !isCreator) {
      return res.status(403).json({
        error:
          "Forbidden: You do not have permission to delete this task. Owner, Admin, or Task Creator required.",
      });
    }

    // Unlink any subtasks referencing this task as parentId to avoid foreign key violations
    await prisma.task.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });

    // Delete task entry (cascades TaskAssignee, Comment, SprintTask per schema)
    await prisma.task.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Task deletion failed:", error);
    return res
      .status(500)
      .json({ error: "Unable to delete task", message: error.message });
  }
};

const getTaskComments = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
        project: { is: { workspace: { is: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } } } },
      },
      select: { id: true },
    });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const comments = await prisma.comment.findMany({
      where: { taskId: task.id },
      include: { author: { select: { id: true, email: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });
    return res.status(200).json({ comments });
  } catch (error) {
    console.error("Failed to fetch task comments:", error);
    return res.status(500).json({ error: "Unable to fetch task comments" });
  }
};

const createTaskComment = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = z.object({ body: z.string().trim().min(1).max(5000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Comment cannot be empty" });

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
        project: { is: { workspace: { is: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } } } },
      },
      select: { id: true },
    });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const comment = await prisma.comment.create({
      data: { taskId: task.id, authorId: userId, body: parsed.data.body },
      include: { author: { select: { id: true, email: true, displayName: true, avatarUrl: true } } },
    });
    return res.status(201).json({ comment });
  } catch (error) {
    console.error("Failed to create task comment:", error);
    return res.status(500).json({ error: "Unable to create task comment" });
  }
};

const createSubTask = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = z.object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(10000).optional().nullable(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid sub-task details" });

  try {
    const parent = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
        project: { is: { workspace: { is: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } } } },
      },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: { where: { userId } },
              },
            },
          },
        },
      },
    });
    if (!parent) return res.status(404).json({ error: "Parent task not found" });
    const membership = parent.project.workspace.members[0];
    if (membership?.role === "VIEWER") return res.status(403).json({ error: "Viewers cannot create tasks" });

    const maxTask = await prisma.task.aggregate({ where: { projectId: parent.projectId }, _max: { number: true } });
    const subTask = await prisma.task.create({
      data: {
        projectId: parent.projectId,
        number: (maxTask._max.number ?? 0) + 1,
        title: parsed.data.title,
        description: parsed.data.description || null,
        parentId: parent.id,
        createdById: userId,
      },
      select: { id: true, number: true, title: true, description: true, status: true, priority: true, parentId: true },
    });
    return res.status(201).json({ subTask: { ...subTask, key: `${parent.project.identifier}-${subTask.number}` } });
  } catch (error) {
    console.error("Failed to create sub-task:", error);
    return res.status(500).json({ error: "Unable to create sub-task" });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskComments,
  createTaskComment,
  createSubTask,
};
