import os, glob
import requests
from dotenv import load_dotenv

load_dotenv()

base = os.getenv("RETRIEVER_BASE_URL", "http://localhost:8088").replace("qdrant-service:8088", "localhost:8088")
collection = os.getenv("QDRANT_COLLECTION_NAME", "dify_rag_demo")

requests.post(base + "/ensure_collection", json={"collection": collection}, timeout=60).raise_for_status()

docs = []
for fp in sorted(glob.glob("data/sample_docs/*.md")):
    with open(fp, "r", encoding="utf-8") as f:
        text = f.read().strip()
    docs.append({"id": os.path.basename(fp), "text": text, "metadata": {"source": fp}})

r = requests.post(base + "/ingest", json={"collection": collection, "docs": docs}, timeout=300)
r.raise_for_status()
print(r.json())
