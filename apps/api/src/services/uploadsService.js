const fs = require("fs/promises");
const path = require("path");
const { query } = require("../db/pool");

function ttlExpiresAt() {
  const ttlMin = Number(process.env.UPLOAD_TTL_MINUTES || 60);
  return new Date(Date.now() + ttlMin * 60 * 1000);
}

async function createUploadRecords({ userId, runId, file }) {
  const expiresAt = ttlExpiresAt();
  const r = await query(
    `INSERT INTO uploads(user_id, run_id, file_name, file_path, mime_type, size_bytes, expires_at)
     VALUES($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [userId, runId, file.originalname, file.path, file.mimetype, file.size, expiresAt]
  );
  return r.rows[0];
}

async function destroyUploadFilesForRun(runId, reason) {
  const r = await query("SELECT * FROM uploads WHERE run_id=$1 AND destroyed_at IS NULL", [runId]);
  for (const u of r.rows) {
    try {
      await fs.unlink(u.file_path);
    } catch (_) {}
    await query(
      "UPDATE uploads SET destroyed_at=now(), destroy_reason=$1 WHERE id=$2",
      [reason, u.id]
    );
  }
}

async function gcExpiredUploads() {
  const now = new Date();
  const r = await query(
    "SELECT * FROM uploads WHERE destroyed_at IS NULL AND expires_at <= $1 ORDER BY id ASC LIMIT 200",
    [now]
  );

  for (const u of r.rows) {
    try {
      await fs.unlink(u.file_path);
    } catch (_) {}
    await query(
      "UPDATE uploads SET destroyed_at=now(), destroy_reason='ttl_expired' WHERE id=$1",
      [u.id]
    );
  }

  return r.rowCount;
}

module.exports = { ttlExpiresAt, createUploadRecords, destroyUploadFilesForRun, gcExpiredUploads };
