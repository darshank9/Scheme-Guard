# Scheme-Guard: Technical Documentation & Project Overview

## 1. Project Objective
Scheme-Guard is a web-based government scheme eligibility and document verification portal. It automates the verification of applicant credentials and documents using Retrieval-Augmented Generation (RAG) Artificial Intelligence and Optical Character Recognition (OCR) heuristics. It drastically reduces processing times by verifying financial constraints and finding anomalies in user-submitted documents.

## 2. Technology Stack

### Frontend Architecture
- **Framework:** React.js (via Vite)
- **Routing:** React Router DOM (Dynamic Protected Routes)
- **State Management:** React Context API (AuthContext)
- **Styling:** Custom Vanilla CSS with responsive design, Light-mode Human-centric UI.
- **Client Networking:** Axios with configured interceptors for JWT Headers.

### Backend Architecture
- **Framework:** Flask (Python)
- **Authentication:** Flask-JWT-Extended (JSON Web Tokens)
- **Database:** SQLite with Flask-SQLAlchemy integration
- **Cross-Origin Resource Sharing:** Flask-CORS

### Artificial Intelligence & Extraction Layer (scheme_guard)
- **Document Text Extraction:** `pdfplumber`
- **OCR Parsers:** Regular Expressions (Regex) pattern matchers
- **Embeddings Model:** `sentence-transformers/all-MiniLM-L6-v2` (HuggingFace)
- **Vector Database:** FAISS
- **Generative AI:** Groq API (`llama-3.1-8b-instant` or similar) via LangChain components

## 3. Project Directory Structure & File Purposes

### Root Level
- **frontend/**: Contains all client-side React code.
- **backend/**: Contains the main REST API and SQLite Database.
- **Scheme-Guard/scheme_guard/**: The core intelligence and parsing engine containing LLM clients.

### Backend Files
- **`app.py`**: The application entry point. Initializes Flask, database configurations, and bootstraps default system data (like Admin credentials and default schemes).
- **`models.py`**: SQLAlchemy schemas for `User`, `Scheme`, and `Application` models, handling foreign keys and JSON serialization methods (`to_dict`).
- **`verify_db.py`**: Helper script to quickly verify seeded DB details and scheme activity.
- **`routes/auth.py`**: API endpoints for user login, registration, and JWT generation.
- **`routes/documents.py`**: Core application submission portal route. Accepts user PDFs, routes them to `extract_user_data.py` for OCR, matches against FAISS embeddings via `_check_eligibility`, generating eligibility results.
- **`routes/schemes.py`**: Public APIs serving schemes available for users to view.
- **`routes/admin.py`**: Protected backend endpoints for admin aggregations (`/stats`), processing FAISS vector indexing of new guidelines (`upload_scheme_guidelines`), and managing applications statuses and active users.

### AI Engine (scheme_guard)
- **`document_parser/extract_user_data.py`**: The deterministic extraction script. Leverages `pdfplumber` to extract document validity factors (Missing Seals, Aadhaar Seeding constraints) and Regex patterns to extract numeric Income limits.
- **`llm/groq_client.py`**: Communicates with the Groq API for LLM-based fallback generation.
- **`appeal/appeal_generator.py`**: Leverages the LLM to draft comprehensive appeal letters for users whose applications have been rejected.

### Frontend Files
- **`src/App.jsx`**: Main router tree containing `ProtectedRoute` middleware ensuring role-based access control.
- **`src/api.js`**: Centralized HTTP client managing API routes across schemes, authentication, and analysis.
- **`src/index.css`**: Complete design system implementation handling variables, UI grid components, cards, hero-headers, and button metrics.
- **`src/context/AuthContext.jsx`**: Context provider tracking user login and token expiry variables throughout the React runtime.
- **`src/components/Navbar.jsx`**: Global dynamically-bound navigation header that displays varying links depending on user's authorization state.

### Frontend Pages
- **`Home.jsx`**: Public landing page featuring available schemes. Conditionally hides login buttons for authenticated sessions.
- **`Login.jsx` & `Register.jsx`**: Standard user authorization forms storing JWT keys in LocalStorage.
- **`AdminLogin.jsx`**: Standalone portal specialized for System Administrators (`admin`/`admin123`).
- **`Dashboard.jsx`**: The User portal tracking application submission statuses, parsed incomes, and the ability to trigger Appeals conditionally.
- **`Upload.jsx`**: Drag-and-Drop file processing interface uploading documents via FormData requests. Includes 10MB size validation.
- **`Result.jsx`**: Granular display screen post-analysis revealing precise AI Warnings, Extracted incomes, and overall Eligibility classification.
- **`AdminDashboard.jsx`**: Operational overview showing aggregate system-wide statistics like success rate KPIs, and outstanding workloads.
- **`SchemeManagement.jsx`**: Complete CRUD interface for creating administrative frameworks and processing new Scheme Policy reference PDFs into Vector embeddings for AI querying.
- **`ApplicationReview.jsx`**: The final decision point UI for Admins to view all System Document Issues, rule violations, user emails, and execute final Acceptance or Rejections.

## 4. Workflows & Technical Highlights

1. **RAG Integration**: When an Admin adds a scheme guideline PDF, it is chunks of 500 characters and indexed sequentially in FAISS via local HuggingFace Embeddings.
2. **Contextual Evaluation**: When an applicant uploads an Income Certificate, their raw numerical limits are dynamically extracted via deterministic regex. The LLM evaluates these numerical constraints against the semantically retrieved conditions of the target scheme's FAISS index.
3. **Graceful Degradation**: If AI resources (FAISS database not populated or LLM token quotas exhausted), the backend seamlessly routes to a fallback rules-engine evaluating document authenticity markers.
4. **Security Checkpoints**: Backend blueprints enforce `decode_identity` dict checking ensuring that sensitive endpoints strictly intercept calls without `admin` assertions. Front-end protected routes concurrently redirect non-admins instantly to entry portals.
