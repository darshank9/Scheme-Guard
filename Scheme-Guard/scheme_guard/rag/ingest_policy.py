import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

PDF_PATH = "data/policy/scholarship_policy.pdf"
VECTOR_DB_PATH = "vectorstore/policy_db"

os.makedirs(VECTOR_DB_PATH, exist_ok=True)

print("📄 Loading PDF...")
loader = PyPDFLoader(PDF_PATH)
documents = loader.load()

print("📄 Number of pages loaded:", len(documents))

if len(documents) == 0:
    raise RuntimeError("❌ No text extracted from PDF")

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100
)

chunks = splitter.split_documents(documents)

print("✂️ Number of text chunks:", len(chunks))

if len(chunks) == 0:
    raise RuntimeError("❌ PDF loaded but no chunks created")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

db = FAISS.from_documents(chunks, embeddings)
db.save_local(VECTOR_DB_PATH)

print("✅ FAISS index created successfully")