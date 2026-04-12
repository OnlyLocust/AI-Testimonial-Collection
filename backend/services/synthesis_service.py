import json
from dotenv import load_dotenv
import os
from pydantic import BaseModel, Field
from typing import List
from langchain_core.prompts import PromptTemplate

from services.llm.llm_init import llm

load_dotenv()
DEV_MODE = os.getenv("DEV_MODE", "False") == "True"

class TestimonialBundle(BaseModel):
    formal: str = Field(description="A professional, corporate-ready testimonial.")
    casual: str = Field(description="A friendly, emoji-friendly version.")
    linkedin: str = Field(description="A high-impact post version with relevant hashtags.")
    highlights: List[str] = Field(description="A list of 3-4 short 'Key Wins' (e.g., 'Fast Support', 'High Quality').")

SYNTHESIS_TEMPLATE = """
You are an expert copywriter. Your task is to transform the provided interview conversation history into a polished testimonial bundle.
Instructions:
Remove filler words (um, uh, like), fix grammar, and maintain the user's authentic voice while making them sound more professional and confident.
The output must conform to the required JSON structure.

Conversation History:
{conversation_history}
"""

def generate_testimonial_bundle(conversation_history: str) -> dict:
    if DEV_MODE:
        print("dev mode synthesis")
        return {
            "formal": "The level of professionalism displayed was exemplary. Their approach significantly optimized our workflow. I highly recommend their services.",
            "casual": "Honestly, this is a game-changer! 🚀 I was blown away by how easy it was. If you're on the fence, just try it!",
            "linkedin": "I’m thrilled to share my experience working with this innovative platform. The integration is seamless and powerful. #Innovation #AI",
            "highlights": ["Efficiency Boost", "Seamless Integration", "User-Centric"]
        }
        
    prompt = PromptTemplate(
        template=SYNTHESIS_TEMPLATE,
        input_variables=["conversation_history"]
    )
    
    chain = prompt | llm.with_structured_output(TestimonialBundle)
    
    result = chain.invoke({"conversation_history": conversation_history})
    return result.model_dump()
