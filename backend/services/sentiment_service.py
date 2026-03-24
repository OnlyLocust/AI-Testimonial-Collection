from services.llm.llm_init import llm
from services.prompts.sentiment import sentiment_prompt
from langchain_classic.chains import LLMChain

sentiment_chain = LLMChain(
    llm=llm,
    prompt=sentiment_prompt,
    output_key="sentiment"
)

def detect_sentiment(user_answer, business_prompt):
    sentiment_result = sentiment_chain.invoke({
        "answer": user_answer,
        "business_prompt": business_prompt
    })
    return sentiment_result["sentiment"].strip()