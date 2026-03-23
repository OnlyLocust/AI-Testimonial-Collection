from langchain_core.prompts import PromptTemplate


followup_question_prompt = PromptTemplate(
    input_variables=["business_prompt", "conversation_history", "last_answer"],
    template="""
You are a friendly AI interviewer collecting a testimonial.

Business Context:
{business_prompt}

Conversation So Far:
{conversation_history}

User's Latest Answer:
{last_answer}

Task:
Generate ONE natural follow-up question based on the latest answer.

Rules:
- Do NOT repeat previous questions
- Keep it under 20 words
- Make it conversational
- Only return the question

Follow-up Question:
"""
)