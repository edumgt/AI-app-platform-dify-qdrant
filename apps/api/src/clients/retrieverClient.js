const axios = require("axios");

function createRetrieverClient() {
  const baseURL = process.env.RETRIEVER_BASE_URL || "http://qdrant-service:8088";
  const http = axios.create({ baseURL, timeout: 120000 });

  return {
    async ingestDocs({ collection, docs }) {
      const res = await http.post("/ingest", { collection, docs });
      return res.data;
    },
    async search({ collection, query, top_k }) {
      const res = await http.post("/search", { collection, query, top_k });
      return res.data;
    }
  };
}

module.exports = { createRetrieverClient };
