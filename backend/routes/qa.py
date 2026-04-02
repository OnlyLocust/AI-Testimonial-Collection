from fastapi import APIRouter, UploadFile, File, Form
import uuid

from models.schemas import StartRequest, AnswerRequest
from utils.session_store import sessions
from services.llm_service import (
    generate_first_question,
    generate_followup_question
)
from services.sentiment_service import detect_sentiment

    
import speech_recognition as sr
from pydub import AudioSegment
import io


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
def start_interview(req: StartRequest):
    session_id = str(uuid.uuid4())

    first_question = generate_first_question(req.business_prompt)

    sessions[session_id] = {
        "start_time": req.start_time,
        "business_prompt": req.business_prompt,
        "conversation": [
            {
                "question": first_question,
                "answer": None,
                "sentiment": None
            }
        ]
    }

    return {
        "session_id": session_id,
        "question": first_question
    }


# ----------- NEXT QUESTION -----------

@router.post("/next-question")
def next_question(req: AnswerRequest):
    session_id = req.session_id
    user_answer = req.answer

    if session_id not in sessions:
        return {"error": "Invalid session_id"}

    session = sessions[session_id]
    business_prompt = session["business_prompt"]

    # 1. Store answer
    session["conversation"][-1]["answer"] = user_answer

    # 2. Detect sentiment
    sentiment = detect_sentiment(user_answer,business_prompt)

    # 3. Store sentiment
    session["conversation"][-1]["sentiment"] = sentiment

    # 2. Build history
    history = get_conversation_text(session)

    # 3. Generate next question
    next_q = generate_followup_question(
        session["business_prompt"],
        history,
        user_answer
    )

    # 4. Append new question
    session["conversation"].append({
        "question": next_q,
        "answer": None,
        "sentiment": None
    })
    
    return {
        "question": next_q
    }

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