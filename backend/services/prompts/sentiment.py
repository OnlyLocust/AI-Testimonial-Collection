from langchain_core.prompts import PromptTemplate

sentiment_prompt = PromptTemplate(
    input_variables=["answer", "business_prompt"],
    template="""
    You are analyzing a customer testimonial.

    Business Context:
    {business_prompt}

    User Response:
    {answer}

    Task:
    Classify how the user feels about the PRODUCT/SERVICE.

    Return ONLY one:
    - satisfied
    - neutral
    - dissatisfied

    Also consider:
    - positive experience → satisfied
    - mixed/unclear → neutral
    - complaints → dissatisfied

    Answer:
    """
)
