"""
Validation Service
Checks incoming user answers before handing off to the LLM pipeline.
"""

# Minimum number of meaningful words required to accept an answer.
MIN_WORD_COUNT = 3

# Phrases that indicate silence or a speech-recognition non-answer.
NOISE_PATTERNS = {
    "", "uh", "um", "uh huh", "hmm", "hm", "ah", "er",
    "you", "yeah", "yes", "no", "okay", "ok", "sure",
}

RETRY_MESSAGES = [
    "That was a bit short! Could you tell me a little more about that?",
    "I'd love to hear more details — could you expand on that?",
    "Feel free to elaborate! The more you share, the better your testimonial will be.",
]

_retry_index = 0  # simple round-robin to vary retry messages


def validate_answer(answer: str) -> dict:
    """
    Inspect the transcribed answer for quality.

    Returns:
        {"valid": True}                         — answer is acceptable
        {"valid": False, "message": str}        — answer needs elaboration
    """
    global _retry_index

    stripped = answer.strip().lower()

    # Check for silence / pure noise
    if stripped in NOISE_PATTERNS:
        msg = RETRY_MESSAGES[_retry_index % len(RETRY_MESSAGES)]
        _retry_index += 1
        return {"valid": False, "message": msg}

    # Count meaningful words (ignore punctuation artefacts)
    words = [w for w in stripped.split() if w.isalpha() or w.replace("'", "").isalpha()]
    if len(words) < MIN_WORD_COUNT:
        msg = RETRY_MESSAGES[_retry_index % len(RETRY_MESSAGES)]
        _retry_index += 1
        return {"valid": False, "message": msg}

    return {"valid": True}
