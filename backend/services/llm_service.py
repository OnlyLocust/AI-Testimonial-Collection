from langchain_classic.chains import LLMChain
from langchain_core.prompts import PromptTemplate

from services.llm.llm_init import llm
from services.prompts.first_question import first_question_prompt
from services.prompts.follow_question import followup_question_prompt

from dotenv import load_dotenv
import os
load_dotenv()
DEV_MODE = os.getenv("DEV_MODE", "False") == "True"


def get_first_question_chain():
    if DEV_MODE:
        return None  # not needed
    return LLMChain(
        llm=llm,
        prompt=first_question_prompt,
        output_key="question"
    )
    
def get_followup_chain():
    if DEV_MODE:
        return None  # not needed
    return LLMChain(
        llm=llm,
        prompt=followup_question_prompt,
        output_key="followup_question"
    )


def generate_first_question(business_prompt):

    if DEV_MODE:
        print("dev mode")
        return "Can you tell me about your experience with our pizza restaurant?"

    chain = get_first_question_chain()

    result = chain.invoke({
        "business_prompt": business_prompt
    })

    return result["question"]

def generate_followup_question(business_prompt, history, last_answer):

    if DEV_MODE:
        print("dev mode")
        return "What did you like most about our pizza?"

    chain = get_followup_chain()

    result = chain.invoke({
        "business_prompt": business_prompt,
        "conversation_history": history,
        "last_answer": last_answer
    })

    return result["followup_question"]