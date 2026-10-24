const { z } = require("zod");
const prisma = require("../config/db");

const createWorkspaceSchema = z.object({
  name: z
    .string({ required_error: "Workspace name is required" })
    .trim()
    .min(1, "Workspace name cannot be empty")
    .max(100, "Workspace name cannot exceed 100 characters"),
  slug: z.string().trim().min(1).max(100).optional(),
});

/**
 * Generate a URL-friendly slug from a text string.
 */
const generateCleanSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accent diacritics
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
};

/**
 * Ensure the generated slug is unique in the database.
 */
const getUniqueWorkspaceSlug = async (baseSlug) => {
  const cleanBase = baseSlug || "workspace";
  let slug = cleanBase;
  let counter = 1;

  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${cleanBase}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * POST /api/v1/workspaces
 * Creates a workspace and automatically adds the requesting user as OWNER in workspace_members.
 */
const createWorkspace = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  const parsed = createWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid workspace details",
      details: parsed.error.issues.map(({ path, message }) => ({
        path: path.join("."),
        message,
      })),
    });
  }

  try {
    const rawSlug = parsed.data.slug
      ? generateCleanSlug(parsed.data.slug)
      : generateCleanSlug(parsed.data.name);

    const slug = await getUniqueWorkspaceSlug(rawSlug);

    const workspace = await prisma.workspace.create({
      data: {
        name: parsed.data.name,
        slug,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            joinedAt: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "A workspace with this slug already exists" });
    }

    console.error("Workspace creation failed:", error);
    return res
      .status(500)
      .json({ error: "Unable to create workspace", message: error.message });
  }
};

/**
 * GET /api/v1/workspaces
 * Lists all workspaces where the logged-in user is a member.
 */
const getWorkspaces = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          where: {
            userId,
          },
          select: {
            role: true,
            joinedAt: true,
          },
        },
        _count: {
          select: {
            members: true,
            projects: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedWorkspaces = workspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      ownerId: ws.ownerId,
      createdAt: ws.createdAt,
      role: ws.members[0]?.role || (ws.ownerId === userId ? "OWNER" : "MEMBER"),
      joinedAt: ws.members[0]?.joinedAt || ws.createdAt,
      members: ws.members,
      _count: ws._count,
    }));

    return res.status(200).json({ workspaces: formattedWorkspaces });
  } catch (error) {
    console.error("Failed to fetch workspaces:", error);
    return res
      .status(500)
      .json({ error: "Unable to fetch workspaces", message: error.message });
  }
};

/**
 * GET /api/v1/workspaces/:slug
 * Retrieves a single workspace by slug if the requesting user is a member.
 */
const getWorkspaceBySlug = async (req, res) => {
  const { slug } = req.params;
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
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
            projects: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const membership = workspace.members.find((m) => m.userId === userId);
    const isOwner = workspace.ownerId === userId;

    if (!membership && !isOwner) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not a member of this workspace" });
    }

    return res.status(200).json({
      workspace: {
        ...workspace,
        role: membership?.role || (isOwner ? "OWNER" : "MEMBER"),
      },
    });
  } catch (error) {
    console.error("Failed to fetch workspace:", error);
    return res
      .status(500)
      .json({ error: "Unable to fetch workspace", message: error.message });
  }
};

const getWorkspaceDashboard = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User not found in token" });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: req.params.slug },
      include: { members: { where: { userId }, select: { userId: true } } },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    if (workspace.ownerId !== userId && workspace.members.length === 0) {
      return res.status(403).json({ error: "Forbidden: You are not a member of this workspace" });
    }

    const now = new Date();
    const workspaceProjectFilter = {
      project: { is: { workspaceId: workspace.id, deletedAt: null } },
      deletedAt: null,
    };

    const [projectCount, totalTasks, inProgressTasks, urgentTasks, completedTasks, activeSprint, assignedTasks, recentTasks, recentProjects, recentComments] = await Promise.all([
      prisma.project.count({ where: { workspaceId: workspace.id, deletedAt: null } }),
      prisma.task.count({ where: workspaceProjectFilter }),
      prisma.task.count({ where: { ...workspaceProjectFilter, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...workspaceProjectFilter, priority: "URGENT" } }),
      prisma.task.count({ where: { ...workspaceProjectFilter, status: "DONE" } }),
      prisma.sprint.findFirst({
        where: {
          startDate: { lte: now },
          endDate: { gte: now },
          project: { is: { workspaceId: workspace.id, deletedAt: null } },
        },
        include: {
          project: { select: { id: true, name: true, identifier: true } },
          tasks: { where: { task: { deletedAt: null } }, select: { task: { select: { status: true } } } },
        },
        orderBy: { startDate: "desc" },
      }),
      prisma.task.findMany({
        where: {
          ...workspaceProjectFilter,
          assignees: { some: { userId } },
        },
        include: {
          project: { select: { identifier: true } },
          assignees: { where: { userId }, include: { user: { select: { id: true, email: true, displayName: true } } } },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.task.findMany({
        where: workspaceProjectFilter,
        include: {
          createdBy: { select: { displayName: true } },
          project: { select: { identifier: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.project.findMany({
        where: { workspaceId: workspace.id, deletedAt: null },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.comment.findMany({
        where: { task: workspaceProjectFilter },
        include: {
          author: { select: { displayName: true } },
          task: { select: { title: true, number: true, project: { select: { identifier: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    const activities = [
      ...recentTasks.map((task) => ({
        id: `task-created-${task.id}`,
        actor: task.createdBy.displayName,
        action: "created task",
        target: `${task.project.identifier}-${task.number} ${task.title}`,
        createdAt: task.createdAt,
      })),
      ...recentProjects.map((project) => ({
        id: `project-created-${project.id}`,
        actor: "Workspace",
        action: "created project",
        target: project.name,
        createdAt: project.createdAt,
      })),
      ...recentComments.map((comment) => ({
        id: `comment-${comment.id}`,
        actor: comment.author.displayName,
        action: "commented on",
        target: `${comment.task.project.identifier}-${comment.task.number} ${comment.task.title}`,
        createdAt: comment.createdAt,
      })),
    ]
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 8);

    const sprintTaskCount = activeSprint?.tasks.length || 0;
    const completedSprintTasks = activeSprint?.tasks.filter(({ task }) => task.status === "DONE").length || 0;

    return res.status(200).json({
      summary: { projectCount, totalTasks, inProgressTasks, urgentTasks, completedTasks },
      activeSprint: activeSprint
        ? {
            id: activeSprint.id,
            name: activeSprint.name,
            startDate: activeSprint.startDate,
            endDate: activeSprint.endDate,
            project: activeSprint.project,
            completedTasks: completedSprintTasks,
            totalTasks: sprintTaskCount,
            progressPercent: sprintTaskCount ? Math.round((completedSprintTasks / sprintTaskCount) * 100) : 0,
          }
        : null,
      assignedTasks: assignedTasks.map((task) => ({
        ...task,
        key: `${task.project.identifier}-${task.number}`,
        assignee: task.assignees[0]?.user || null,
      })),
      activities,
    });
  } catch (error) {
    console.error("Failed to fetch workspace dashboard:", error);
    return res.status(500).json({ error: "Unable to fetch workspace dashboard", message: error.message });
  }
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspaceBySlug,
  getWorkspaceDashboard,
};
