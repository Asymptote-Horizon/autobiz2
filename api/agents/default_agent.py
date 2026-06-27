def process_message(message: str) -> str:
    """
    Default fallback agent that reverses the message string.
    """
    print("default_agent")
    return message[::-1]
