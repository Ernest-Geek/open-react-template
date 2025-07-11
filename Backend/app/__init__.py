# app/__init__.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from .config import Config
from flask_cors import CORS
from flask_migrate import Migrate
from .chat import chat as chat_blueprint
from .charts import charts_bp
from .forecast import forecast_bp
from .images import images_bp

db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'  # redirect to login if not authenticated
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Blueprint registration
    app.register_blueprint(charts_bp, url_prefix='/charts')
    app.register_blueprint(forecast_bp, url_prefix='/forecast')
    app.register_blueprint(images_bp, url_prefix='/images')
    app.register_blueprint(chat_blueprint)

    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db) 

    CORS(app, supports_credentials=True)

    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/auth')

    return app
