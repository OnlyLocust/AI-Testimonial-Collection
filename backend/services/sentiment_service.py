from services.llm.llm_init import llm
from services.prompts.sentiment import sentiment_prompt
from langchain_classic.chains import LLMChain

from dotenv import load_dotenv
import os
load_dotenv()
DEV_MODE = os.getenv("DEV_MODE", "False") == "True"

def get_sentiment_chain():
    if DEV_MODE:
        return None  # not needed
    return LLMChain(
        llm=llm,
        prompt=sentiment_prompt,
        output_key="sentiment"
    )

def detect_sentiment(user_answer, business_prompt):

    if DEV_MODE:
        print("dev mode")
        return "Satisfied"

    sentiment_chain = get_sentiment_chain()

    sentiment_result = sentiment_chain.invoke({
        "answer": user_answer,
        "business_prompt": business_prompt
    })
    return sentiment_result["sentiment"].strip()