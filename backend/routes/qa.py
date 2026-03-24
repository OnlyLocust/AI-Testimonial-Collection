from fastapi import APIRouter
import uuid

from models.schemas import StartRequest, AnswerRequest
from utils.session_store import sessions
from services.llm_service import (
    generate_first_question,
    generate_followup_question
)
from services.sentiment_service import detect_sentiment

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