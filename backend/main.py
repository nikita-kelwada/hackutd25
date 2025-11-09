from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from typing import List, Dict, Any

app = FastAPI()

# Allow Vite dev (both localhost + 127.0.0.1)
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

# ---------- Upstream proxy ----------
@app.get("/api/cauldrons")
def get_cauldrons_proxy():
    api_url = "https://hackutd2025.eog.systems/api/Information/cauldrons"
    try:
        r = requests.get(api_url, timeout=10)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        # bubble up as a proper 502 for the client
        raise HTTPException(status_code=502, detail=str(e))

# ---------- Derived flags ----------
def derive_flags(cauldrons: List[Dict[str, Any]]):
    flags: List[Dict[str, Any]] = []
    for c in cauldrons or []:
        cap = c.get("max_volume")
        name = c.get("name")
        cid = c.get("id")
        if isinstance(cap, (int, float)) and cap < 700:
            flags.append({
                "id": f"small-cap-{cid}",
                "severity": "warning",
                "message": f"{name} has small capacity ({cap}). Monitor utilization.",
                "cauldronId": cid,
            })
    return flags

@app.get("/api/tickets")
def tickets():
    data = get_cauldrons_proxy()
    return derive_flags(data if isinstance(data, list) else [])

# Optional: only if you want to run `python main.py`
if __name__ == "__main__":
    import uvicorn, os
    port = int(os.getenv("PORT", "5001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
