const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-test-key");
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ error: "Forbidden: Invalid or expired token" });
  }
};

module.exports = verifyToken;
