const express = require("express");
const path = require("path");
const multer = require("multer");
const { z } = require("zod");
const { query } = require("../db/pool");
const { requireAuth } = require("../middleware/requireAuth");
const { createRetrieverClient } = require("../clients/retrieverClient");
const { createDifyClient } = require("../clients/difyClient");
const { destroyUploadFilesForRun, createUploadRecords, ttlExpiresAt } = require("../services/uploadsService");

const appsRouter = express.Router();

appsRouter.get("/", async (req, res) => {
  const r = await query("SELECT id, slug, title, description, plan_required, is_published FROM ai_apps WHERE is_published=true ORDER BY id DESC");
  res.json({ items: r.rows });
});

appsRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const r = await query("SELECT * FROM ai_apps WHERE id=$1 AND is_published=true", [id]);
  if (r.rowCount === 0) return res.status(404).json({ error: "not_found" });
  return res.json({ item: r.rows[0] });
});

// Upload (PII) -> stored temporarily; used by run endpoint
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + "_" + Math.random().toString(16).slice(2) + "_" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, safe);
  }
});
const upload = multer({ storage });

appsRouter.post("/:id/run", requireAuth, upload.single("file"), async (req, res) => {
  const appId = Number(req.params.id);
  const userId = req.user.userId;

  const schema = z.object({
    query: z.string().min(1),
    top_k: z.coerce.number().min(1).max(20).default(5)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", detail: parsed.error.flatten() });

  const rApp = await query("SELECT * FROM ai_apps WHERE id=$1 AND is_published=true", [appId]);
  if (rApp.rowCount === 0) return res.status(404).json({ error: "not_found" });

  const appRow = rApp.rows[0];

  // create run
  const runR = await query(
    "INSERT INTO app_runs(user_id, app_id, status, inputs) VALUES($1,$2,'running',$3::jsonb) RETURNING id",
    [userId, appId, JSON.stringify({ query: parsed.data.query })]
  );
  const runId = runR.rows[0].id;

  // record upload if present
  let uploaded = null;
  if (req.file) {
    uploaded = await createUploadRecords({ userId, runId, file: req.file });
  }

  const retriever = createRetrieverClient();
  const dify = createDifyClient();

  try {
    // 1) Optional: if file exists, ingest it (for MVP: we just read file as text on client side is complex.
    // Here, we do NOT parse PDFs/docx. We keep file for session and user can implement parsers later.)
    // 2) Search context from Qdrant (sample docs will be ingested via retriever bootstrap)
    const collection = process.env.QDRANT_COLLECTION_NAME || "dify_rag_demo";
    const searchRes = await retriever.search({ collection, query: parsed.data.query, top_k: parsed.data.top_k });

    const context = (searchRes.matches || [])
      .map(m => `- (${m.score?.toFixed?.(3) ?? m.score}) ${m.text}`)
      .join("\n");

    // 3) Run Dify workflow if configured; otherwise fallback response
    let output = null;
    if (dify.enabled && appRow.dify_app_id) {
      output = await dify.runWorkflow({
        workflowId: appRow.dify_app_id,
        userId,
        inputs: {
          query: parsed.data.query,
          context,
          // You may pass file reference if you implement file parsing & upload to Dify
          upload_id: uploaded ? uploaded.id : null
        }
      });
    } else {
      output = {
        disabled: true,
        answer: `Dify 미설정(또는 앱에 dify_app_id 미설정)이라 임시 응답을 반환합니다.\n\n[query]\n${parsed.data.query}\n\n[context]\n${context}`
      };
    }

    await query(
      "UPDATE app_runs SET status='success', outputs=$1::jsonb, ended_at=now() WHERE id=$2",
      [JSON.stringify(output), runId]
    );

    // PII teardown: best-effort immediate deletion
    await destroyUploadFilesForRun(runId, "run_completed");

    return res.json({ run_id: runId, output });
  } catch (e) {
    await query(
      "UPDATE app_runs SET status='failed', error_message=$1, ended_at=now() WHERE id=$2",
      [String(e?.message || e), runId]
    );

    // best-effort teardown even on fail
    await destroyUploadFilesForRun(runId, "run_failed");

    return res.status(500).json({ error: "run_failed", message: String(e?.message || e), run_id: runId });
  }
});

appsRouter.get("/me/runs", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const r = await query(
    "SELECT r.*, a.slug, a.title FROM app_runs r JOIN ai_apps a ON a.id=r.app_id WHERE r.user_id=$1 ORDER BY r.id DESC LIMIT 50",
    [userId]
  );
  res.json({ items: r.rows });
});

module.exports = { appsRouter };
