import os
import google.generativeai as genai
from typing import Dict, Optional
from settings import GOOGLE_API_KEY
import logging

logger = logging.getLogger(__name__)


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
        self.sessions: Dict[str, any] = {}

    def create_session(self, call_sid: str) -> None:
        """Create a new chat session for a call."""
        self.sessions[call_sid] = []  # Store conversation history

    def send_message(self, call_sid: str, message: str) -> str:
        """Send a message to the AI and get a response."""
        if call_sid not in self.sessions:
            self.create_session(call_sid)

        # Add user message to history
        self.sessions[call_sid].append(f"User: {message}")
        
        # Create context from history
        context = "\n".join(self.sessions[call_sid][-10:])  # Last 10 messages
        prompt = f"{SYSTEM_PROMPT}\n\nConversation:\n{context}\n\nAI:"

        try:
            response = genai.generate_text(
                model="models/text-bison-001",
                prompt=prompt,
                temperature=0.7,
                max_output_tokens=200
            )
            
            ai_response = response.result if response.result else "I apologize, I didn't understand that."
            
            # Add AI response to history
            self.sessions[call_sid].append(f"AI: {ai_response}")
            
            return ai_response
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I'm having trouble right now. Can you please repeat that?"

    def end_session(self, call_sid: str) -> None:
        """End a chat session and clean up."""
        if call_sid in self.sessions:
            del self.sessions[call_sid]


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
            response = llm.send_message(test_call_sid, user_prompt)

            print(f"LLM Response: {response}")
            print("-" * 50)

            # Clean up
            llm.end_session(test_call_sid)

        except Exception as e:
            print(f"Error during test: {e}")

    asyncio.run(test_llm())
