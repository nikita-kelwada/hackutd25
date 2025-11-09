# backend/main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import requests
from typing import List, Dict, Any, Union

# Make sure you have this file
from analysis import detect_drain_events 

app = FastAPI()

# (Your existing CORS middleware code)
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

# (Your existing fetch_upstream helper function)
UPSTREAM = "https://hackutd2025.eog.systems"

def fetch_upstream(path: str, **params):
    filtered_params = {k: v for k, v in params.items() if v is not None}
    url = f"{UPSTREAM}{path}"
    print(f"Fetching upstream: {url} with params {filtered_params}")
    try:
        r = requests.get(url, params=filtered_params or None, timeout=20)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        print(f"Upstream fetch error: {e}")
        raise HTTPException(status_code=502, detail=str(e))

# (Your existing /api/cauldrons, /api/data, /api/data/latest, /api/tickets proxies)
@app.get("/api/cauldrons")
def get_cauldrons_proxy():
    return fetch_upstream("/api/Information/cauldrons")

@app.get("/api/data")
def data_all(start_date: Union[str, None] = None, end_date: Union[str, None] = None):
    return fetch_upstream("/api/Data", start_date=start_date, end_date=end_date)

@app.get("/api/data/latest")
def data_latest_snapshot():
    try:
        return fetch_upstream("/api/Data/latest")
    except HTTPException:
        rows = fetch_upstream("/api/Data") or []
        if not rows: return {}
        return rows[-1].get("cauldron_levels") or {}

@app.get("/api/tickets")
def tickets(start_date: Union[str, None] = None, end_date: Union[str, None] = None):
    return fetch_upstream("/api/Tickets", start_date=start_date, end_date=end_date)


# (This endpoint for the graph is unchanged)
@app.get("/api/data/series/{cauldron_id}")
def data_series_by_cauldron(
    cauldron_id: str,
    start_date: Union[str, None] = None,
    end_date: Union[str, None] = None,
):
    start_date = start_date or "0" # Fetch all data
    end_date = end_date or "2000000000" # Fetch all data
    rows = fetch_upstream("/api/Data", start_date=start_date, end_date=end_date) or []
    out = []
    for r in rows:
        ts, levels = r.get("timestamp"), r.get("cauldron_levels") or {}
        v = levels.get(cauldron_id)
        if v is None or ts is None: continue
        try:
            ms = int(datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp() * 1000)
            out.append({"timestamp": ms, "volume": float(v)})
        except Exception:
            continue
    out.sort(key=lambda x: x["timestamp"])
    return out

# --- UPDATED ANALYSIS ENDPOINT ---
@app.get("/api/analysis/drains/{cauldron_id}")
def get_cauldron_drain_events(
    cauldron_id: str,
    limit: Union[int, None] = None # New parameter, replaces timeframe
):
    """
    Analyzes and returns the last 'limit' drain events for a cauldron.
    """
    print(f"Detecting drain events for {cauldron_id}, limit={limit}")
    
    try:
        # 1. Fetch ALL data to find all events
        cauldrons = fetch_upstream("/api/Information/cauldrons")
        # We must get all data to find all drains, then sort and limit
        historical_data = fetch_upstream("/api/Data") 
        
        # 2. Run detection logic
        events = detect_drain_events(cauldron_id, historical_data, cauldrons)
        
        # 3. Sort by most recent first
        events.sort(key=lambda x: x["startTime"], reverse=True)
        
        # 4. Return the limited number, if a limit is provided
        if limit is not None and limit > 0:
            return events[:limit]
        
        # Return all if no limit or limit is 0/None
        return events 

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# (Your existing __name__ == "__main__" block)
if __name__ == "__main__":
    import uvicorn, os
    port = int(os.getenv("PORT", "5001"))
    uvicorn.run(app, host="0.0.0.0", port=port)