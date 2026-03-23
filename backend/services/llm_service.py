from langchain_classic.chains import LLMChain
from langchain_core.prompts import PromptTemplate

from services.llm.llm_init import llm
from services.prompts.first_question import first_question_prompt
from services.prompts.follow_question import followup_question_prompt

first_question_chain = LLMChain(
    llm=llm,
    prompt=first_question_prompt,
    output_key="question"
)

followup_chain = LLMChain(
    llm=llm,
    prompt=followup_question_prompt,
    output_key="followup_question"
)

def generate_first_question(business_prompt):
    # Replace with your first_question_chain
    # business_prompt = "Collect testimonial for my pizza restaurant"
    result = first_question_chain.invoke({
        "business_prompt": business_prompt
    })
    return result["question"]

def generate_followup_question(business_prompt, history, last_answer):
    # Replace with your followup_chain
    return "What did you like most about it?"