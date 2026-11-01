import os
import base64

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai


app = FastAPI(title="NEXA AI STUDIO API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "16:9"
    resolution: str = "720p"


@app.get("/")
def home():
    return {
        "app": "NEXA AI STUDIO API",
        "status": "online"
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "provider": "Gemini Omni Flash"
    }


@app.post("/api/generate")
def generate(data: GenerateRequest):

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured on the server."
        )

    if not data.prompt.strip():
        raise HTTPException(
            status_code=400,
            detail="Prompt is required."
        )

    try:
        client = genai.Client(api_key=api_key)

        interaction = client.interactions.create(
            model="gemini-omni-1.1-flash",
            input=data.prompt,
            response_format={
                "type": "video",
                "aspect_ratio": data.aspect_ratio,
                "resolution": data.resolution,
            },
        )

        if not interaction.output_video:
            raise HTTPException(
                status_code=502,
                detail="AI provider did not return a video."
            )

        video_base64 = interaction.output_video.data

        return {
            "status": "completed",
            "video": f"data:video/mp4;base64,{video_base64}"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Video generation failed: {str(e)}"
        )
