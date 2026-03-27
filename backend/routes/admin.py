from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Application, User, Scheme
import json
import os
from werkzeug.utils import secure_filename
from flask import current_app

admin_bp = Blueprint("admin", __name__)


def require_admin(identity):
    if isinstance(identity, str):
        try:
            identity = json.loads(identity)
        except (json.JSONDecodeError, ValueError, TypeError):
            pass
    if not identity or not isinstance(identity, dict):
        return False
    if identity.get("role") != "admin":
        return False
    return True


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    identity = get_jwt_identity()
    if not require_admin(identity):
        return jsonify({"error": "Admin access required."}), 403

    total_users = User.query.filter_by(role="user").count()
    total_applications = Application.query.count()
    total_schemes = Scheme.query.filter_by(is_active=True).count()
    pending = Application.query.filter_by(admin_status="Under Review").count()
    approved = Application.query.filter_by(admin_status="Approved").count()
    rejected = Application.query.filter_by(admin_status="Rejected").count()

    return jsonify({
        "total_users": total_users,
        "total_applications": total_applications,
        "total_schemes": total_schemes,
        "pending": pending,
        "approved": approved,
        "rejected": rejected
    }), 200


@admin_bp.route("/applications", methods=["GET"])
@jwt_required()
def get_applications():
    identity = get_jwt_identity()
    if not require_admin(identity):
        return jsonify({"error": "Admin access required."}), 403

    search = request.args.get("search", "").strip().lower()
    status_filter = request.args.get("status", "")

    query = Application.query.join(User, Application.user_id == User.id)

    if search:
        query = query.filter(
            db.or_(
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.username.ilike(f"%{search}%")
            )
        )

    if status_filter:
        query = query.filter(Application.admin_status == status_filter)

    applications = query.order_by(Application.created_at.desc()).all()
    return jsonify([a.to_dict() for a in applications]), 200


@admin_bp.route("/applications/<int:app_id>/status", methods=["PUT"])
@jwt_required()
def update_application_status(app_id):
    identity = get_jwt_identity()
    if not require_admin(identity):
        return jsonify({"error": "Admin access required."}), 403

    app_record = Application.query.get_or_404(app_id)
    data = request.get_json()

    new_status = data.get("status")
    if new_status not in ["Approved", "Rejected", "Under Review"]:
        return jsonify({"error": "Invalid status value."}), 400

    app_record.admin_status = new_status
    app_record.admin_remarks = data.get("remarks", app_record.admin_remarks)
    if isinstance(identity, str):
        try:
            identity = json.loads(identity)
        except (json.JSONDecodeError, ValueError, TypeError):
            pass
    app_record.reviewed_by = identity.get("id") if isinstance(identity, dict) else identity

    db.session.commit()
    return jsonify(app_record.to_dict()), 200


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    identity = get_jwt_identity()
    if not require_admin(identity):
        return jsonify({"error": "Admin access required."}), 403

    users = User.query.filter_by(role="user").order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@admin_bp.route("/schemes/<int:scheme_id>/guidelines", methods=["POST"])
@jwt_required()
def upload_scheme_guidelines(scheme_id):
    identity = get_jwt_identity()
    if not require_admin(identity):
        return jsonify({"error": "Admin access required."}), 403

    scheme = Scheme.query.get_or_404(scheme_id)

    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are allowed."}), 400

    filename = secure_filename(f"scheme_{scheme_id}_guidelines.pdf")
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    pdf_path = os.path.join(upload_folder, filename)
    file.save(pdf_path)

    scheme.guidelines_pdf_path = pdf_path
    db.session.commit()

    # Create FAISS index
    try:
        from langchain_community.document_loaders import PyPDFLoader
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        from langchain_community.embeddings import HuggingFaceEmbeddings
        from langchain_community.vectorstores import FAISS

        loader = PyPDFLoader(pdf_path)
        documents = loader.load()

        if len(documents) > 0:
            splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
            chunks = splitter.split_documents(documents)
            
            embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
            
            vs_path = os.path.join(os.path.dirname(current_app.config["UPLOAD_FOLDER"]), "vectorstore", f"scheme_{scheme_id}")
            os.makedirs(vs_path, exist_ok=True)
            
            # Use allow_dangerous_deserialization internally later when reading
            db_faiss = FAISS.from_documents(chunks, embeddings)
            db_faiss.save_local(vs_path)
            
            return jsonify({
                "message": "Guidelines uploaded and processed successfully.",
                "scheme": scheme.to_dict()
            }), 200
        else:
            return jsonify({"error": "No text could be extracted from the PDF."}), 400

    except Exception as e:
        return jsonify({"error": f"Failed to parse guidelines for AI: {str(e)}"}), 500

