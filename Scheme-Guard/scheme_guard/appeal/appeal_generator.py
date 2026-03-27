from llm.groq_client import groq_generate


def generate_appeal(applicant_name, rejection_reason, policy_clauses):
    """
    Generates a formal government appeal letter
    ONLY for cases where the applicant is eligible
    as per scholarship guidelines but the application
    was rejected by the portal.
    """

    formatted_clauses = "\n".join(
        [f"- {clause}" for clause in policy_clauses if clause]
    )

    prompt = f"""
You are drafting a FORMAL GOVERNMENT REPRESENTATION / APPEAL LETTER
for a scholarship application that has been REJECTED
despite the applicant fulfilling all eligibility conditions.

The letter must be:
- Formal
- Respectful
- Policy-grounded
- Suitable for submission to a Government Authority

❗ Do NOT invent rules or facts.
❗ Do NOT use emotional or casual language.
❗ Base the appeal strictly on the provided policy clauses.
❗ Assume the applicant is ELIGIBLE as per official guidelines.

--------------------------------------------------
APPLICANT DETAILS
--------------------------------------------------
Applicant Name: {applicant_name}

--------------------------------------------------
PORTAL REJECTION DETAILS
--------------------------------------------------
Rejection Reason (as shown on portal):
{rejection_reason or "Rejection reason not clearly specified on the portal."}

--------------------------------------------------
ESTABLISHED COMPLIANCE
--------------------------------------------------
The applicant has fulfilled all eligibility requirements
as prescribed under the applicable scholarship guidelines,
including submission of valid mandatory documents and
compliance with income and scheme-specific conditions.

--------------------------------------------------
RELEVANT POLICY CLAUSES
--------------------------------------------------
{formatted_clauses}

--------------------------------------------------
INSTRUCTIONS FOR LETTER STRUCTURE
--------------------------------------------------
Draft a complete appeal letter with the following structure:

1. Addressed to:
   "The Competent Authority / Scholarship Sanctioning Authority"

2. Subject line:
   "Subject: Representation regarding reconsideration of scholarship application"

3. Opening paragraph:
   - Formal salutation
   - Reference to the scholarship application and its rejection

4. Body:
   - State that the applicant fulfills all eligibility conditions
   - Address the stated rejection reason respectfully
   - Cite the relevant policy clauses to demonstrate compliance
   - Clarify that the rejection appears inconsistent with prescribed guidelines

5. Undertaking:
   - Express willingness to submit clarifications or additional documents
   - Reaffirm adherence to scheme norms

6. Closing:
   - Polite request for reconsideration of the application
   - Formal sign-off with applicant name

--------------------------------------------------
IMPORTANT
--------------------------------------------------
- Maintain respectful, non-accusatory tone
- Do not challenge authority directly
- Do not mention any automated system or analysis
- Output ONLY the appeal letter text
"""

    return groq_generate(prompt)