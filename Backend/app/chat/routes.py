from flask import request, jsonify
from flask_login import login_required
from . import chat
from ..AgentService import CarAssistantServiceWithMemory

car_service = CarAssistantServiceWithMemory()

@chat.route('/api/chat', methods=['POST'])
@login_required
def chat_with_bot():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "Missing 'message' in request body"}), 400

        user_input = data['message']
        if not user_input.strip():
            return jsonify({"error": "Message cannot be empty"}), 400

        response = car_service.get_response(user_input)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@chat.route('/api/clear', methods=['POST'])
@login_required
def clear_conversation():
    try:
        car_service.clear_conversation()
        return jsonify({
            "message": "Conversation cleared successfully",
            "conversation": []
        })
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@chat.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})


@chat.route('/api/conversation', methods=['GET'])
@login_required
def get_conversation():
    try:
        if hasattr(car_service, 'get_conversation_history'):
            conversation = car_service.get_conversation_history()
            return jsonify({"conversation": conversation})
        else:
            return jsonify({"message": "Conversation history not available"})
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
