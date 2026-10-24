const crypto = require("crypto");
const { z } = require("zod");
const prisma = require("../config/db");

const createInviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

const createInvite = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User not found in token" });
  }

  const parsed = createInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid invite details",
      details: parsed.error.issues.map(({ path, message }) => ({
        path: path.join("."),
        message,
      })),
    });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: req.params.slug },
      include: { members: { where: { userId } } },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const membership = workspace.members[0];
    if (workspace.ownerId !== userId && !["OWNER", "ADMIN"].includes(membership?.role)) {
      return res.status(403).json({ error: "Only workspace owners and admins can invite members" });
    }

    const invite = await prisma.invite.create({
      data: {
        workspaceId: workspace.id,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        token: crypto.randomBytes(32).toString("hex"),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
      },
    });

    return res.status(201).json({ invite, workspace: { name: workspace.name, slug: workspace.slug } });
  } catch (error) {
    console.error("Invite creation failed:", error);
    return res.status(500).json({ error: "Unable to create invite" });
  }
};

const getInviteByToken = async (req, res) => {
  try {
    const invite = await prisma.invite.findUnique({
      where: { token: req.params.token },
      include: {
        workspace: {
          select: { name: true, slug: true },
        },
      },
    });

    if (!invite || invite.expiresAt <= new Date()) {
      return res.status(404).json({ error: "Invite not found or expired" });
    }

    const { email, role, expiresAt, workspace } = invite;
    return res.status(200).json({
      invite: { email, role, expiresAt },
      workspace,
    });
  } catch (error) {
    console.error("Invite lookup failed:", error);
    return res.status(500).json({ error: "Unable to verify invite" });
  }
};

module.exports = { createInvite, getInviteByToken };