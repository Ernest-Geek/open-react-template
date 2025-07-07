# app/auth/routes.py

from flask import request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from .. import db, bcrypt, login_manager
from ..models import User
from . import  auth

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@auth.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Required fields validation
    required_fields = ['name', 'company_name', 'email', 'password']
    if not data or any(field not in data for field in required_fields):
        return jsonify({'error': f'Missing one of the required fields: {required_fields}'}), 400

    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    # Hash password
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    # Create new user instance
    new_user = User(
        name=data['name'],
        company_name=data['company_name'],
        email=data['email'],
        password=hashed_pw
    )

    # Add and commit to DB
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201



@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()

    if user and bcrypt.check_password_hash(user.password, data['password']):
        login_user(user)
        return jsonify({'message': 'Login successful'}), 200

    return jsonify({'error': 'Invalid credentials'}), 401


@auth.route('/logout', methods=['POST'])
# @login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out'}), 200

@auth.route('/me')
# @login_required
def profile():
    return jsonify({'username': current_user.username})
