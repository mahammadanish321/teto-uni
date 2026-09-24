from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.database import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for frontend requests
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    )

    # Initialize extensions
    db.init_app(app)

    # Register blueprints
    from app.routes import main
    from app.routes.auth_routes import auth_bp
    from app.routes.user_routes import user_bp
    from app.routes.task_routes import task_bp

    app.register_blueprint(main)
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(task_bp, url_prefix='/api/tasks')

    return app
