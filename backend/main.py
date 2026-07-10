# Python FastAPI Backend for Toneprint
# Replaces Node.js Express server to run completely locally.

import os
import sys
import json
import urllib.request
import urllib.error
import time

# Ensure backend directory is in python path for absolute imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any

# Load dotenv if running directly
from dotenv import load_dotenv
load_dotenv()

import llm
from pilot_data import corrections

app = FastAPI(title="Toneprint Backend", version="1.0.0")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONTAINER_TAG = "toneprint_system"
supermemory_online = False

class SupermemoryClient:
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        
    def add_document(self, content: str, container_tag: str, metadata: dict = None, custom_id: str = None) -> dict:
        url = f"{self.base_url}/v3/documents"
        body = {
            "content": content,
            "containerTag": container_tag
        }
        if metadata:
            body["metadata"] = metadata
        if custom_id:
            body["customId"] = custom_id
            
        req_body = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=req_body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
            
    def search_memories(self, q: str, container_tag: str, filters: dict = None, limit: int = 3) -> dict:
        url = f"{self.base_url}/v4/search"
        body = {
            "q": q,
            "containerTag": container_tag,
            "limit": limit
        }
        if filters:
            body["filters"] = filters
            
        req_body = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=req_body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))

sm_client = None

def connect_supermemory():
    global sm_client, supermemory_online
    api_key = os.environ.get("SUPERMEMORY_API") or os.environ.get("SUPERMEMORY_API_KEY") or "toneprint_dev_key"
    base_url = "http://localhost:6767"
    
    print(f"[Supermemory] Attempting to connect to Supermemory Local: {base_url}")
    try:
        sm_client = SupermemoryClient(api_key, base_url)
        # Verify connection by doing a simple query
        sm_client.search_memories(
            q="connection test",
            container_tag=CONTAINER_TAG,
            limit=1
        )
        supermemory_online = True
        print("[Supermemory] Supermemory Local connected successfully!")
    except Exception as e:
        supermemory_online = False
        print(f"[Supermemory] Supermemory Local connection failed: {str(e)}. Running in Simulated Memory mode.")

# Run connection check
connect_supermemory()

# In-memory store fallback if Supermemory Local is offline
mock_memory_store = []

# API Route Schemas
class GenerateRequest(BaseModel):
    request: str
    context: str

class ExtractRequest(BaseModel):
    original: str
    edited: str
    context: str

class StoreRequest(BaseModel):
    correction: Dict[str, Any]

class SearchRequest(BaseModel):
    query: str
    context: str

class GenerateWithMemoryRequest(BaseModel):
    request: str
    context: str
    corrections: List[Dict[str, Any]]

# Endpoints
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "supermemory": "local" if supermemory_online else "offline",
        "ollama": {
            "baseUrl": llm.OLLAMA_BASE_URL,
            "model": llm.OLLAMA_MODEL,
        }
    }

@app.post("/api/generate")
async def generate(data: GenerateRequest):
    try:
        draft = llm.generate_draft(data.request, data.context)
        if hasattr(draft, '__await__'):
            draft = await draft
        return {"draft": draft}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract")
async def extract(data: ExtractRequest):
    try:
        correction = llm.extract_correction(data.original, data.edited, data.context)
        if hasattr(correction, '__await__'):
            correction = await correction
        return {"correction": correction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/store-correction")
async def store_correction(data: StoreRequest):
    correction = data.correction
    if not correction or "rule" not in correction:
        raise HTTPException(status_code=400, detail="Missing correction data")
        
    content = "\n".join([
        f"[STYLE CORRECTION - {correction['context'].upper()}]",
        f"Rule: {correction['rule']}",
        f"Avoid: {'; '.join(correction.get('avoid', []))}",
        f"Prefer: {'; '.join(correction.get('prefer', []))}",
        f"Evidence (before): {correction.get('evidence', {}).get('before', '')}",
        f"Evidence (after): {correction.get('evidence', {}).get('after', '')}"
    ])
    
    metadata = {
        "type": "style_correction",
        "context": correction["context"],
        "rule": correction["rule"],
        "avoid": json.dumps(correction.get("avoid", [])),
        "prefer": json.dumps(correction.get("prefer", [])),
        "evidence_before": correction.get("evidence", {}).get("before", ""),
        "evidence_after": correction.get("evidence", {}).get("after", "")
    }
    
    if supermemory_online and sm_client:
        try:
            result = sm_client.add_document(
                content=content,
                container_tag=CONTAINER_TAG,
                metadata=metadata
            )
            doc_id = result.get("id", "doc-" + str(len(mock_memory_store)))
            print(f"Stored correction in Supermemory Local: {doc_id}")
            return {"success": True, "id": doc_id, "mode": "supermemory"}
        except Exception as e:
            print(f"Failed to save to Supermemory Local, falling back to in-memory store: {str(e)}")
            
    mock_id = f"mock-{int(time.time())}"
    mock_memory_store.append({"id": mock_id, "content": content, "metadata": metadata})
    print(f"Stored correction in local in-memory fallback: {mock_id}")
    return {"success": True, "id": mock_id, "mode": "mock_store"}

@app.post("/api/search-corrections")
async def search_corrections(data: SearchRequest):
    if supermemory_online and sm_client:
        try:
            filters = {
                "AND": [
                    {"key": "context", "value": data.context, "filterType": "metadata"},
                    {"key": "type", "value": "style_correction", "filterType": "metadata"}
                ]
            }
            search_result = sm_client.search_memories(
                q=data.query,
                container_tag=CONTAINER_TAG,
                filters=filters,
                limit=3
            )
            
            parsed_results = []
            results_list = search_result.get("results", [])
            for r in results_list:
                meta = r.get("metadata", {})
                try:
                    avoid = json.loads(meta.get("avoid", "[]"))
                    prefer = json.loads(meta.get("prefer", "[]"))
                except:
                    avoid = []
                    prefer = []
                    
                parsed_results.append({
                    "rule": meta.get("rule", r.get("memory", "")),
                    "avoid": avoid,
                    "prefer": prefer,
                    "evidence": {
                        "before": meta.get("evidence_before", ""),
                        "after": meta.get("evidence_after", "")
                    },
                    "score": r.get("similarity", 0.9)
                })
                
            return {"results": parsed_results}
        except Exception as e:
            print(f"Supermemory Local search failed, falling back to in-memory search: {str(e)}")
            
    # Search mock store
    matches = []
    for m in mock_memory_store:
        if m["metadata"]["context"] == data.context:
            try:
                avoid = json.loads(m["metadata"]["avoid"])
                prefer = json.loads(m["metadata"]["prefer"])
            except:
                avoid = []
                prefer = []
                
            matches.append({
                "rule": m["metadata"]["rule"],
                "avoid": avoid,
                "prefer": prefer,
                "evidence": {
                    "before": m["metadata"]["evidence_before"],
                    "after": m["metadata"]["evidence_after"]
                },
                "score": 0.9
            })
            
    return {"results": matches}

@app.post("/api/generate-with-memory")
async def generate_with_memory(data: GenerateWithMemoryRequest):
    try:
        output = llm.generate_with_memory(data.request, data.context, data.corrections)
        if hasattr(output, '__await__'):
            output = await output
        return {"output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# SPA Client Static Hosting (serves from frontend/dist)
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))

if os.path.exists(dist_dir):
    # Mount assets folder for bundle styles/scripts
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
    @app.get("/{fallback_path:path}")
    async def serve_spa(fallback_path: str):
        # Direct requests to index.html for react routes/initial mounts
        index_path = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return JSONResponse(status_code=404, content={"error": "Client build files not found."})
