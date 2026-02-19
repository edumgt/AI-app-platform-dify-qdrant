import os
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI  # type: ignore

from qdrant_client import QdrantClient  # type: ignore
from qdrant_client.http.models import Distance, VectorParams, PointStruct, Filter as QFilter  # type: ignore

app = FastAPI(title="Qdrant Retriever Service", version="1.0.0")

QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY") or None
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION_NAME", "dify_rag_demo")
QDRANT_VECTOR_SIZE = int(os.getenv("QDRANT_VECTOR_SIZE", "1536"))
QDRANT_DISTANCE = os.getenv("QDRANT_DISTANCE", "Cosine")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_EMBED_MODEL = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")

if not OPENAI_API_KEY:
    raise RuntimeError("Missing OPENAI_API_KEY")

oa = OpenAI(api_key=OPENAI_API_KEY)
qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

def _distance_enum(name: str) -> Distance:
    n = (name or "Cosine").strip().lower()
    if n == "cosine":
        return Distance.COSINE
    if n == "dot":
        return Distance.DOT
    if n in ("euclid", "euclidean"):
        return Distance.EUCLID
    return Distance.COSINE

def ensure_collection(collection: str):
    existing = [c.name for c in qdrant.get_collections().collections]
    if collection in existing:
        return
    qdrant.create_collection(
        collection_name=collection,
        vectors_config=VectorParams(size=QDRANT_VECTOR_SIZE, distance=_distance_enum(QDRANT_DISTANCE)),
    )

ensure_collection(QDRANT_COLLECTION)

class DocIn(BaseModel):
    id: str
    text: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class IngestReq(BaseModel):
    collection: Optional[str] = None
    docs: List[DocIn]

class SearchReq(BaseModel):
    query: str
    top_k: int = 5
    collection: Optional[str] = None
    qdrant_filter: Optional[Dict[str, Any]] = None

def embed_texts(texts: List[str]) -> List[List[float]]:
    resp = oa.embeddings.create(model=OPENAI_EMBED_MODEL, input=texts)
    return [d.embedding for d in resp.data]

@app.get("/health")
def health():
    return {"ok": True, "qdrant_url": QDRANT_URL, "collection": QDRANT_COLLECTION}

@app.post("/ensure_collection")
def ensure(req: Optional[Dict[str, Any]] = None):
    collection = (req or {}).get("collection") or QDRANT_COLLECTION
    ensure_collection(collection)
    return {"ok": True, "collection": collection}

@app.post("/ingest")
def ingest(req: IngestReq):
    collection = req.collection or QDRANT_COLLECTION
    if not req.docs:
        raise HTTPException(status_code=400, detail="docs is empty")
    ensure_collection(collection)

    texts = [d.text for d in req.docs]
    embs = embed_texts(texts)

    points: List[PointStruct] = []
    for d, v in zip(req.docs, embs):
        payload = dict(d.metadata)
        payload["text"] = d.text
        points.append(PointStruct(id=d.id, vector=v, payload=payload))

    qdrant.upsert(collection_name=collection, points=points)
    return {"upserted": len(points), "collection": collection}

@app.post("/search")
def search(req: SearchReq):
    collection = req.collection or QDRANT_COLLECTION
    ensure_collection(collection)

    qvec = embed_texts([req.query])[0]

    qfilter = None
    if req.qdrant_filter:
        try:
            qfilter = QFilter.model_validate(req.qdrant_filter)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid qdrant_filter format")

    res = qdrant.search(
        collection_name=collection,
        query_vector=qvec,
        limit=req.top_k,
        with_payload=True,
        query_filter=qfilter,
    )

    matches_out = []
    for p in res:
        payload = p.payload or {}
        matches_out.append(
            {
                "id": str(p.id),
                "score": float(p.score) if p.score is not None else None,
                "text": payload.get("text"),
                "metadata": {k: v for k, v in payload.items() if k != "text"},
            }
        )

    return {"collection": collection, "matches": matches_out}
