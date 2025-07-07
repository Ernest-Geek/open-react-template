# app/models.py

from flask_sqlalchemy import SQLAlchemy

# Initialize db here, not import it from __init__.py
db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    company_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class Chat(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    messages = db.relationship("Message", backref="chat", lazy=True)

class Message(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    text = db.Column(db.String(500), nullable=False)
    sender = db.Column(db.String(10), nullable=False)
    chat_id = db.Column(db.String(36), db.ForeignKey('chat.id'), nullable=False)




