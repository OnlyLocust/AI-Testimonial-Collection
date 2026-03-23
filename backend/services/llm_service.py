def generate_first_question(business_prompt):
    # Replace with your first_question_chain
    return f"What made you try this {business_prompt.split()[-1]}?"

def generate_followup_question(business_prompt, history, last_answer):
    # Replace with your followup_chain
    return "What did you like most about it?"