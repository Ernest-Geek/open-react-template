import pandas as pd
import numpy as np
import re
from typing import Dict, List, Tuple, Optional
import openai
from dataclasses import dataclass
from fuzzywuzzy import fuzz
import json
import logging
from datetime import datetime
from config import Config
from MemoryUpdate import ConversationMemory
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DealerInfo:
    seller: str
    region: str
    city: str
    contact: str
    score: float = 0.0

@dataclass
class VehicleInfo:
    manufacturer: str
    model: str
    year: str
    lower_bound: float
    upper_bound: float
    price: float
    mileage: str
    fuel: str
    gearbox: str
    origin: str
    dealer: DealerInfo

class CarAssistant:
    def __init__(self, csv_file_path: str, openai_api_key: str):
        """
        Initialize the Car Assistant with CSV data and OpenAI API key
        
        Args:
            csv_file_path: Path to the CSV file containing car data
            openai_api_key: OpenAI API key for GPT-4o
        """
        self.client = openai.OpenAI(api_key=openai_api_key)
        self.df = self._load_and_preprocess_data(csv_file_path)
        self.manufacturer_index = self._create_manufacturer_index()
        
    def _load_and_preprocess_data(self, csv_file_path: str) -> pd.DataFrame:
        """Load and preprocess the CSV data"""
        try:
            # Read CSV with proper column names based on your data structure
            df = pd.read_csv(csv_file_path)
            
            # Standardize column names if needed
            expected_columns = [
                'zl_manufacturer',  'zl_model', 'price', 'origin', 'year', 'fuel', 
                'region', 'gearbox','lower_bound', 'upper_bound','zl_city', 'updated_contact', 'zl_seller', 'mileage km'
            ]
            
            # Clean and standardize data
            df['zl_manufacturer'] = df['zl_manufacturer'].str.lower().str.strip()
            df['zl_model'] = df['zl_model'].str.lower().str.strip()
            df['zl_city'] = df['zl_city'].str.lower().str.strip()
            df['region'] = df['region'].str.lower().str.strip()
            df['origin'] = df['origin'].str.lower().str.strip()
            df['zl_seller'] = df['zl_seller'].str.title().str.strip()
            
            # Convert price columns to numeric
            price_columns = ['lower_bound', 'upper_bound', 'price']
            for col in price_columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # Fill NaN values
            df = df.fillna('')
            
            logger.info(f"Loaded {len(df)} records from CSV")
            return df
            
        except Exception as e:
            logger.error(f"Error loading CSV: {e}")
            raise

    def _create_manufacturer_index(self) -> Dict[str, List[str]]:
        """Create an index of manufacturers and their models for quick lookup"""
        index = {}
        for _, row in self.df.iterrows():
            manufacturer = row['zl_manufacturer']
            model = row['zl_model']
            
            if manufacturer not in index:
                index[manufacturer] = []
            if model not in index[manufacturer]:
                index[manufacturer].append(model)
        
        return index

    def _extract_query_intent_with_memory(self, user_query: str, conversation_memory: ConversationMemory) -> Dict:
        """Extract intent and entities from user query with conversation context"""
        
        # Enhance query with conversation context
        enhanced_query = conversation_memory.enhance_query_with_context(user_query)
        conversation_context = conversation_memory.get_conversation_context()
        
        system_prompt = """
        You are a query analyzer for a car dealership assistant. Extract the following information from user queries:
        
        1. Intent: "price_inquiry", "dealer_search", "comparison", "general_info"
        2. Manufacturer: Extract car manufacturer/brand
        3. Model: Extract specific car model
        4. Region: Extract region in Ghana preference
        5. City: Extract city preference
        6. Price_range: Extract budget/price range mentioned
        7. Year: Extract year preference if mentioned
        8. Comparison_items: For comparison queries, list the items being compared
        
        IMPORTANT RULES:
        - ALWAYS return ONLY valid JSON, no additional text or explanations
        - Use conversation context to understand follow-up queries and references
        - For comparison queries like "which is cheaper", set intent to "comparison" and extract both items from context
        - If the current query is incomplete or referential, use the context to fill in missing information
        - Use null for missing information, never leave fields undefined
        
        Return ONLY a JSON object with these keys:
        {
            "intent": "string",
            "manufacturer": "string or null",
            "model": "string or null", 
            "region": "string or null",
            "city": "string or null"
            "price_range": "string or null",
            "year": "string or null",
            "comparison_items": ["array of items being compared or null"]
        }
        
        Examples:
        {"intent": "price_inquiry", "manufacturer": "toyota", "model": "camry", "region": null, "city": null, "price_range": null, "year": null, "comparison_items": null}
        {"intent": "comparison", "manufacturer": null, "model": null,  "region": null, "city": null, "price_range": null, "year": null, "comparison_items": ["toyota camry", "honda accord"]}
        """
        
        user_prompt = f"""
        Conversation Context:
        {conversation_context}
        
        Current Query: {enhanced_query}
        
        Return ONLY the JSON object for intent and entities extraction.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.0,
                max_tokens=300
            )
            
            response_content = response.choices[0].message.content.strip()
            logger.info(f"Raw LLM response: {response_content}")
            
            # Try to extract JSON if response contains extra text
            json_content = self._extract_json_from_response(response_content)
            
            result = json.loads(json_content)
            
            # Validate required fields
            required_fields = ["intent", "manufacturer", "model", "region", "city", "price_range", "year"]
            for field in required_fields:
                if field not in result:
                    result[field] = None
                    
            # Add comparison_items field if missing
            if "comparison_items" not in result:
                result["comparison_items"] = None
                
            # If this is a comparison query but no comparison_items found, try to get from memory
            if result["intent"] == "comparison" and not result["comparison_items"]:
                recent_cars = conversation_memory.get_cars_for_comparison()
                if recent_cars:
                    result["comparison_items"] = recent_cars
                
            logger.info(f"Extracted intent with context: {result}")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}. Response was: {response_content}")
            return self._create_fallback_intent(user_query, conversation_memory)
        except Exception as e:
            logger.error(f"Error extracting intent: {e}")
            return self._create_fallback_intent(user_query, conversation_memory)

    def _extract_json_from_response(self, response: str) -> str:
        """Extract JSON object from response that might contain extra text"""
        import re
        
        # Try to find JSON object pattern
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        matches = re.findall(json_pattern, response)
        
        if matches:
            return matches[0]
        
        # If no JSON found, return the original response
        return response

    def _create_fallback_intent(self, user_query: str, conversation_memory: ConversationMemory) -> Dict:
        """Create fallback intent when extraction fails"""
        
        # Simple keyword-based fallback
        query_lower = user_query.lower()
        
        # Check for comparison keywords
        if conversation_memory.detect_comparison_query(user_query):
            # Try to get cars from recent conversation
            recent_cars = conversation_memory.get_cars_for_comparison()
            return {
                "intent": "comparison",
                "manufacturer": None,
                "model": None,
                "region": None,
                "city": None,
                "price_range": None,
                "year": None,
                "comparison_items": recent_cars if recent_cars else None
            }
        
        # Check for price keywords
        price_keywords = ["price", "cost", "how much", "expensive"]
        if any(keyword in query_lower for keyword in price_keywords):
            intent = "price_inquiry"
        else:
            intent = "general_info"
        
        return {
            "intent": intent,
            "manufacturer": None,
            "model": None,
            "region": None,
            "city": None,
            "price_range": None,
            "year": None,
            "comparison_items": None
        }


    def _fuzzy_match_manufacturer(self, query_manufacturer: str) -> str:
        """Find the best matching manufacturer using fuzzy matching"""
        if not query_manufacturer:
            return None
            
        best_match = None
        best_score = 0
        
        for manufacturer in self.manufacturer_index.keys():
            score = fuzz.ratio(query_manufacturer.lower(), manufacturer.lower())
            if score > best_score and score > 70:  # Minimum threshold
                best_score = score
                best_match = manufacturer
        
        return best_match

    def _fuzzy_match_model(self, query_model: str, manufacturer: str) -> str:
        """Find the best matching model for a given manufacturer"""
        if not query_model or not manufacturer:
            return None
            
        if manufacturer not in self.manufacturer_index:
            return None
            
        best_match = None
        best_score = 0
        
        for model in self.manufacturer_index[manufacturer]:
            score = fuzz.ratio(query_model.lower(), model.lower())
            if score > best_score and score > 60:  # Lower threshold for models
                best_score = score
                best_match = model
        
        return best_match

    def _parse_price_range(self, price_text: str) -> Tuple[Optional[float], Optional[float]]:
        """Parse price range from text"""
        if not price_text:
            return None, None
            
        # Extract numbers from text
        numbers = re.findall(r'\d+(?:,\d+)*', price_text.replace(',', ''))
        
        if not numbers:
            return None, None
            
        # Convert to float
        prices = [float(num) for num in numbers]
        
        if "under" in price_text.lower() or "below" in price_text.lower():
            return None, max(prices)
        elif "over" in price_text.lower() or "above" in price_text.lower():
            return min(prices), None
        elif "between" in price_text.lower() and len(prices) >= 2:
            return min(prices), max(prices)
        else:
            # Single price mentioned, assume it's upper bound
            return None, max(prices)

    def _filter_data(self, intent_data: Dict) -> pd.DataFrame:
        """Filter the dataset based on extracted intent and entities"""
        filtered_df = self.df.copy()
        
        # Filter by manufacturer
        if intent_data.get('manufacturer'):
            matched_manufacturer = self._fuzzy_match_manufacturer(intent_data['manufacturer'])
            if matched_manufacturer:
                filtered_df = filtered_df[filtered_df['zl_manufacturer'] == matched_manufacturer]
                logger.info(f"Filtered by manufacturer: {matched_manufacturer}, {len(filtered_df)} records")
        
        # Filter by model
        if intent_data.get('model') and intent_data.get('manufacturer'):
            matched_manufacturer = self._fuzzy_match_manufacturer(intent_data['manufacturer'])
            matched_model = self._fuzzy_match_model(intent_data['model'], matched_manufacturer)
            if matched_model:
                filtered_df = filtered_df[filtered_df['zl_model'] == matched_model]
                logger.info(f"Filtered by model: {matched_model}, {len(filtered_df)} records")
        
        # # Filter by location
        # if intent_data.get('region'):
        #     location_lower = intent_data['region'].lower()
        #     filtered_df = filtered_df[filtered_df['zl_city'].str.contains(location_lower, na=False)]
        #     logger.info(f"Filtered by location: {intent_data['location']}, {len(filtered_df)} records")
        
          # Filter by location
        if intent_data.get('year'):
            location_lower = intent_data['year'].lower()
            filtered_df = filtered_df[filtered_df['year'].str.contains(location_lower, na=False)]
            logger.info(f"Filtered by year: {intent_data['year']}, {len(filtered_df)} records")
        
        
        # Filter by price range
        if intent_data.get('price_range'):
            min_price, max_price = self._parse_price_range(intent_data['price_range'])
            if min_price:
                filtered_df = filtered_df[filtered_df['lower_bound'] >= min_price]
            if max_price:
                filtered_df = filtered_df[filtered_df['upper_bound'] <= max_price]
            logger.info(f"Filtered by price range: {min_price}-{max_price}, {len(filtered_df)} records")
        
        return filtered_df

    def _rank_dealers(self, filtered_df: pd.DataFrame, intent_data: Dict) -> List[VehicleInfo]:
        """Rank dealers based on multiple criteria"""
        if len(filtered_df) == 0:
            return []
        
        scored_vehicles = []
        
        for _, row in filtered_df.iterrows():
            # Calculate dealer score based on multiple factors
            score = 0
            
            # Price competitiveness (30% weight)
            avg_price = (row['lower_bound'] + row['upper_bound']) / 2
            price_score = 1 / (1 + avg_price / 100000)  # Normalize price score
            score += price_score * 0.3
            
            # Location proximity (25% weight) - simplified
            location_score = 0.5  # Default score
            if intent_data.get('location'):
                if intent_data['location'].lower() in row['zl_city'].lower():
                    location_score = 1.0
            score += location_score * 0.25
            
            # Contact information completeness (20% weight)
            contact_score = 0.5
            if row['updated_contact'] and len(str(row['updated_contact'])) > 10:
                contact_score = 1.0
            score += contact_score * 0.2
            
            # Dealer name completeness (15% weight)
            name_score = 0.5
            if row['zl_seller'] and len(str(row['zl_seller'])) > 3:
                name_score = 1.0
            score += name_score * 0.15
            
            # Recent updates (10% weight) - simplified
            update_score = 0.7  # Default assuming reasonably recent
            score += update_score * 0.1
            
            # Create dealer info
            dealer = DealerInfo(
                city=str(row['zl_city']),
                region=str(row['region']),
                contact=str(row['updated_contact']),
                seller=str(row['zl_seller']),
                score=score
            )
            
            # Create vehicle info
            vehicle = VehicleInfo(
                manufacturer=str(row['zl_manufacturer']),
                model=str(row['zl_model']),
                year=str(row.get('year', 'N/A')),
                fuel= str(row.get('fuel', 'N/A')),
                gearbox=str(row.get('gearbox', 'N/A')),
                origin= str(row.get('origin', 'N/A')),
                lower_bound=row['lower_bound'],
                upper_bound=row['upper_bound'],
                price=row['price'],
                mileage=str(row['mileage km']),
                dealer=dealer
            )
            
            scored_vehicles.append(vehicle)
        
        # Sort by score (descending) and return top 5
        scored_vehicles.sort(key=lambda x: x.dealer.score, reverse=True)
        return scored_vehicles[:5]

    def _generate_response_with_memory(self, user_query: str, intent_data: Dict, top_vehicles: List, conversation_memory: ConversationMemory) -> str:
        """Generate natural language response using GPT-4o with conversation memory"""
        
        # Prepare context data for GPT
        context_data = {
            "user_query": user_query,
            "intent": intent_data,
            "vehicles_found": len(top_vehicles),
            "top_vehicles": []
        }
        
        for vehicle in top_vehicles:
            context_data["top_vehicles"].append({
                "manufacturer": vehicle.manufacturer,
                "model": vehicle.model,
                "price_range": f"{vehicle.lower_bound:,.0f} - {vehicle.upper_bound:,.0f} GHS",
                "fuel": vehicle.fuel if hasattr(vehicle, 'fuel') else 'N/A',
                "gearbox": vehicle.gearbox if hasattr(vehicle, 'gearbox') else 'N/A',
                "dealer_city": vehicle.dealer.city,
                "dealer_region": vehicle.dealer.region if hasattr(vehicle.dealer, 'region') else 'N/A',
                "dealer_contact": vehicle.dealer.contact,
                "dealer_seller": vehicle.dealer.seller,
                "mileage": vehicle.mileage
            })
        
        # Get conversation context
        conversation_context = conversation_memory.get_conversation_context()
        
        system_prompt = """
        You are a helpful car dealership assistant in Ghana. Based on the provided data and conversation history, generate a natural, informative response to the user's query about car prices and dealers.

        Guidelines:
        1. Consider the conversation history to understand context and follow-up questions
        2. Start with a direct answer to their question
        3. Provide price ranges in Ghana Cedis (GHS)
        4. List the top dealers with their contact information
        5. Include relevant details like location, mileage, fuel type, gearbox if available
        6. Be conversational and helpful
        7. If this is a follow-up question, reference previous queries appropriately
        8. If no results found, suggest alternatives or broader searches
        9. Format prices with commas for readability
        10. Keep the response comprehensive but not overly long

        Always end with an offer to help with more specific questions.
        """
        
        user_prompt = f"""
        {conversation_context}
        
        Current User Query: {user_query}
        
        Context Data: {json.dumps(context_data, indent=2)}
        
        Generate a helpful response based on this information and conversation history.
        """
    
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.0,
                max_tokens=512
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again later."


    def process_query_with_memory(self, user_query: str, conversation_memory: ConversationMemory = None) -> str:
        """
        Main method to process user queries with conversation memory
        
        Args:
            user_query: User's question about cars and dealers
            conversation_memory: ConversationMemory instance (optional)
            
        Returns:
            Natural language response with car prices and dealer information
        """
        # Create conversation memory if not provided
        if conversation_memory is None:
            conversation_memory = ConversationMemory()
        
        try:
            # Step 1: Extract intent and entities with conversation context
            intent_data = self._extract_query_intent_with_memory(user_query, conversation_memory)
            
            # Step 2: Filter data based on intent
            filtered_df = self._filter_data(intent_data)
            
            # Step 3: Rank dealers and get top 5
            top_vehicles = self._rank_dealers(filtered_df, intent_data)
            
            # Step 4: Generate natural language response with memory
            response = self._generate_response_with_memory(user_query, intent_data, top_vehicles, conversation_memory)
            
            # Step 5: Add this exchange to conversation memory
            conversation_memory.add_exchange(user_query, response, intent_data, len(top_vehicles))
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return "I apologize, but I encountered an error while processing your request. Please try rephrasing your question."

    def _handle_comparison_query(self, intent_data: Dict, conversation_memory: ConversationMemory, user_query: str) -> str:
        """Handle comparison queries by getting data for both items and comparing"""
        
        comparison_items = intent_data.get('comparison_items', [])
        
        if not comparison_items or len(comparison_items) < 2:
            # Try to get from conversation memory
            recent_cars = conversation_memory.get_cars_for_comparison()
            if len(recent_cars) >= 2:
                comparison_items = recent_cars
            else:
                return "I need information about at least two cars to make a comparison. Could you please specify which cars you'd like to compare?"
        
        # Get data for each item in comparison
        comparison_results = []
        
        for item in comparison_items[:2]:  # Limit to 2 items for now
            # Parse the item (e.g., "Toyota Camry" -> manufacturer: toyota, model: camry)
            item_parts = item.lower().split()
            if len(item_parts) >= 2:
                temp_intent = {
                    "intent": "price_inquiry",
                    "manufacturer": item_parts[0],
                    "model": item_parts[1],
                    "region": intent_data.get('region'),
                    "city": intent_data.get('city'),
                    "price_range": None,
                    "year": intent_data.get('year')
                }
            else:
                temp_intent = {
                    "intent": "price_inquiry", 
                    "manufacturer": item_parts[0] if item_parts else None,
                    "model": None,
                    "region": intent_data.get('region'),
                    "city": intent_data.get('city'),
                    "price_range": None,
                    "year": intent_data.get('year')
                }
            
            # Filter and rank for this specific car
            filtered_df = self._filter_data(temp_intent)
            top_vehicles = self._rank_dealers(filtered_df, temp_intent)
            
            if not top_vehicles.empty:
                comparison_results.append({
                    'item': item,
                    'data': top_vehicles.iloc[0] if len(top_vehicles) > 0 else None,
                    'intent': temp_intent
                })
        
        # Generate comparison response
        response = self._generate_comparison_response(comparison_results, user_query)
        
        # Add this exchange to conversation memory
        conversation_memory.add_exchange(user_query, response, intent_data, len(comparison_results))
        
        return response

    def _generate_comparison_response(self, comparison_results: List[Dict], original_query: str) -> str:
        """Generate a natural language comparison response"""
        
        if len(comparison_results) < 2:
            return "I couldn't find sufficient data to compare these vehicles."
        
        # Extract price information for comparison
        prices = []
        for result in comparison_results:
            if result['data'] is not None:
                # Adjust these column names based on your DataFrame structure
                price = result['data'].get('price', 0)  # Replace 'price' with your actual column name
                prices.append({
                    'item': result['item'],
                    'price': price,
                    'data': result['data']
                })
        
        if len(prices) < 2:
            return "I couldn't find price information for both vehicles to make a comparison."
        
        # Sort by price to determine which is cheaper
        prices.sort(key=lambda x: x['price'])
        
        cheaper_car = prices[0]
        expensive_car = prices[1]
        
        price_difference = expensive_car['price'] - cheaper_car['price']
        
        # Check what the user is asking for
        query_lower = original_query.lower()
        if "cheaper" in query_lower or "less expensive" in query_lower:
            response = f"The **{cheaper_car['item']}** is cheaper at ${cheaper_car['price']:,.2f}, which is ${price_difference:,.2f} less than the {expensive_car['item']} at ${expensive_car['price']:,.2f}."
        else:
            response = f"""**Comparison Results:**

        • **{cheaper_car['item']}**: ${cheaper_car['price']:,.2f}
        • **{expensive_car['item']}**: ${expensive_car['price']:,.2f}

        The {cheaper_car['item']} is ${price_difference:,.2f} less expensive than the {expensive_car['item']}.
        """
        
        return response