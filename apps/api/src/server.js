const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), "../../.env") });


const { authRouter } = require("./routes/auth");
const { appsRouter } = require("./routes/apps");
const { keysRouter } = require("./routes/keys");
const { adminRouter } = require("./routes/admin");
const { billingRouter } = require("./routes/billing");
const { requireAuth } = require("./middleware/requireAuth");
const { startUploadGc } = require("./workers/uploadGc");

const app = express();

const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000";
app.use(cors({
  origin: APP_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// health
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// routes
app.use("/api/auth", authRouter);
app.use("/api/apps", appsRouter);
app.use("/api/keys", requireAuth, keysRouter);
app.use("/api/admin", requireAuth, adminRouter);
app.use("/api/billing", requireAuth, billingRouter);

// static uploads (internal debugging only; in prod you may NOT expose this publicly)
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
app.use("/_uploads", express.static(uploadDir));

const port = Number(process.env.API_PORT || 4000);
app.listen(port, () => {
  console.log(`[API] listening on :${port}`);
  startUploadGc();
});
