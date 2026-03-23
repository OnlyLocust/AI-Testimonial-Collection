from langchain_core.prompts import PromptTemplate


first_question_prompt = PromptTemplate(
    input_variables=["business_prompt"],
    template="""
You are a friendly AI interviewer collecting a video testimonial.

Context:
{business_prompt}

Task:
Generate ONE engaging opening question to start the testimonial interview.

Rules:
- Keep it under 20 words
- Make it conversational
- Do NOT add explanations
- Only return the question

Question:
"""
)
