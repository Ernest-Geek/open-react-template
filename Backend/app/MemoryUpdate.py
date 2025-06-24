from typing import Dict, List, Tuple, Optional
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ConversationMemory:
    """Manages conversation history and context for the car assistant"""
    
    def __init__(self, max_history: int = 10):
        self.max_history = max_history
        self.conversation_history = []
        self.last_search_context = {}
    
    def add_exchange(self, user_query: str, assistant_response: str, intent_data: Dict, vehicles_found: int):
        """Add a user-assistant exchange to memory"""
        exchange = {
            "user_query": user_query,
            "assistant_response": assistant_response,
            "intent": intent_data,
            "vehicles_found": vehicles_found,
            "timestamp": datetime.now().isoformat()
        }
        
        self.conversation_history.append(exchange)
        
        # Keep only recent exchanges
        if len(self.conversation_history) > self.max_history:
            self.conversation_history = self.conversation_history[-self.max_history:]
        
        # Update last search context for follow-up queries
        if intent_data and vehicles_found > 0:
            self.last_search_context = {
                "manufacturer": intent_data.get('manufacturer'),
                "model": intent_data.get('model'),
                "location": intent_data.get('location'),
                "price_range": intent_data.get('price_range'),
                "intent": intent_data.get('intent')
            }
    
    def get_conversation_context(self) -> str:
        """Get formatted conversation history for GPT context"""
        if not self.conversation_history:
            return ""
        
        context = "Previous conversation:\n"
        for i, exchange in enumerate(self.conversation_history[-5:], 1):  # Last 5 exchanges
            context += f"\nUser: {exchange['user_query']}\n"
            context += f"Assistant: {exchange['assistant_response'][:200]}...\n"  # Truncate long responses
        
        return context
    
    def get_recent_interactions(self, limit: int = 10) -> List[Dict]:
        """
        Get recent interactions for comparison analysis
        Returns list of exchanges with their intent data
        """
        if not self.conversation_history:
            return []
        
        # Return the most recent interactions up to the limit
        recent = self.conversation_history[-limit:] if len(self.conversation_history) >= limit else self.conversation_history
        
        # Format for easier processing
        formatted_interactions = []
        for exchange in recent:
            formatted_interaction = {
                "query": exchange["user_query"],
                "response": exchange["assistant_response"],
                "intent": exchange["intent"].get("intent") if exchange["intent"] else None,
                "entities": {
                    "manufacturer": exchange["intent"].get("manufacturer") if exchange["intent"] else None,
                    "model": exchange["intent"].get("model") if exchange["intent"] else None,
                    "location": exchange["intent"].get("location") if exchange["intent"] else None,
                    "price_range": exchange["intent"].get("price_range") if exchange["intent"] else None,
                    "year": exchange["intent"].get("year") if exchange["intent"] else None
                },
                "vehicles_found": exchange["vehicles_found"],
                "timestamp": exchange["timestamp"]
            }
            formatted_interactions.append(formatted_interaction)
        
        return formatted_interactions
    
    def get_recently_mentioned_cars(self, limit: int = 5) -> List[str]:
        """
        Extract recently mentioned car models from conversation history
        Returns list of car descriptions (e.g., ['Toyota Camry', 'Honda Accord'])
        """
        mentioned_cars = []
        
        for exchange in reversed(self.conversation_history[-limit:]):
            if exchange.get("intent"):
                intent_data = exchange["intent"]
                manufacturer = intent_data.get("manufacturer")
                model = intent_data.get("model")
                
                if manufacturer and model:
                    car_name = f"{manufacturer.title()} {model.title()}"
                    if car_name not in mentioned_cars:
                        mentioned_cars.append(car_name)
                elif manufacturer:
                    car_name = manufacturer.title()
                    if car_name not in mentioned_cars:
                        mentioned_cars.append(car_name)
        
        return mentioned_cars
    
    def get_cars_for_comparison(self) -> List[str]:
        """
        Get the most recent 2 cars mentioned for comparison purposes
        Prioritizes cars with both manufacturer and model
        """
        cars = self.get_recently_mentioned_cars(limit=10)
        
        # Return the last 2 unique cars mentioned
        return cars[:2] if len(cars) >= 2 else cars
    
    def detect_follow_up_query(self, current_query: str) -> bool:
        """Detect if current query is a follow-up to previous conversation"""
        if not self.conversation_history:
            return False
        
        follow_up_indicators = [
            "what about", "how about", "and", "also", "too", "as well",
            "which one", "which is", "compare", "cheaper", "better",
            "that one", "this one", "those", "these", "them",
            "similar", "alternative", "instead", "other"
        ]
        
        current_query_lower = current_query.lower()
        return any(indicator in current_query_lower for indicator in follow_up_indicators)
    
    def detect_comparison_query(self, current_query: str) -> bool:
        """Detect if current query is asking for a comparison"""
        comparison_indicators = [
            "which is cheaper", "which is better", "which one is", "compare",
            "vs", "versus", "difference between", "cheaper", "more expensive",
            "better", "worse", "which should i", "which would you"
        ]
        
        current_query_lower = current_query.lower()
        return any(indicator in current_query_lower for indicator in comparison_indicators)
    
    def enhance_query_with_context(self, current_query: str) -> str:
        """Enhance current query with context from conversation history"""
        if not self.detect_follow_up_query(current_query) or not self.last_search_context:
            return current_query
        
        # Build context from last search
        context_parts = []
        if self.last_search_context.get('manufacturer'):
            context_parts.append(f"Previously searched manufacturer: {self.last_search_context['manufacturer']}")
        if self.last_search_context.get('model'):
            context_parts.append(f"Previously searched model: {self.last_search_context['model']}")
        if self.last_search_context.get('location'):
            context_parts.append(f"Previously searched location: {self.last_search_context['location']}")
        if self.last_search_context.get('price_range'):
            context_parts.append(f"Previously searched price range: {self.last_search_context['price_range']}")
        
        if context_parts:
            enhanced_query = f"Context: {'; '.join(context_parts)}. Current query: {current_query}"
            logger.info(f"Enhanced query with context: {enhanced_query}")
            return enhanced_query
        
        return current_query
    
    def get_last_search_results(self) -> Dict:
        """Get the last search context for reference"""
        return self.last_search_context.copy()
    
    def has_recent_car_searches(self) -> bool:
        """Check if there are recent car searches that can be compared"""
        recent_cars = self.get_recently_mentioned_cars(limit=5)
        return len(recent_cars) >= 2
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        self.last_search_context = {}
    
    def get_conversation_summary(self) -> str:
        """Get a summary of the conversation for debugging or logging"""
        if not self.conversation_history:
            return "No conversation history"
        
        summary = f"Conversation History ({len(self.conversation_history)} exchanges):\n"
        for i, exchange in enumerate(self.conversation_history, 1):
            intent = exchange.get("intent", {})
            manufacturer = intent.get("manufacturer", "Unknown")
            model = intent.get("model", "Unknown")
            intent_type = intent.get("intent", "Unknown")
            
            summary += f"{i}. Query: '{exchange['user_query'][:50]}...' "
            summary += f"| Intent: {intent_type} | Car: {manufacturer} {model} "
            summary += f"| Found: {exchange['vehicles_found']} vehicles\n"
        
        return summary