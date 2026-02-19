const express = require("express");
const { z } = require("zod");
const { query } = require("../db/pool");
const { requireAdmin } = require("../middleware/requireAdmin");

const adminRouter = express.Router();
adminRouter.use(requireAdmin);

adminRouter.get("/users", async (req, res) => {
  const r = await query("SELECT id, email, role, status, created_at FROM users ORDER BY id DESC LIMIT 200");
  res.json({ items: r.rows });
});

adminRouter.patch("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const schema = z.object({
    role: z.enum(["user", "admin"]).optional(),
    status: z.enum(["active", "blocked"]).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

  const fields = [];
  const vals = [];
  let idx = 1;

  for (const [k, v] of Object.entries(parsed.data)) {
    fields.push(`${k}=$${idx++}`);
    vals.push(v);
  }
  if (fields.length === 0) return res.json({ ok: true });

  vals.push(id);
  await query(`UPDATE users SET ${fields.join(", ")}, updated_at=now() WHERE id=$${idx}`, vals);
  res.json({ ok: true });
});

// AI app catalog management
adminRouter.get("/apps", async (req, res) => {
  const r = await query("SELECT * FROM ai_apps ORDER BY id DESC");
  res.json({ items: r.rows });
});

adminRouter.post("/apps", async (req, res) => {
  const schema = z.object({
    slug: z.string().min(2),
    title: z.string().min(2),
    description: z.string().optional(),
    dify_app_id: z.string().optional(),
    dify_app_type: z.enum(["workflow", "chat"]).optional(),
    input_schema: z.any().optional(),
    plan_required: z.string().optional(),
    is_published: z.boolean().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", detail: parsed.error.flatten() });

  const p = parsed.data;
  const r = await query(
    `INSERT INTO ai_apps(slug, title, description, dify_app_id, dify_app_type, input_schema, plan_required, is_published)
     VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8)
     RETURNING *`,
    [
      p.slug, p.title, p.description || "", p.dify_app_id || "", p.dify_app_type || "workflow",
      JSON.stringify(p.input_schema || {}), p.plan_required || "free", p.is_published ?? true
    ]
  );
  res.json({ item: r.rows[0] });
});

adminRouter.patch("/apps/:id", async (req, res) => {
  const id = Number(req.params.id);
  const schema = z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    dify_app_id: z.string().optional(),
    dify_app_type: z.enum(["workflow", "chat"]).optional(),
    input_schema: z.any().optional(),
    plan_required: z.string().optional(),
    is_published: z.boolean().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", detail: parsed.error.flatten() });

  const fields = [];
  const vals = [];
  let idx = 1;

  for (const [k, v] of Object.entries(parsed.data)) {
    fields.push(`${k}=$${idx++}`);
    vals.push(k === "input_schema" ? JSON.stringify(v) : v);
  }
  if (fields.length === 0) return res.json({ ok: true });

  vals.push(id);
  await query(`UPDATE ai_apps SET ${fields.join(", ")}, updated_at=now() WHERE id=$${idx}`, vals);
  res.json({ ok: true });
});

adminRouter.delete("/apps/:id", async (req, res) => {
  const id = Number(req.params.id);
  await query("DELETE FROM ai_apps WHERE id=$1", [id]);
  res.json({ ok: true });
});

module.exports = { adminRouter };
