from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
import json
from models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name")

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists."}), 400

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        full_name=full_name,
        role="user"
    )
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=json.dumps({"id": user.id, "role": user.role}))
    return jsonify({"message": "User registered successfully", "access_token": access_token}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username, role="user").first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid username or password."}), 401

    access_token = create_access_token(identity=json.dumps({"id": user.id, "role": user.role}))
    return jsonify({"access_token": access_token, "user": user.to_dict()}), 200


@auth_bp.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username, role="admin").first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid admin credentials."}), 401

    access_token = create_access_token(identity=json.dumps({"id": user.id, "role": user.role}))
    return jsonify({"access_token": access_token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity_raw = get_jwt_identity()
    try:
        identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
    except json.JSONDecodeError:
        # Handle cases where identity_raw might not be valid JSON,
        # though create_access_token should ensure it's a string if json.dumps is used.
        # Fallback to raw identity if it's not a string or not decodable.
        identity = identity_raw
    
    user = User.query.get(identity["id"])
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify(user.to_dict()), 200
