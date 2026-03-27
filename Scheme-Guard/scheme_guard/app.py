from dotenv import load_dotenv
load_dotenv()

import streamlit as st
import streamlit.components.v1 as components
import os
import time

from document_parser.extract_user_data import (
    extract_income,
    extract_document_issues
)
from evaluation.eligibility_checker import check_eligibility
from appeal.appeal_generator import generate_appeal


st.set_page_config(
    page_title="Scheme-Guard | Government Scheme Portal",
    page_icon="🏛️",
    layout="wide"
)


if "page" not in st.session_state:
    st.session_state.page = "home"



st.markdown("""
<style>
:root {
    --gov-blue: #0b3c5d;
    --gov-blue-dark: #082f48;
    --gov-bg: #f4f6f9;
    --gov-border: #d6dbe0;
}

/* Page */
html, body {
    background-color: var(--gov-bg);
    font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Sections */
.section {
    background: white;
    padding: 32px;
    border-radius: 8px;
    border: 1px solid var(--gov-border);
    margin-bottom: 32px;
}

.section h2 {
    color: var(--gov-blue);
}

/* Scheme cards */
.scheme-card {
    background: #fff;
    padding: 26px;
    border-radius: 8px;
    border: 1px solid var(--gov-border);
    text-align: center;
    transition: 0.25s;
}

.scheme-card:hover {
    transform: translateY(-4px);
}

.scheme-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--gov-blue);
}

/* Footer */
.footer {
    text-align: center;
    font-size: 14px;
    color: gray;
    margin: 40px 0 10px;
}

/* ---------- PROGRESS BAR STYLING ---------- */
.stProgress > div > div > div {
    background: linear-gradient(
        90deg,
        #ff9933,
        #ffffff,
        #138808
    );
}
</style>
""", unsafe_allow_html=True)

components.html(
    """
    <style>
    .gov-header {
        background: linear-gradient(135deg, #0b3c5d, #082f48);
        border-radius: 8px;
        margin-bottom: 40px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        color: white;
    }
    .gov-inner {
        display: flex;
        align-items: center;
        gap: 22px;
        padding: 30px 40px;
    }
    .gov-inner img {
        height: 70px;
    }
    .gov-india {
        font-size: 13px;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        opacity: 0.85;
    }
    .gov-portal {
        font-size: 36px;
        font-weight: 700;
    }
    .gov-tagline {
        font-size: 16px;
        margin-top: 6px;
    }
    .gov-tricolor {
        display: flex;
        height: 5px;
    }
    .saffron { background: #ff9933; flex: 1; }
    .white { background: #ffffff; flex: 1; }
    .green { background: #138808; flex: 1; }
    </style>

    <div class="gov-header">
        <div class="gov-inner">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg">
            <div>
                <div class="gov-india">Government of India</div>
                <div class="gov-portal">Scheme-Guard</div>
                <div class="gov-tagline">
                    Unified Government Scheme Eligibility & Compliance Portal
                </div>
            </div>
        </div>
        <div class="gov-tricolor">
            <div class="saffron"></div>
            <div class="white"></div>
            <div class="green"></div>
        </div>
    </div>
    """,
    height=180
)

if st.session_state.page == "home":

    st.markdown("""
    <div class="section">
        <h2>📌 About Scheme-Guard</h2>
        <p>
        AI-powered platform to validate eligibility and documentation
        for government schemes before application submission.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="section">
        <h2>🗂️ Available Government Schemes</h2>
    </div>
    """, unsafe_allow_html=True)

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown("""
        <div class="scheme-card">
            <div class="scheme-title">🎓 Scholarships</div>
            <p>Eligibility & document validation</p>
        </div>
        """, unsafe_allow_html=True)

        if st.button("Proceed"):
            st.session_state.page = "scholarship"
            st.rerun()



elif st.session_state.page == "scholarship":

    st.markdown("""
    <div class="section">
        <h2>🎓 Scholarship Eligibility Validation</h2>
        <p>Upload your Income Certificate (PDF only).</p>
    </div>
    """, unsafe_allow_html=True)

    uploaded_file = st.file_uploader(
        "Upload Income Certificate (PDF only)",
        type=["pdf"]
    )

    if uploaded_file:
        temp_path = "temp_income.pdf"
        with open(temp_path, "wb") as f:
            f.write(uploaded_file.read())


        progress = st.progress(0)
        status = st.empty()

        status.info("📤 Uploading document...")
        progress.progress(25)
        time.sleep(0.3)

        status.info("🔍 Extracting income & document details...")
        income = extract_income(temp_path)
        issues = extract_document_issues(temp_path)
        progress.progress(60)
        time.sleep(0.3)

        status.info("📑 Validating eligibility...")
        result = check_eligibility(income, issues)
        progress.progress(100)

        status.success("✅ Document uploaded and analyzed successfully!")

        if result["status"] == "Eligible":
            st.success("✅ Eligible as per scholarship guidelines")
        else:
            st.error("⚠️ High Risk of Rejection")

            for v in result["violations"]:
                st.markdown(f"""
                <div class="section">
                    <h3>🚫 {v['type']}</h3>
                    <p><b>Reason:</b> {v['reason']}</p>
                    <p><b>Policy Clause:</b><br>{v['policy_clause']}</p>
                </div>
                """, unsafe_allow_html=True)

        
        portal_status = st.radio(
            "Status shown on the government portal",
            ["Not Applied Yet", "Approved", "Rejected"]
        )

        
        if result["status"] == "Eligible" and portal_status == "Rejected":

            st.warning(
                "⚠️ Your application appears to be rejected despite meeting all eligibility criteria."
            )

            name = st.text_input("Applicant Name")
            rejection_reason = st.text_input(
                "Rejection reason shown on the portal (if any)"
            )

            if st.button("📄 Generate Appeal Letter"):
                appeal = generate_appeal(
                    applicant_name=name,
                    rejection_reason=rejection_reason,
                    policy_clauses=[
                        "The applicant satisfies all eligibility conditions prescribed under the scholarship guidelines.",
                        "The submitted Income Certificate complies with the notified income criteria."
                    ]
                )

                st.text_area("Appeal Letter", appeal, height=350)

        os.remove(temp_path)

    if st.button("⬅️ Back to Home"):
        st.session_state.page = "home"
        st.rerun()



st.markdown("""
<div class="footer">
© Government of India | Prototype System for Academic & Hackathon Use
</div>
""", unsafe_allow_html=True)