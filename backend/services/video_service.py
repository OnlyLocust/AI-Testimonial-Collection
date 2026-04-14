"""
video_service.py — Video Reel mock service.

Provides:
  POST /generate-reel   → Simulated heavy render task (4-second delay)
  POST /re-polish       → Grammar/flow polish for manually edited testimonials
"""

import asyncio
from fastapi import APIRouter
from pydantic import BaseModel

from database import get_session, sessions_collection
from services.synthesis_service import repolish_testimonial

router = APIRouter(prefix="/video", tags=["video"])

# ─────────────────────────────────────────────────────────────
# Request Schemas
# ─────────────────────────────────────────────────────────────

class ReelRequest(BaseModel):
    session_id: str

class RepolishRequest(BaseModel):
    edited_text: str


# ─────────────────────────────────────────────────────────────
# POST /video/generate-reel
# ─────────────────────────────────────────────────────────────

# A publicly accessible sample video that reliably serves an MP4 stream.
# Swap this for a real rendered URL once video infrastructure is in place.
SAMPLE_VIDEO_URL = (
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
)

@router.post("/generate-reel")
async def generate_reel(req: ReelRequest):
    """
    Simulated heavy render task.
    Validates the session exists, waits 4 seconds to mimic render time,
    then returns a sample video URL linked to the session.
    """
    session = await get_session(req.session_id)
    if not session:
        return {"error": "Invalid session_id"}

    # ── Simulated render pipeline ──
    await asyncio.sleep(4)

    # In a real implementation this URL would come from a video render service.
    video_url = SAMPLE_VIDEO_URL

    return {
        "status": "ready",
        "session_id": req.session_id,
        "video_url": video_url,
        "duration_seconds": 15,
    }


# ─────────────────────────────────────────────────────────────
# POST /video/re-polish
# ─────────────────────────────────────────────────────────────

@router.post("/re-polish")
async def re_polish(req: RepolishRequest):
    """
    AI-powered grammar & flow fixer for manually edited testimonials.
    Runs repolish_testimonial in a thread to stay non-blocking.
    """
    if not req.edited_text or not req.edited_text.strip():
        return {"error": "edited_text must not be empty"}

    # Run the synchronous LangChain call in a thread pool to avoid blocking
    polished = await asyncio.to_thread(repolish_testimonial, req.edited_text)

    return {"polished_text": polished}
