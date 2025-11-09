from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import requests
from typing import List, Dict, Any

app = FastAPI()

# CORS
origins = [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5174", "http://127.0.0.1:5174",
]
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

# Upstream helper
UPSTREAM = "https://hackutd2025.eog.systems"

def fetch_upstream(path: str, **params):
    url = f"{UPSTREAM}{path}"
    try:
        r = requests.get(url, params=params or None, timeout=20)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=str(e))

# ---------- Proxies ----------
@app.get("/api/cauldrons")
def get_cauldrons_proxy():
    return fetch_upstream("/api/Information/cauldrons")

@app.get("/api/data")
def data_all(start_date: str | None = None, end_date: str | None = None):
    return fetch_upstream("/api/Data", start_date=start_date, end_date=end_date)

@app.get("/api/data/series/{cauldron_id}")
def data_series_by_cauldron(
    cauldron_id: str,
    start_date: str | None = None,
    end_date: str | None = None,
):
    # large default window if none provided
    start_date = start_date or "0"
    end_date = end_date or "2000000000"

    rows = fetch_upstream("/api/Data", start_date=start_date, end_date=end_date) or []
    out = []
    for r in rows:
        ts = r.get("timestamp")
        levels = r.get("cauldron_levels") or {}
        v = levels.get(cauldron_id)
        if v is None or ts is None:
            continue
        try:
            ms = int(datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp() * 1000)
        except Exception:
            continue
        out.append({"timestamp": ms, "volume": float(v)})
    out.sort(key=lambda x: x["timestamp"])
    return out

@app.get("/api/data/latest")
def data_latest_snapshot():
    rows = fetch_upstream("/api/Data") or []
    if not rows:
        return {}
    return rows[-1].get("cauldron_levels") or {}

# ---------- Derived flags (placeholder tickets) ----------
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

if __name__ == "__main__":
    import uvicorn, os
    port = int(os.getenv("PORT", "5001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
