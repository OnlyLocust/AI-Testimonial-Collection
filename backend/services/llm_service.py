from dotenv import load_dotenv
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import LLMChain
from langchain_core.prompts import PromptTemplate

load_dotenv()
API_KEY=os.getenv("GOOGLE_API_KEY")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", 
    temperature=0.2,
    google_api_key=API_KEY
)



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

first_question_chain = LLMChain(
    llm=llm,
    prompt=first_question_prompt,
    output_key="question"
)

def generate_first_question(business_prompt):
    # Replace with your first_question_chain
    business_prompt = "Collect testimonial for my pizza restaurant"
    result = first_question_chain.invoke({
        "business_prompt": business_prompt
    })
    return result["question"]

def generate_followup_question(business_prompt, history, last_answer):
    # Replace with your followup_chain
    return "What did you like most about it?"