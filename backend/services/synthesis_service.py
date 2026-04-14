import json
from dotenv import load_dotenv
import os
from pydantic import BaseModel, Field
from typing import List
from langchain_core.prompts import PromptTemplate

from services.llm.llm_init import llm

load_dotenv()
DEV_MODE = os.getenv("DEV_MODE", "False") == "True"

# ─────────────────────────────────────────────────────────────
# Schema: full testimonial bundle (now with achievements)
# ─────────────────────────────────────────────────────────────

class TestimonialBundle(BaseModel):
    formal: str = Field(description="A professional, corporate-ready testimonial.")
    casual: str = Field(description="A friendly, emoji-rich version that sounds authentic.")
    linkedin: str = Field(description="A high-impact LinkedIn post with relevant hashtags.")
    highlights: List[str] = Field(description="A list of 3-4 short 'Key Wins' (e.g., 'Fast Support', 'High ROI').")
    achievements: List[str] = Field(
        description=(
            "A list of up to 5 specific, measurable outcomes or metrics extracted verbatim from "
            "the user's answers — e.g., '40% increase in sales', 'cut onboarding time in half', "
            "'saved 3 hours per week'. If no concrete metrics are mentioned, provide concise "
            "qualitative wins instead."
        )
    )

# ─────────────────────────────────────────────────────────────
# Prompt: context-aware cross-referencing
# ─────────────────────────────────────────────────────────────

SYNTHESIS_TEMPLATE = """
You are an elite testimonial copywriter renowned for synthesising authentic customer voices into \
compelling, high-conversion social proof.

## Your Task
Transform the interview conversation below into a polished **Testimonial Bundle** as structured JSON.

## Cross-Referencing Rules (critical)
1. **Identify recurring themes**: If the user mentions the same concept (e.g. "speed", "ease of use", \
"team support") across multiple answers, that is a **core theme**. Amplify it in EVERY testimonial variant.
2. **Preserve the user's authentic voice**: Remove filler words (um, uh, like, you know), fix grammar, \
but keep their personal style and emotional tone intact.
3. **Achievements extraction**: Scan ALL answers meticulously for any numbers, percentages, time-savings, \
revenue figures, or concrete outcomes. Pull them out verbatim (or lightly cleaned) into the `achievements` list.
4. **Tone consistency per variant**: formal = polished & boardroom-ready; casual = warm, relatable, emoji-friendly; \
linkedin = thought-leadership angle with 3-5 relevant hashtags.
5. Do NOT invent facts or metrics that the user did not mention.

## Conversation History
{conversation_history}

## Output
Return valid JSON matching the required schema exactly.
"""

# ─────────────────────────────────────────────────────────────
# Re-polish prompt (for the /re-polish endpoint)
# ─────────────────────────────────────────────────────────────

REPOLISH_TEMPLATE = """
You are a professional editor. The user manually edited their AI-generated testimonial and wants you \
to fix any grammar, punctuation, or flow issues while preserving ALL of their intentional wording, \
personal style, and facts.

## Rules
- Do NOT change the meaning or add new information.
- Fix grammar errors, awkward phrasing, and run-on sentences.
- Keep every specific detail, name, or metric the user wrote.
- Return ONLY the improved testimonial text — no explanation, no preamble.

## User's Edited Testimonial
{edited_text}
"""

# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────

def generate_testimonial_bundle(conversation_history: str) -> dict:
    """Synthesise a full testimonial bundle from interview conversation history."""
    if DEV_MODE:
        print("[DEV] Returning mock testimonial bundle")
        return {
            "formal": (
                "The level of professionalism displayed was exemplary. Their approach "
                "significantly optimised our workflow, resulting in measurable efficiency gains. "
                "I wholeheartedly recommend their services to any forward-thinking organisation."
            ),
            "casual": (
                "Honestly? This is a total game-changer! 🚀 I was blown away by how quickly "
                "everything came together. If you're on the fence, just try it — you won't look back!"
            ),
            "linkedin": (
                "I'm thrilled to share my experience with this innovative platform. The seamless "
                "integration and powerful AI capabilities transformed how our team operates. "
                "The results speak for themselves. #Innovation #AI #ProductivityHack #Leadership"
            ),
            "highlights": ["Efficiency Boost", "Seamless Integration", "User-Centric Design", "Rapid ROI"],
            "achievements": ["40% reduction in manual work", "Saved 5 hours per week", "Team onboarding cut by half"],
        }

    prompt = PromptTemplate(
        template=SYNTHESIS_TEMPLATE,
        input_variables=["conversation_history"]
    )

    chain = prompt | llm.with_structured_output(TestimonialBundle)
    result = chain.invoke({"conversation_history": conversation_history})
    return result.model_dump()


def repolish_testimonial(edited_text: str) -> str:
    """Fix grammar and flow in a manually edited testimonial without changing its substance."""
    if DEV_MODE:
        print("[DEV] Returning mock re-polished text")
        return edited_text.strip() + " [Grammar polished in dev mode]"

    prompt = PromptTemplate(
        template=REPOLISH_TEMPLATE,
        input_variables=["edited_text"]
    )

    chain = prompt | llm
    result = chain.invoke({"edited_text": edited_text})
    # AIMessage → extract string content
    return result.content if hasattr(result, "content") else str(result)
