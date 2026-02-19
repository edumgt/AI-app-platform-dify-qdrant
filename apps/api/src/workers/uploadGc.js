const { gcExpiredUploads } = require("../services/uploadsService");

function startUploadGc() {
  const intervalMs = 60 * 1000; // every 1 min
  setInterval(async () => {
    try {
      const n = await gcExpiredUploads();
      if (n > 0) console.log("[GC] expired uploads cleaned:", n);
    } catch (e) {
      console.error("[GC] error:", e?.message || e);
    }
  }, intervalMs);
}

module.exports = { startUploadGc };
