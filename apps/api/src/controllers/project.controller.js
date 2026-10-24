const { z } = require("zod");
const prisma = require("../config/db");

const createProjectSchema = z.object({
  name: z
    .string({ required_error: "Project name is required" })
    .trim()
    .min(1, "Project name cannot be empty")
    .max(100, "Project name cannot exceed 100 characters"),
  description: z.string().trim().max(1000).optional().nullable(),
  icon: z.string().trim().max(100).optional().nullable(),
  identifier: z.string().trim().min(1).max(20).optional().nullable(),
  status: z
    .enum(["ACTIVE", "PAUSED", "COMPLETED"])
    .optional()
    .default("ACTIVE"),
});

/**
 * Generate a short unique project identifier per workspace (e.g., 'PROJ-01').
 */
const generateProjectIdentifier = async (
  workspaceId,
  name,
  requestedIdentifier,
) => {
  const existingProjects = await prisma.project.findMany({
    where: { workspaceId },
    select: { identifier: true },
  });

  const existingIdentifiers = new Set(
    existingProjects.map((p) => p.identifier.toUpperCase()),
  );

  let basePrefix = "";

  if (requestedIdentifier && requestedIdentifier.trim()) {
    const cleaned = requestedIdentifier
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "");

    const match = cleaned.match(/^([A-Z0-9]+)-?(\d+)?$/);
    if (match) {
      if (!existingIdentifiers.has(cleaned)) {
        return cleaned;
      }
      basePrefix = match[1];
    } else {
      basePrefix = cleaned.slice(0, 6);
    }
  }

  if (!basePrefix) {
    const cleanedName = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
    const words = cleanedName.split(/\s+/).filter(Boolean);

    if (words.length > 0 && /^project$/i.test(words[0])) {
      basePrefix = "PROJ";
    } else if (words.length === 1) {
      basePrefix = words[0].slice(0, 4).toUpperCase();
    } else if (words.length >= 2) {
      const acronym = words
        .slice(0, 4)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
      basePrefix =
        acronym.length >= 3 ? acronym : words[0].slice(0, 4).toUpperCase();
    } else {
      basePrefix = "PROJ";
    }

    if (!basePrefix || basePrefix.length < 2) {
      basePrefix = "PROJ";
    }
  }

  // Find next available index: e.g. PROJ-01, PROJ-02, ...
  let index = 1;
  let candidate = `${basePrefix}-${String(index).padStart(2, "0")}`;

  while (existingIdentifiers.has(candidate)) {
    index++;
    candidate = `${basePrefix}-${String(index).padStart(2, "0")}`;
  }

  return candidate;
};

/**
 * POST /api/v1/workspaces/:slug/projects
 * Creates a project inside a workspace, validating admin/owner rights and generating
 * a short unique project identifier per workspace.
 */
const createProject = async (req, res) => {
  const targetSlug =
    req.params.slug || req.body.workspaceSlug || req.query.workspaceSlug;
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  if (!targetSlug) {
    return res.status(400).json({ error: "Workspace slug is required" });
  }

  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid project details",
      details: parsed.error.issues.map(({ path, message }) => ({
        path: path.join("."),
        message,
      })),
    });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: targetSlug },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const membership = workspace.members[0];
    const isOwner =
      workspace.ownerId === userId || membership?.role === "OWNER";
    const isAdmin = membership?.role === "ADMIN";

    if (!membership && !isOwner) {
      return res.status(403).json({
        error: "Forbidden: You are not a member of this workspace",
      });
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error:
          "Forbidden: Only workspace owners and admins can create projects",
      });
    }

    const identifier = await generateProjectIdentifier(
      workspace.id,
      parsed.data.name,
      parsed.data.identifier,
    );

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        icon: parsed.data.icon || null,
        identifier,
        status: parsed.data.status || "ACTIVE",
        workspaceId: workspace.id,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error:
          "A project with this identifier already exists in this workspace",
      });
    }

    console.error("Project creation failed:", error);
    return res
      .status(500)
      .json({ error: "Unable to create project", message: error.message });
  }
};

/**
 * GET /api/v1/workspaces/:slug/projects
 * Lists all projects for that workspace (or user's workspaces if slug omitted).
 */
const getProjects = async (req, res) => {
  const targetSlug =
    req.params.slug || req.query.workspaceSlug || req.query.slug;
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  try {
    if (targetSlug) {
      const workspace = await prisma.workspace.findUnique({
        where: { slug: targetSlug },
        include: {
          members: {
            where: { userId },
          },
        },
      });

      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }

      const isMember = workspace.members.length > 0;
      const isOwner = workspace.ownerId === userId;

      if (!isMember && !isOwner) {
        return res.status(403).json({
          error: "Forbidden: You are not a member of this workspace",
        });
      }

      const projects = await prisma.project.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              tasks: {
                where: { deletedAt: null },
              },
              sprints: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json({ projects });
    }

    // If no slug is specified (e.g. GET /api/v1/projects)
    const userMemberships = await prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    });

    const workspaceIds = userMemberships.map((m) => m.workspaceId);

    const projects = await prisma.project.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        deletedAt: null,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            tasks: {
              where: { deletedAt: null },
            },
            sprints: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ projects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return res
      .status(500)
      .json({ error: "Unable to fetch projects", message: error.message });
  }
};

/**
 * GET /api/v1/projects/:id
 * Fetches a single project by id if the user has access.
 */
const getProjectById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User not found in token" });
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
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
        _count: {
          select: {
            tasks: {
              where: { deletedAt: null },
            },
            sprints: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const isMember = project.workspace.members.length > 0;
    const isOwner = project.workspace.ownerId === userId;

    if (!isMember && !isOwner) {
      return res.status(403).json({
        error: "Forbidden: You are not a member of this workspace",
      });
    }

    return res.status(200).json({ project });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return res
      .status(500)
      .json({ error: "Unable to fetch project", message: error.message });
  }
};

const updateProject = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = createProjectSchema.pick({ name: true, description: true, icon: true }).partial().safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
    return res.status(400).json({ error: "Provide a valid project name, description, or icon" });
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { workspace: { include: { members: { where: { userId } } } } },
    });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const membership = project.workspace.members[0];
    const isOwner = project.workspace.ownerId === userId || membership?.role === "OWNER";
    if (!isOwner && membership?.role !== "ADMIN") {
      return res.status(403).json({ error: "Only workspace owners and admins can edit projects" });
    }

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: parsed.data,
      include: { workspace: { select: { id: true, name: true, slug: true } } },
    });
    return res.status(200).json({ project: updatedProject });
  } catch (error) {
    console.error("Project update failed:", error);
    return res.status(500).json({ error: "Unable to update project" });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
};
