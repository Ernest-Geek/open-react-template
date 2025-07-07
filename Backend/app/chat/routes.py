from flask import request, jsonify
from flask_login import login_required, current_user
from . import chat
from ..AgentService import CarAssistantServiceWithMemory
from ..models import Chat, Message, db

car_service = CarAssistantServiceWithMemory()

# Add a new chat
@chat.route('/api/chat', methods=['POST'])
@login_required
def add_chat():
    try:
        data = request.get_json()
        title = data.get('title')

        if not title:
            return jsonify({"error": "Title is required"}), 400

        # Create a new chat object
        new_chat = Chat(title=title, user_id=current_user.id)

        db.session.add(new_chat)
        db.session.commit()

        return jsonify({"id": new_chat.id, "title": new_chat.title}), 201
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Rename an existing chat
@chat.route('/api/chat/<chat_id>', methods=['PUT'])
@login_required
def rename_chat(chat_id):
    try:
        data = request.get_json()
        new_title = data.get('title')

        if not new_title:
            return jsonify({"error": "New title is required"}), 400

        # Find the chat by ID and ensure it belongs to the current user
        chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first()

        if not chat:
            return jsonify({"error": "Chat not found"}), 404

        # Update the title
        chat.title = new_title
        db.session.commit()

        return jsonify({"id": chat.id, "title": chat.title})
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Delete a chat
@chat.route('/api/chat/<chat_id>', methods=['DELETE'])
@login_required
def delete_chat(chat_id):
    try:
        # Find the chat by ID and ensure it belongs to the current user
        chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first()

        if not chat:
            return jsonify({"error": "Chat not found"}), 404

        # Delete the chat
        db.session.delete(chat)
        db.session.commit()

        return jsonify({"message": "Chat deleted successfully"})
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Clear conversation
@chat.route('/api/clear', methods=['POST'])
# @login_required
def clear_conversation():
    try:
        car_service.clear_conversation()
        return jsonify({
            "message": "Conversation cleared successfully",
            "conversation": []
        })
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Health check route
@chat.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

# Get conversation history
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
