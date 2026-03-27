import pdfplumber
import re
def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()

def detect_document_type(text):
    t = text.lower()

    if "bonafide" in t or "bona fide" in t:
        return "Bonafide Certificate"

    if "income certificate" in t or "annual income" in t:
        return "Income Certificate"

    return "Unknown Document"


def extract_income(pdf_path):
    text = extract_text_from_pdf(pdf_path)
    if not text:
        return None

    if detect_document_type(text) != "Income Certificate":
        return None

    t = text.lower()
    t = t.replace(",", "")
    t = t.replace("₹", " rs ")
    t = t.replace("\n", " ")

    patterns = [
        r"annual\s+family\s+income.*?rs\.?\s*(\d{5,7})",
        r"total\s+annual\s+family\s+income.*?rs\.?\s*(\d{5,7})",
        r"rs\.?\s*(\d{5,7})"
    ]

    for p in patterns:
        m = re.search(p, t)
        if m:
            return int(m.group(1))

    return None

def extract_document_issues(pdf_path):
    issues = []
    text = extract_text_from_pdf(pdf_path)

    if not text:
        return [{
            "type": "Document",
            "reason": "Unable to extract text from uploaded document"
        }]

    t = text.lower()

    doc_type = detect_document_type(t)
    if doc_type != "Income Certificate":
        issues.append({
            "type": "Document Type",
            "reason": f"Uploaded document is a {doc_type}, not a valid Income Certificate"
        })

    if "exceeds the prescribed income ceiling" in t:
        issues.append({
            "type": "Income",
            "reason": "Declared annual income exceeds the prescribed income ceiling"
        })

    if "not aadhaar-seeded" in t or "not aadhaar seeded" in t:
        issues.append({
            "type": "Compliance",
            "reason": "Bank account is not Aadhaar-seeded (mandatory for DBT)"
        })

    if "without official seal" in t or "verification pending" in t:
        issues.append({
            "type": "Authenticity",
            "reason": "Income certificate issued without official seal or proper verification"
        })

    if "variation in applicant name" in t or "identity discrepancy" in t:
        issues.append({
            "type": "Identity",
            "reason": "Applicant name mismatch across submitted documents"
        })

    return issues