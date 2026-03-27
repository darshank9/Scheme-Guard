from extensions import db

from datetime import datetime


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(200), nullable=True)
    role = db.Column(db.String(20), default="user")  # "user" or "admin"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "created_at": self.created_at.isoformat()
        }


class Scheme(db.Model):
    __tablename__ = "schemes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    income_limit = db.Column(db.Integer, nullable=False, default=450000)
    category = db.Column(db.String(100), nullable=True)
    required_docs = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    guidelines_pdf_path = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applications = db.relationship("Application", backref="scheme", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "income_limit": self.income_limit,
            "category": self.category,
            "required_docs": self.required_docs,
            "is_active": self.is_active,
            "guidelines_pdf_path": self.guidelines_pdf_path,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    scheme_id = db.Column(db.Integer, db.ForeignKey("schemes.id"), nullable=True)

    # Document details
    filename = db.Column(db.String(300), nullable=True)
    extracted_income = db.Column(db.Integer, nullable=True)

    # Eligibility
    eligibility_status = db.Column(db.String(50), default="Pending")  # Eligible, High Risk, Pending
    violations = db.Column(db.Text, nullable=True)  # JSON string
    doc_issues = db.Column(db.Text, nullable=True)  # JSON string

    # Admin action
    admin_status = db.Column(db.String(50), default="Under Review")  # Under Review, Approved, Rejected, Appealed
    admin_remarks = db.Column(db.Text, nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    appeal_text = db.Column(db.Text, nullable=True)

    # Relationships
    applicant = db.relationship("User", foreign_keys=[user_id], backref="applications")
    reviewer = db.relationship("User", foreign_keys=[reviewed_by])


    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "user_id": self.user_id,
            "scheme_id": self.scheme_id,
            "scheme_name": self.scheme.name if self.scheme else None,
            "applicant_name": self.applicant.full_name if self.applicant else None,
            "applicant_email": self.applicant.email if self.applicant else None,
            "filename": self.filename,
            "extracted_income": self.extracted_income,
            "eligibility_status": self.eligibility_status,
            "violations": json.loads(self.violations) if self.violations else [],
            "doc_issues": json.loads(self.doc_issues) if self.doc_issues else [],
            "admin_status": self.admin_status,
            "admin_remarks": self.admin_remarks,
            "appeal_text": self.appeal_text,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
