from rag.query_policy import get_policy_clauses
from evaluation.policy_queries import POLICY_QUERY_MAP
import re


def normalize_issue_type(issue_type):
    if not issue_type:
        return ""
    return issue_type.strip().lower().replace("_", " ")

def extract_income_limit(policy_text):
    if not policy_text:
        return None
    match = re.search(r"(\d+(\.\d+)?)\s*lakh", policy_text.lower())
    if match:
        return int(float(match.group(1)) * 100000)
    return None

def select_valid_clause(clauses, required_keywords):
    for clause in clauses:
        text = clause.lower()
        if all(k in text for k in required_keywords):
            return clause.strip()
    return None

def auto_detect_violations_from_text(pdf_text):
    violations = []
    t = pdf_text.lower()

    if "exceeds the prescribed income ceiling" in t:
        violations.append({
            "type": "Income",
            "reason": "Declared annual income exceeds the prescribed income ceiling."
        })

    if "not aadhaar-seeded" in t:
        violations.append({
            "type": "Compliance",
            "reason": "Bank account is not Aadhaar-seeded, which is mandatory for DBT."
        })

    if "without official seal" in t:
        violations.append({
            "type": "Authenticity",
            "reason": "Income certificate does not bear the official seal."
        })

    if "variation in applicant name" in t or "identity discrepancy" in t:
        violations.append({
            "type": "Identity",
            "reason": "Mismatch in applicant name across official documents."
        })

    return violations


def check_eligibility(user_income, doc_issues, pdf_text=None):
    violations = []

 
    if pdf_text:
        detected = auto_detect_violations_from_text(pdf_text)
        doc_issues = (doc_issues or []) + detected

    
    normalized_issue_types = [
        normalize_issue_type(issue.get("type", ""))
        for issue in doc_issues
    ]

    document_invalid = len(doc_issues) > 0
    wrong_doc_uploaded = "document type" in normalized_issue_types


    if user_income is not None and not wrong_doc_uploaded:
        income_clauses = get_policy_clauses(POLICY_QUERY_MAP.get("Income"))

        income_policy = select_valid_clause(
            income_clauses,
            required_keywords=["income", "lakh"]
        )

        income_limit = extract_income_limit(income_policy) or 450000

        if user_income > income_limit:
            violations.append({
                "type": "Income",
                "reason": f"Annual family income exceeds the permitted limit of ₹{income_limit}.",
                "policy_clause": income_policy or
                "The annual family income must not exceed ₹4.5 lakh per annum."
            })

    elif wrong_doc_uploaded:
        violations.append({
            "type": "Income Evaluation",
            "reason": "Income eligibility could not be assessed due to invalid income certificate.",
            "policy_clause":
                "Submission of a valid income certificate is mandatory."
        })
        
    ISSUE_FALLBACK_CLAUSE = {
        "income":
            "Income exceeding the prescribed ceiling makes the applicant ineligible.",
        "authenticity":
            "Certificates without official seal or signature are invalid.",
        "compliance":
            "Aadhaar-seeded bank account is mandatory for DBT.",
        "identity":
            "Applicant identity must be consistent across documents.",
        "document type":
            "Valid income certificate from competent authority is mandatory."
    }

    for issue in doc_issues:
        issue_type = normalize_issue_type(issue.get("type", "")).title()
        issue_norm = normalize_issue_type(issue.get("type", ""))

        violations.append({
            "type": issue_type,
            "reason": issue.get("reason", "Document does not comply with guidelines."),
            "policy_clause": ISSUE_FALLBACK_CLAUSE.get(
                issue_norm,
                "All submitted documents must comply with scheme guidelines."
            )
        })

    status = "Eligible" if not violations and not document_invalid else "High Risk"

    return {
        "status": status,
        "violations": violations
    }