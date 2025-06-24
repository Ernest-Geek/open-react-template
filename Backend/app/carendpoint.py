from flask import Flask, request, jsonify
from flask_cors import CORS
from AgentService import CarAssistantServiceWithMemory

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Initialize the car service
car_service = CarAssistantServiceWithMemory()

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Handle chat messages from the user
    Expected JSON payload: {"message": "user input"}
    Returns: {"response": "assistant response"}
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Missing 'message' in request body"}), 400
        
        user_input = data['message']
        
        if not user_input.strip():
            return jsonify({"error": "Message cannot be empty"}), 400
        
        # Get response from car service
        response = car_service.get_response(user_input)
        
        return jsonify({"response": response})
    
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/clear', methods=['POST'])
def clear_conversation():
    """
    Clear the conversation history
    Returns: {"message": "Conversation cleared", "conversation": []}
    """
    try:
        car_service.clear_conversation()
        return jsonify({
            "message": "Conversation cleared successfully",
            "conversation": []
        })
    
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    Returns: {"status": "healthy"}
    """
    return jsonify({"status": "healthy"})

@app.route('/api/conversation', methods=['GET'])
def get_conversation():
    """
    Get current conversation history (if available)
    Returns: {"conversation": [...]}
    """
    try:
        # Check if the service has a method to get conversation history
        if hasattr(car_service, 'get_conversation_history'):
            conversation = car_service.get_conversation_history()
            return jsonify({"conversation": conversation})
        else:
            return jsonify({"message": "Conversation history not available"})
    
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)