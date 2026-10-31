from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NEXA AI STUDIO API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "app": "NEXA AI STUDIO API",
        "status": "online"
    }

@app.post("/api/generate")
def generate(data: dict):
    return {
        "status": "pending",
        "message": "AI provider integration is not configured yet.",
        "received": data
    }
