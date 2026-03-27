from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
import os

VECTOR_DB_PATH = "vectorstore/policy_db"

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

db = FAISS.load_local(
    VECTOR_DB_PATH,
    embeddings,
    allow_dangerous_deserialization=True
)

def get_policy_clauses(query, k=4):
    docs = db.similarity_search(query, k=k)
    return [doc.page_content for doc in docs]