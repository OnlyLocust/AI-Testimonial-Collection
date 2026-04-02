from pydantic import BaseModel
from datetime import datetime

class StartRequest(BaseModel):
    business_prompt: str
    start_time: datetime

class AnswerRequest(BaseModel):
    session_id: str
    answer: str
    current_time: datetime