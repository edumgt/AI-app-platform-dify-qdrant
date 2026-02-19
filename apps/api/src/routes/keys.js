const express = require("express");
const { z } = require("zod");
const { query } = require("../db/pool");
const { encrypt } = require("../utils/crypto");

const keysRouter = express.Router();

keysRouter.get("/", async (req, res) => {
  const userId = req.user.userId;
  const r = await query(
    "SELECT id, provider, key_hint, created_at, rotated_at FROM user_api_keys WHERE user_id=$1 ORDER BY id DESC",
    [userId]
  );
  res.json({ items: r.rows });
});

keysRouter.post("/", async (req, res) => {
  const schema = z.object({
    provider: z.string().min(2),
    api_key: z.string().min(10)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", detail: parsed.error.flatten() });

  const userId = req.user.userId;
  const hint = parsed.data.api_key.slice(0, 4) + "..." + parsed.data.api_key.slice(-4);
  const ciphertext = encrypt(parsed.data.api_key);

  const r = await query(
    "INSERT INTO user_api_keys(user_id, provider, key_ciphertext, key_hint) VALUES($1,$2,$3,$4) RETURNING id, provider, key_hint, created_at",
    [userId, parsed.data.provider, ciphertext, hint]
  );
  res.json({ item: r.rows[0] });
});

keysRouter.delete("/:id", async (req, res) => {
  const userId = req.user.userId;
  const id = Number(req.params.id);
  await query("DELETE FROM user_api_keys WHERE id=$1 AND user_id=$2", [id, userId]);
  res.json({ ok: true });
});

module.exports = { keysRouter };
