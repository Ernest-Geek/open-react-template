from .Agent import CarAssistant
from MemoryUpdate import ConversationMemory
from .config import Config
from typing import Dict, List, Tuple, Optional
import json
import logging
import re
# Setup logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format=Config.LOG_FORMAT
)

class CarAssistantServiceWithMemory:
    """Wrapper service with conversation memory for Gradio integration"""
    
    def __init__(self):
        self.assistant = None
        self.conversation_memory = ConversationMemory()
        self._initialize_assistant()
    
    def _initialize_assistant(self):
        """Initialize the car assistant with configuration"""
        try:
            # Add these methods to your CarAssistant class
            self.assistant=CarAssistant(
                csv_file_path=Config.CSV_FILE_PATH,
                openai_api_key=Config.OPENAI_API_KEY
            )
            
            
            logging.info("Car Assistant with memory initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize Car Assistant: {e}")
            raise
    
    def get_response(self, message: str, history: List = None) -> str:
        """
        Get response for user query with conversation memory
        
        Args:
            message: Current user message
            history: Gradio chat history (can be used for additional context)
            
        Returns:
            AI assistant response
        """
        if not self.assistant:
            return "Assistant is not properly initialized. Please check your configuration."
        
        
        # Instead of substring matching, use word boundary matching
        greeting_pattern = r'\b(?:hi|hello|hey|greetings)\b'
        if re.search(greeting_pattern, message.lower(), re.IGNORECASE):
            return "Hi there! How can I assist you with your car-related questions?"
        try:
            return self.assistant.process_query_with_memory(message, self.conversation_memory)
        except Exception as e:
            logging.error(f"Error processing query: {e}")
            return "I'm sorry, I encountered an error processing your request. Please try again."
    
    def clear_conversation(self):
        """Clear conversation memory"""
        self.conversation_memory.clear_history()
        return "Conversation history cleared!"
