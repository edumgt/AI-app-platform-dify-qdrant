const { verifyAccess } = require("../utils/jwt");

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing_token" });

  try {
    const payload = verifyAccess(token);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "invalid_token" });
  }
}

module.exports = { requireAuth };
