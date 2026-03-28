from dotenv import load_dotenv
import os
import sys

# Path healing: Allow running from within 'backend/' or project root
PARENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

load_dotenv()

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from backend.extensions import db
import os


def create_app():
    app = Flask(__name__)

    # Configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///scheme_guard_v2.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "scheme-guard-super-secret-2024")
    from datetime import timedelta
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
    app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads")

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Extensions
    db.init_app(app)
    JWTManager(app)
    
    # Allow all origins for production flexibility (JWT handles security)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Blueprints
    from backend.routes.auth import auth_bp
    from backend.routes.documents import documents_bp
    from backend.routes.schemes import schemes_bp
    from backend.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(documents_bp, url_prefix="/api")
    app.register_blueprint(schemes_bp, url_prefix="/api/schemes")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    with app.app_context():
        db.create_all()
        _seed_default_data()

    return app


def _seed_default_data():
    from backend.models import Scheme, User
    from werkzeug.security import generate_password_hash

    # Seed admin user
    from backend.models import User
    admin = User.query.filter_by(username="admin", role="admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@schemeguard.gov.in",
            password_hash=generate_password_hash("admin123"),
            role="admin",
            full_name="System Administrator"
        )
        db.session.add(admin)

    # Seed default schemes
    if Scheme.query.count() == 0:
        schemes = [
            Scheme(
                name="PM Scholarship Scheme",
                description="Central scholarship for meritorious students from economically weaker sections.",
                income_limit=450000,
                category="Education",
                required_docs="Income Certificate, Identity Proof, Marksheet",
                is_active=True
            ),
            Scheme(
                name="PM Awas Yojana",
                description="Housing scheme for rural and urban poor families.",
                income_limit=300000,
                category="Housing",
                required_docs="Income Certificate, Aadhaar Card, Land Documents",
                is_active=True
            ),
            Scheme(
                name="Ayushman Bharat",
                description="Health insurance scheme providing coverage up to ₹5 lakh per family.",
                income_limit=250000,
                category="Health",
                required_docs="Income Certificate, Aadhaar Card, Ration Card",
                is_active=True
            ),
            Scheme(
                name="PM Kisan Samman Nidhi",
                description="Direct income support of ₹6000/year to farmer families.",
                income_limit=200000,
                category="Agriculture",
                required_docs="Kisan Credit Card, Land Records, Aadhaar Card",
                is_active=True
            ),
        ]
        for s in schemes:
            db.session.add(s)

    db.session.commit()


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000, host='0.0.0.0', use_reloader=False)
