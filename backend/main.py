import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai


# ==========================================
# NEXA AI STUDIO API
# ==========================================

app = FastAPI(
    title="NEXA AI STUDIO API",
    version="1.0.0"
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# REQUEST MODEL
# ==========================================

class GenerateRequest(BaseModel):
    prompt: str
    mode: str = "video"
    aspect_ratio: str = "16:9"
    resolution: str = "720p"


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():
    return {
        "app": "NEXA AI STUDIO API",
        "status": "online"
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/api/health")
def health():

    api_key = os.getenv("GEMINI_API_KEY")

    return {
        "status": "ok",
        "provider": "Gemini Omni Flash",
        "api_key_configured": bool(api_key)
    }


# ==========================================
# VIDEO GENERATION
# ==========================================

@app.post("/api/generate")
def generate(data: GenerateRequest):

    # --------------------------------------
    # Get API key from Render environment
    # --------------------------------------

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured on the server."
        )


    # --------------------------------------
    # Validate prompt
    # --------------------------------------

    prompt = data.prompt.strip()

    if not prompt:
        raise HTTPException(
            status_code=400,
            detail="Prompt is required."
        )


    # --------------------------------------
    # Only video for now
    # --------------------------------------

    if data.mode != "video":
        raise HTTPException(
            status_code=400,
            detail="Currently NEXA AI STUDIO backend supports video generation."
        )


    # --------------------------------------
    # Validate aspect ratio
    # --------------------------------------

    allowed_ratios = [
        "16:9",
        "9:16"
    ]

    if data.aspect_ratio not in allowed_ratios:
        raise HTTPException(
            status_code=400,
            detail="Invalid aspect ratio. Use 16:9 or 9:16."
        )


    # --------------------------------------
    # Validate resolution
    # --------------------------------------

    allowed_resolutions = [
        "360p",
        "720p",
        "1080p",
        "4k"
    ]

    if data.resolution not in allowed_resolutions:
        raise HTTPException(
            status_code=400,
            detail="Invalid resolution."
        )


    try:

        # ----------------------------------
        # Create Gemini client
        # ----------------------------------

        client = genai.Client(
            api_key=api_key
        )


        # ----------------------------------
        # Generate video
        # ----------------------------------

        interaction = client.interactions.create(

            model="gemini-omni-1.1-flash",

            input=prompt,

            response_format={
                "type": "video",
                "aspect_ratio": data.aspect_ratio,
                "resolution": data.resolution
            }
        )


        # ----------------------------------
        # Check video output
        # ----------------------------------

        if not interaction.output_video:

            raise HTTPException(
                status_code=502,
                detail="Gemini did not return a video."
            )


        if not interaction.output_video.data:

            raise HTTPException(
                status_code=502,
                detail="Gemini returned an empty video."
            )


        # ----------------------------------
        # Base64 video
        # ----------------------------------

        video_base64 = interaction.output_video.data


        # ----------------------------------
        # Return video to frontend
        # ----------------------------------

        return {
            "status": "completed",
            "model": "gemini-omni-1.1-flash",
            "video": (
                "data:video/mp4;base64,"
                + video_base64
            )
        }


    # --------------------------------------
    # HTTP errors
    # --------------------------------------

    except HTTPException:
        raise


    # --------------------------------------
    # Gemini / Python errors
    # --------------------------------------

    except Exception as e:

        print(
            "VIDEO GENERATION ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Video generation failed: {str(e)}"
        )
