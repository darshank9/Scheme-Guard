from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
import json
from models import Scheme

schemes_bp = Blueprint("schemes", __name__)


def decode_identity(identity):
    if isinstance(identity, str):
        try:
            return json.loads(identity)
        except (json.JSONDecodeError, ValueError):
            return identity
    return identity


@schemes_bp.route("/", methods=["GET"])
def get_schemes():
    schemes = Scheme.query.filter_by(is_active=True).order_by(Scheme.created_at.desc()).all()
    return jsonify([s.to_dict() for s in schemes]), 200


@schemes_bp.route("/all", methods=["GET"])
@jwt_required()
def get_all_schemes():
    identity = decode_identity(get_jwt_identity())
    if not isinstance(identity, dict) or identity.get("role") != "admin":
        return jsonify({"error": "Admin access required."}), 403
    schemes = Scheme.query.order_by(Scheme.created_at.desc()).all()
    return jsonify([s.to_dict() for s in schemes]), 200


@schemes_bp.route("/", methods=["POST"])
@jwt_required()
def create_scheme():
    identity = decode_identity(get_jwt_identity())
    if not isinstance(identity, dict) or identity.get("role") != "admin":
        return jsonify({"error": "Admin access required."}), 403

    data = request.get_json()
    scheme = Scheme(
        name=data.get("name", "").strip(),
        description=data.get("description", ""),
        income_limit=int(data.get("income_limit", 450000)),
        category=data.get("category", "General"),
        required_docs=data.get("required_docs", ""),
        is_active=data.get("is_active", True)
    )
    if not scheme.name:
        return jsonify({"error": "Scheme name is required."}), 400

    db.session.add(scheme)
    db.session.commit()
    return jsonify(scheme.to_dict()), 201


@schemes_bp.route("/<int:scheme_id>", methods=["PUT"])
@jwt_required()
def update_scheme(scheme_id):
    identity = decode_identity(get_jwt_identity())
    if not isinstance(identity, dict) or identity.get("role") != "admin":
        return jsonify({"error": "Admin access required."}), 403

    scheme = Scheme.query.get_or_404(scheme_id)
    data = request.get_json()

    scheme.name = data.get("name", scheme.name)
    scheme.description = data.get("description", scheme.description)
    scheme.income_limit = int(data.get("income_limit", scheme.income_limit))
    scheme.category = data.get("category", scheme.category)
    scheme.required_docs = data.get("required_docs", scheme.required_docs)
    scheme.is_active = data.get("is_active", scheme.is_active)

    db.session.commit()
    return jsonify(scheme.to_dict()), 200


@schemes_bp.route("/<int:scheme_id>", methods=["DELETE"])
@jwt_required()
def delete_scheme(scheme_id):
    identity = decode_identity(get_jwt_identity())
    if not isinstance(identity, dict) or identity.get("role") != "admin":
        return jsonify({"error": "Admin access required."}), 403

    scheme = Scheme.query.get_or_404(scheme_id)
    db.session.delete(scheme)
    db.session.commit()
    return jsonify({"message": "Scheme deleted successfully."}), 200
