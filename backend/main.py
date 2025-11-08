from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

# --- This is the "permission slip" FOR YOUR OWN APP ---
# This tells the browser: "It's OK to let http://localhost:5173 talk to me."
origins = [
    "http://localhost:5173",  # The address of your React frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)
# ----------------------------------------------------

# This is your new "proxy" endpoint
@app.get("/api/cauldrons")
def get_cauldrons_proxy():
    # This is the server-to-server request. No browser, no CORS!
    api_url = "https://hackutd2025.eog.systems/api/Information/cauldrons"

    try:
        # Your server calls the API
        response = requests.get(api_url)
        # Check if the request was successful
        response.raise_for_status() 
        # Return the JSON data from the API
        return response.json()
    except requests.exceptions.RequestException as e:
        # Handle any errors
        return {"error": str(e)}, 500

# This makes the server run when you execute the file
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)