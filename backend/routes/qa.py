from fastapi import APIRouter, UploadFile, File, Form
import uuid
from datetime import datetime, timezone

from models.schemas import StartRequest, AnswerRequest
from database import get_session, save_session, sessions_collection
from services.llm_service import (
    generate_first_question,
    generate_followup_question
)
from services.sentiment_service import detect_sentiment

import speech_recognition as sr
from pydub import AudioSegment
import io

from dotenv import load_dotenv
import os
load_dotenv()

DurationLimit = int(os.getenv("DurationLimit"))

r = sr.Recognizer()


router = APIRouter()

# ----------- HELPER FUNCTIONS -----------

def get_conversation_text(session):
    history = ""
    for qa in session["conversation"]:
        if qa["answer"]:
            history += f"\nAI: {qa['question']}\nUser: {qa['answer']} (Sentiment: {qa['sentiment']})"
    return history


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
        "question": first_question
    }


# ----------- NEXT QUESTION -----------

@router.post("/next-question")
async def next_question(req: AnswerRequest):
    session_id = req.session_id
    user_answer = req.answer

    session = await get_session(session_id)
    if not session:
        return {"error": "Invalid session_id"}

    business_prompt = session["business_prompt"]
    
    current_time = datetime.now(timezone.utc)
    start_time = session["start_time"]
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
        
    duration = (current_time - start_time).total_seconds()

    if duration > DurationLimit:
        return {
            "status": "complete", 
            "message": "Time limit reached. Thank you!"
        }

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

    # find_one_and_update the conversation history and sentiment
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
        "question": next_q
    }

@router.get("/verify-session/{session_id}")
async def verify_session(session_id: str):
    session = await get_session(session_id)
    if session:
        return {"status": "valid"}
    return {"status": "invalid"}

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