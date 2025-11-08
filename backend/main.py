from fastapi import FastAPI
import pandas as pd

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Potion Flow API is running!"}

@app.get("/cauldrons")
def get_cauldrons():
    return [
        {"id": 1, "name": "Cauldron A", "level": 80},
        {"id": 2, "name": "Cauldron B", "level": 45},
    ]
