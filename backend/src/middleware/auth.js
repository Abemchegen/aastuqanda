const jwt = require("jsonwebtoken");
const store = require("../data/store");

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing bearer token" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    const user = await store.getUserById(payload.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = { id: user.id, username: user.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function issueAccessToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET || "devsecret",
    { expiresIn: "1h" }
  );
}

module.exports = { requireAuth, issueAccessToken };
// Optionally attach req.user if a valid token is present; never errors
async function maybeAuth(req, _res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return next();
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    const user = await store.getUserById(payload.userId);
    if (user) {
      req.user = { id: user.id, username: user.username };
    }
  } catch (_) {
    // ignore invalid token for optional auth
  }
  next();
}

module.exports.maybeAuth = maybeAuth;
