import os
import google.generativeai as genai
from typing import Dict, Optional
from settings import GOOGLE_API_KEY


def get_system_prompt():
    prompt_dir = os.path.join(os.path.dirname(__file__), "prompts/system_prompt.txt")
    with open(prompt_dir, "r") as file:
        return file.read()

def get_greeting():
    prompt_dir = os.path.join(os.path.dirname(__file__), "prompts/greeting.txt")
    with open(prompt_dir, "r") as file:
        return file.read()

SYSTEM_PROMPT = get_system_prompt()
GREETING = get_greeting()

class GeminiLLM:
    """A class to handle all Gemini AI interactions and session management."""

    def __init__(self):
        """Initialize the Gemini LLM with configuration and model setup."""
        genai.configure(api_key=GOOGLE_API_KEY)

        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash", system_instruction=SYSTEM_PROMPT
        )
        self.sessions: Dict[str, any] = {}

    def create_session(self, call_sid: str) -> None:
        """Create a new chat session for a call."""
        self.sessions[call_sid] = self.model.start_chat(history=[])

    def get_session(self, call_sid: str) -> Optional[any]:
        """Get an existing chat session for a call."""
        return self.sessions.get(call_sid)

    def remove_session(self, call_sid: str) -> None:
        """Remove a chat session for a call."""
        if call_sid in self.sessions:
            self.sessions.pop(call_sid)

    async def get_response(self, call_sid: str, user_prompt: str) -> str:
        """Get a response from Gemini for a given call session and user prompt."""
        chat_session = self.get_session(call_sid)
        if not chat_session:
            raise ValueError(f"No session found for call_sid: {call_sid}")

        response = await chat_session.send_message_async(user_prompt)
        return response.text

    def has_session(self, call_sid: str) -> bool:
        """Check if a session exists for the given call_sid."""
        return call_sid in self.sessions


if __name__ == "__main__":
    # Run the async test
    import asyncio

    async def test_llm():
        """Test function to demonstrate the LLM functionality."""
        try:
            # Initialize the LLM
            llm = GeminiLLM()

            # Create a test session
            test_call_sid = "test_call_123"
            llm.create_session(test_call_sid)

            # Test user prompt
            user_prompt = "Hello! Can you tell me what the weather is like today?"

            print(f"User prompt: {user_prompt}")
            print("-" * 50)

            # Get response
            response = await llm.get_response(test_call_sid, user_prompt)

            print(f"LLM Response: {response}")
            print("-" * 50)

            # Clean up
            llm.remove_session(test_call_sid)

        except Exception as e:
            print(f"Error during test: {e}")

    asyncio.run(test_llm())
