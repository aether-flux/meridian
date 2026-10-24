const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const prisma = require("../config/db");

const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(80),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(128),
});

const publicUser = ({ id, email, displayName, avatarUrl, createdAt }) => ({
  id,
  email,
  displayName,
  avatarUrl,
  createdAt,
});

const createToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || "dev-test-key",
    { expiresIn: "7d" },
  );

const register = async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid registration details",
      details: parsed.error.issues.map(({ path, message }) => ({
        path,
        message,
      })),
    });
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        displayName: parsed.data.displayName,
      },
    });

    return res
      .status(201)
      .json({ user: publicUser(user), token: createToken(user) });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    }

    console.error("Registration failed:", error);
    return res.status(500).json({ error: "Unable to register account" });
  }
};

const login = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid login details",
      details: parsed.error.issues.map(({ path, message }) => ({
        path,
        message,
      })),
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (
      !user ||
      !(await bcrypt.compare(parsed.data.password, user.passwordHash))
    ) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    return res
      .status(200)
      .json({ user: publicUser(user), token: createToken(user) });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Unable to log in" });
  }
};

module.exports = { register, login };
