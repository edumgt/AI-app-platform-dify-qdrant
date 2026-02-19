const axios = require("axios");

/**
 * Dify API는 배포/버전에 따라 엔드포인트/필드가 바뀔 수 있어 한 곳에서 어댑트합니다.
 * .env
 * - DIFY_BASE_URL
 * - DIFY_API_KEY
 * - DIFY_WORKFLOW_RUN_PATH (default: /v1/workflows/run)
 */
function createDifyClient() {
  const baseURL = process.env.DIFY_BASE_URL;
  const apiKey = process.env.DIFY_API_KEY;
  const runPath = process.env.DIFY_WORKFLOW_RUN_PATH || "/v1/workflows/run";

  if (!baseURL || !apiKey) {
    return {
      enabled: false,
      async runWorkflow() {
        return { disabled: true, message: "Dify not configured. Set DIFY_BASE_URL and DIFY_API_KEY." };
      }
    };
  }

  const http = axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 120000
  });

  return {
    enabled: true,
    async runWorkflow({ workflowId, inputs, userId }) {
      // NOTE: This payload is a common pattern; adjust if your Dify version differs.
      const res = await http.post(runPath, {
        workflow_id: workflowId,
        inputs,
        response_mode: "blocking",
        user: String(userId)
      });
      return res.data;
    }
  };
}

module.exports = { createDifyClient };
