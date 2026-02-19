const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { query } = require("../db/pool");
const { signAccess, signRefresh, verifyRefresh } = require("../utils/jwt");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", detail: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const r = await query(
      "INSERT INTO users(email, password_hash, role) VALUES($1,$2,'user') RETURNING id, email, role",
      [email, passwordHash]
    );
    const user = r.rows[0];
    const access = signAccess({ userId: user.id, role: user.role });
    const refresh = signRefresh({ userId: user.id, role: user.role });

    res.cookie("refresh_token", refresh, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/"
    });

    return res.json({ access_token: access, user });
  } catch (e) {
    if (String(e).includes("duplicate key")) return res.status(409).json({ error: "email_exists" });
    return res.status(500).json({ error: "server_error" });
  }
});

authRouter.post("/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

  const { email, password } = parsed.data;

  const r = await query("SELECT id, email, role, password_hash, status FROM users WHERE email=$1", [email]);
  if (r.rowCount === 0) return res.status(401).json({ error: "invalid_credentials" });

  const u = r.rows[0];
  if (u.status !== "active") return res.status(403).json({ error: "user_blocked" });

  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const access = signAccess({ userId: u.id, role: u.role });
  const refresh = signRefresh({ userId: u.id, role: u.role });

  res.cookie("refresh_token", refresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/"
  });

  return res.json({ access_token: access, user: { id: u.id, email: u.email, role: u.role } });
});

authRouter.post("/refresh", async (req, res) => {
  const token = req.cookies.refresh_token;
  if (!token) return res.status(401).json({ error: "missing_refresh" });

  try {
    const payload = verifyRefresh(token);
    const access = signAccess({ userId: payload.userId, role: payload.role });
    return res.json({ access_token: access });
  } catch (e) {
    return res.status(401).json({ error: "invalid_refresh" });
  }
});

authRouter.post("/logout", async (req, res) => {
  res.clearCookie("refresh_token", { path: "/" });
  return res.json({ ok: true });
});

authRouter.get("/me", async (req, res) => {
  // Access token optional; used by FE to check status
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.json({ authenticated: false });

  // verifyAccess handled at middleware usually; here minimal
  const jwt = require("jsonwebtoken");
  try {
    const p = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const r = await query("SELECT id, email, role, status FROM users WHERE id=$1", [p.userId]);
    if (r.rowCount === 0) return res.json({ authenticated: false });
    return res.json({ authenticated: true, user: r.rows[0] });
  } catch {
    return res.json({ authenticated: false });
  }
});

module.exports = { authRouter };
