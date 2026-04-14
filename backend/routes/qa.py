from fastapi import APIRouter, UploadFile, File, Form
import uuid
from datetime import datetime, timezone
from services.synthesis_service import generate_testimonial_bundle

from models.schemas import StartRequest, AnswerRequest, SynthesizeRequest
from database import get_session, save_session, sessions_collection
from services.llm_service import (
    generate_first_question,
    generate_followup_question
)
from services.sentiment_service import detect_sentiment
from services.validation_service import validate_answer

import speech_recognition as sr
from pydub import AudioSegment
import io

from dotenv import load_dotenv
import os
load_dotenv()

DurationLimit = int(os.getenv("DurationLimit"))

# Hard-cap: end interview after this many Q&A turns (prevents runaway LLM costs)
MAX_QUESTIONS = int(os.getenv("MAX_QUESTIONS", 8))

r = sr.Recognizer()

router = APIRouter()

# ----------- HELPER FUNCTIONS -----------

def get_conversation_text(session):
    history = ""
    for qa in session["conversation"]:
        if qa["answer"]:
            history += f"\nAI: {qa['question']}\nUser: {qa['answer']} (Sentiment: {qa['sentiment']})"
    return history


def calc_time_remaining(session) -> int:
    """Return how many whole seconds are left in the session (never < 0)."""
    start_time = session["start_time"]
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()
    return max(0, int(DurationLimit - elapsed))


# ----------- START INTERVIEW -----------

@router.post("/start")
async def start_interview(req: StartRequest):
    session_id = str(uuid.uuid4())

    first_question = generate_first_question(req.business_prompt)

    session_doc = {
        "_id": session_id,
        "start_time": datetime.now(timezone.utc),
        "business_prompt": req.business_prompt,
        "conversation": [
            {
                "question": first_question,
                "answer": None,
                "sentiment": None
            }
        ]
    }

    await save_session(session_doc)

    return {
        "session_id": session_id,
        "question": first_question,
        "time_remaining": DurationLimit  # Full duration at start
    }


# ----------- NEXT QUESTION -----------

@router.post("/next-question")
async def next_question(req: AnswerRequest):
    session_id = req.session_id
    user_answer = req.answer

    session = await get_session(session_id)
    if not session:
        return {"error": "Invalid session_id"}

    # --- Clock sync: calculate server-authoritative time remaining ---
    time_remaining = calc_time_remaining(session)

    if time_remaining <= 0:
        return {
            "status": "complete",
            "message": "Time limit reached. Thank you!",
            "time_remaining": 0
        }

    # --- Question hard-cap safety check ---
    answered_count = sum(1 for qa in session["conversation"] if qa["answer"] is not None)
    if answered_count >= MAX_QUESTIONS:
        return {
            "status": "complete",
            "message": "We have gathered everything we need. Thank you!",
            "time_remaining": time_remaining
        }

    # --- Smart input validation ---
    validation = validate_answer(user_answer)
    if not validation["valid"]:
        return {
            "status": "retry",
            "message": validation["message"],
            "time_remaining": time_remaining
        }

    business_prompt = session["business_prompt"]

    # Detect sentiment
    sentiment = detect_sentiment(user_answer, business_prompt)

    # Mutate local session to construct new history accurately
    last_idx = len(session["conversation"]) - 1
    session["conversation"][last_idx]["answer"] = user_answer
    session["conversation"][last_idx]["sentiment"] = sentiment

    # Build history
    history = get_conversation_text(session)

    # Generate next question
    next_q = generate_followup_question(
        business_prompt,
        history,
        user_answer
    )

    # Persist updated conversation + new question
    await sessions_collection.find_one_and_update(
        {"_id": session_id},
        {
            "$set": {
                f"conversation.{last_idx}.answer": user_answer,
                f"conversation.{last_idx}.sentiment": sentiment
            },
            "$push": {
                "conversation": {
                    "question": next_q,
                    "answer": None,
                    "sentiment": None
                }
            }
        }
    )

    return {
        "status": "continue",
        "question": next_q,
        "time_remaining": time_remaining
    }


# ----------- SESSION HANDSHAKE (refresh-safe) -----------

@router.get("/verify-session/{session_id}")
async def verify_session(session_id: str):
    session = await get_session(session_id)
    if not session:
        return {"status": "invalid"}

    time_remaining = calc_time_remaining(session)

    if time_remaining <= 0:
        return {"status": "expired"}

    # Return the current question (last unanswered) for UI restoration
    conversation = session.get("conversation", [])
    current_question = None
    for qa in reversed(conversation):
        if qa["answer"] is None:
            current_question = qa["question"]
            break

    return {
        "status": "valid",
        "time_remaining": time_remaining,
        "current_question": current_question
    }


# ----------- TRANSCRIBE -----------

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    # 1. Load the WebM data
    audio_bytes = await audio.read()
    audio_file = io.BytesIO(audio_bytes)

    # 2. Convert WebM to WAV in memory
    audio_segment = AudioSegment.from_file(audio_file, format="webm")
    wav_io = io.BytesIO()
    audio_segment.export(wav_io, format="wav")
    wav_io.seek(0)

    # 3. Recognize using Google
    with sr.AudioFile(wav_io) as source:
        audio_data = r.record(source)
        try:
            text = r.recognize_google(audio_data)
            return {"transcript": text}
        except sr.UnknownValueError:
            return {"transcript": "", "error": "Could not understand audio"}
        except sr.RequestError:
            return {"transcript": "", "error": "API unavailable"}


# ----------- SYNTHESIZE -----------

@router.post("/synthesize")
async def synthesize_testimonial(req: SynthesizeRequest):
    session_id = req.session_id
    session = await get_session(session_id)
    if not session:
        return {"error": "Invalid session_id"}

    # ── Session Finalizer Guard ──────────────────────────────────────────────
    # If the session is already published, return the cached bundle to avoid
    # making a redundant (and expensive) LLM call for the same conversation data.
    if session.get("is_published") and session.get("cached_bundle"):
        return session["cached_bundle"]
    # ─────────────────────────────────────────────────────────────────────────

    history = get_conversation_text(session)
    bundle = generate_testimonial_bundle(history)

    # ── Mark session as finalised & cache the bundle ─────────────────────────
    await sessions_collection.find_one_and_update(
        {"_id": session_id},
        {"$set": {"is_published": True, "cached_bundle": bundle}}
    )
    # ─────────────────────────────────────────────────────────────────────────

    return bundle
