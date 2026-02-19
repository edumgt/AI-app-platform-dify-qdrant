const express = require("express");
const { query } = require("../db/pool");

const billingRouter = express.Router();

/**
 * MVP: 결제사 선택 전, webhook 수신 골격만 제공
 * 실제 PG(토스페이먼츠/포트원/스트라이프 등) 연동 시:
 *  - checkout session 생성
 *  - pg redirect/callback 처리
 *  - webhook 검증 및 결제 상태 확정
 */

billingRouter.get("/history", async (req, res) => {
  const userId = req.user.userId;
  const r = await query("SELECT id, provider, amount, currency, status, pg_tx_id, created_at FROM payments WHERE user_id=$1 ORDER BY id DESC LIMIT 100", [userId]);
  res.json({ items: r.rows });
});

// provider-agnostic webhook endpoint (in real world, this endpoint is usually NOT behind auth)
billingRouter.post("/webhook", async (req, res) => {
  const userId = req.user.userId;

  const provider = process.env.BILLING_PROVIDER || "tbd";
  const payload = req.body || {};

  // TODO: verify signature with BILLING_WEBHOOK_SECRET
  const status = payload.status || "paid";
  const amount = payload.amount || 0;
  const currency = payload.currency || "KRW";
  const pgTxId = payload.pg_tx_id || null;

  await query(
    "INSERT INTO payments(user_id, provider, amount, currency, status, pg_tx_id, raw_webhook) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)",
    [userId, provider, amount, currency, status, pgTxId, JSON.stringify(payload)]
  );

  res.json({ ok: true });
});

module.exports = { billingRouter };
