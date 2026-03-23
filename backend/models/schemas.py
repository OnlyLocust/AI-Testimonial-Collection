from pydantic import BaseModel

class StartRequest(BaseModel):
    business_prompt: str

class AnswerRequest(BaseModel):
    session_id: str
    answer: str