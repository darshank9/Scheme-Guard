import os
import sys
import json
import re

# Add the existing scheme_guard module to path
SCHEME_GUARD_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "Scheme-Guard", "scheme_guard")
if SCHEME_GUARD_PATH not in sys.path:
    sys.path.insert(0, SCHEME_GUARD_PATH)

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from backend.extensions import db
from backend.models import Application, Scheme

documents_bp = Blueprint("documents", __name__)

ALLOWED_EXTENSIONS = {"pdf"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _extract_from_pdf(pdf_path):
    """Wrapper around existing document_parser logic."""
    try:
        from document_parser.extract_user_data import extract_income, extract_document_issues
        income = extract_income(pdf_path)
        issues = extract_document_issues(pdf_path)
        return income, issues
    except Exception as e:
        return None, [{"type": "System", "reason": f"Could not parse document: {str(e)}"}]


def _check_eligibility(income, doc_issues, income_limit, scheme_id=None, user_policy_path=None):
    """Run eligibility logic. Uses direct text extraction for policy context if provided, being memory-efficient for Render."""
    try:
        from llm.groq_client import groq_generate
        from pypdf import PdfReader
        
        policy_context = "No specific policy document provided. Fallback to general rules."
        
        if user_policy_path and os.path.exists(user_policy_path):
            # Extract text directly from user-uploaded policy (Memory-efficient alternative to RAG)
            reader = PdfReader(user_policy_path)
            text = ""
            for i, page in enumerate(reader.pages):
                if i > 50: break # Safety limit
                text += page.extract_text() + "\n"
            if text.strip():
                policy_context = text[:15000] # Limit context window to 15k chars for prompt safety
        
        # If we have a specific policy (from user or scheme), use Groq for advanced evaluation
        if policy_context and policy_context != "No specific policy document provided. Fallback to general rules.":
            issues_str = "\n".join([f"- {i.get('type')}: {i.get('reason')}" for i in doc_issues]) if doc_issues else "None"
            income_str = f"₹{income:,}" if income else "Could not be extracted"

            prompt = f"""
You are an expert Government Scheme Eligibility Evaluator.
Given the following Scheme Policy Rules, evaluate the applicant's eligibility.

SCHEME POLICY RULES:
{policy_context}

APPLICANT DETAILS:
- Extracted Annual Income: {income_str}
- Identified Document Issues: {issues_str}

Respond STRICTLY with a JSON object. Do not include markdown formatting or extra text.
Format:
{{
    "status": "Eligible" | "High Risk",
    "violations": [
        {{ "type": "Issue Type", "reason": "Specific reason for violation", "policy_clause": "Quote the exact rule from policy" }}
    ]
}}
If there are no violations, "violations" should be an empty list [].
"""
            response = groq_generate(prompt)
            
            # Clean up response to ensure JSON parsing
            response = response.strip()
            if response.startswith("```json"): response = response[7:]
            if response.startswith("```"): response = response[3:]
            if response.endswith("```"): response = response[:-3]
            
            return json.loads(response.strip())

    except Exception as e:
        print("RAG Error:", e)
        pass # Fallback to manual checking

    print("Falling back to manual check...")
    # Manual fallback logic
    violations = []
    normalized_issue_types = [(issue.get("type", "") or "").strip().lower().replace("_", " ") for issue in doc_issues]
    wrong_doc_uploaded = "document type" in normalized_issue_types

    if income is not None and not wrong_doc_uploaded:
        if income > income_limit:
            violations.append({
                "type": "Income",
                "reason": f"Annual family income ₹{income:,} exceeds the permitted limit of ₹{income_limit:,}.",
                "policy_clause": f"The annual family income must not exceed ₹{income_limit:,} per annum."
            })
    elif wrong_doc_uploaded:
        violations.append({
            "type": "Income Evaluation",
            "reason": "Income eligibility could not be assessed due to invalid income certificate.",
            "policy_clause": "Submission of a valid income certificate is mandatory."
        })
    else:
        violations.append({
            "type": "Income Evaluation",
            "reason": "Income eligibility could not be assessed because the income amount was not clearly visible or could not be extracted.",
            "policy_clause": "The income amount must be clearly stated on the submitted certificate."
        })

    ISSUE_FALLBACK_CLAUSE = {
        "income": "Income exceeding the prescribed ceiling makes the applicant ineligible.",
        "authenticity": "Certificates without official seal or signature are invalid.",
        "compliance": "Aadhaar-seeded bank account is mandatory for DBT.",
        "identity": "Applicant identity must be consistent across documents.",
        "document type": "Valid income certificate from competent authority is mandatory."
    }

    for issue in doc_issues:
        issue_type = (issue.get("type", "") or "").strip().lower().replace("_", " ")
        violations.append({
            "type": issue.get("type", "Document"),
            "reason": issue.get("reason", "Document does not comply with guidelines."),
            "policy_clause": ISSUE_FALLBACK_CLAUSE.get(issue_type, "All submitted documents must comply with scheme guidelines.")
        })

    status = "Eligible" if not violations else "High Risk"
    return {"status": status, "violations": violations}


@documents_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_document():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)
    user_id = identity["id"]

    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400

    file = request.files["file"]
    scheme_id = request.form.get("scheme_id")
    scheme_id = int(scheme_id) if scheme_id and scheme_id.strip() else None

    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Only PDF files are allowed."}), 400

    # Save file
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder, exist_ok=True)

    filename = secure_filename(f"user_{user_id}_{file.filename}")
    pdf_path = os.path.join(upload_folder, filename)
    try:
        file.save(pdf_path)
    except Exception as e:
        print(f"File Save Error (Main): {str(e)}")
        return jsonify({"error": f"Failed to save document: {str(e)}"}), 500

    # Save optional policy file
    policy_file = request.files.get("policy_file")
    user_policy_path = None
    if policy_file and policy_file.filename != "":
        p_filename = secure_filename(f"user_{user_id}_policy_{policy_file.filename}")
        user_policy_path = os.path.join(upload_folder, p_filename)
        policy_file.save(user_policy_path)

    # Get scheme income limit
    income_limit = 450000
    scheme = None
    if scheme_id:
        scheme = Scheme.query.get(scheme_id)
        if scheme:
            income_limit = scheme.income_limit

    # Extract & evaluate
    income, doc_issues = _extract_from_pdf(pdf_path)
    result = _check_eligibility(income, doc_issues, income_limit, scheme_id=scheme.id if scheme else None, user_policy_path=user_policy_path)

    # Persist application
    application = Application(
        user_id=user_id,
        scheme_id=scheme.id if scheme else None,
        filename=filename,
        extracted_income=income,
        eligibility_status=result["status"],
        violations=json.dumps(result["violations"]),
        doc_issues=json.dumps(doc_issues),
        admin_status="Under Review"
    )
    db.session.add(application)
    db.session.commit()

    return jsonify({
        "application": application.to_dict(),
        "eligibility": result
    }), 201


@documents_bp.route("/applications", methods=["GET"])
@jwt_required()
def get_user_applications():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)
    user_id = identity["id"]

    applications = Application.query.filter_by(user_id=user_id).order_by(Application.created_at.desc()).all()
    return jsonify([a.to_dict() for a in applications]), 200


@documents_bp.route("/applications/<int:app_id>", methods=["GET"])
@jwt_required()
def get_application(app_id):
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)
    app_record = Application.query.get_or_404(app_id)

    # Users can only see their own; admins see all
    if identity["role"] != "admin" and app_record.user_id != identity["id"]:
        return jsonify({"error": "Access denied."}), 403

    return jsonify(app_record.to_dict()), 200


@documents_bp.route("/applications/<int:app_id>/appeal", methods=["POST"])
@jwt_required()
def submit_appeal(app_id):
    identity = get_jwt_identity()
    if isinstance(identity, str):
        identity = json.loads(identity)
    user_id = identity["id"]

    app_record = Application.query.get_or_404(app_id)
    if app_record.user_id != user_id:
        return jsonify({"error": "Access denied."}), 403

    if app_record.admin_status != "Rejected":
        return jsonify({"error": "Only rejected applications can be appealed."}), 400

    data = request.get_json()
    appeal_text = data.get("appeal_text")
    if not appeal_text:
        return jsonify({"error": "Appeal text is required."}), 400

    app_record.appeal_text = appeal_text
    app_record.admin_status = "Appealed"
    db.session.commit()

    return jsonify({"message": "Appeal submitted successfully.", "application": app_record.to_dict()}), 200




@documents_bp.route("/appeal", methods=["POST"])
@jwt_required()
def generate_appeal():
    """Generate appeal letter using Groq LLM."""
    try:
        from appeal.appeal_generator import generate_appeal as _gen_appeal
    except Exception:
        return jsonify({"error": "Appeal generation module not available."}), 500

    data = request.get_json()
    applicant_name = data.get("applicant_name", "Applicant")
    rejection_reason = data.get("rejection_reason", "")
    policy_clauses = data.get("policy_clauses", [
        "The applicant satisfies all eligibility conditions prescribed under scheme guidelines.",
        "The submitted Income Certificate complies with notified income criteria."
    ])

    try:
        appeal_text = _gen_appeal(
            applicant_name=applicant_name,
            rejection_reason=rejection_reason,
            policy_clauses=policy_clauses
        )
        return jsonify({"appeal": appeal_text}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate appeal: {str(e)}"}), 500
