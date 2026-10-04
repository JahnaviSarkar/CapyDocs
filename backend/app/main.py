from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uuid
import tempfile
from typing import Dict, Any, Optional

from app.pdf_loader import load_and_clean_pdf
from app.chunker import chunk_documents
from app.retrieval import Retriever
from app.llm import get_llm, generate_answer
from app.summarizer import generate_summary

app = FastAPI(title="CapyDocs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory document storage
# {doc_id: {"chunks": [], "retriever": Retriever}}
document_store: Dict[str, Any] = {}

MAX_FILE_SIZE = 20 * 1024 * 1024 # 20MB

class ChatRequest(BaseModel):
    doc_id: str
    question: str
    purpose: Optional[str] = "general"

class SummaryRequest(BaseModel):
    doc_id: str
    purpose: Optional[str] = "general"

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 20MB limit.")
        
    doc_id = str(uuid.uuid4())
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name
        
    try:
        documents = load_and_clean_pdf(tmp_path)
        chunks = chunk_documents(documents)
        retriever = Retriever(chunks)
        
        document_store[doc_id] = {
            "chunks": chunks,
            "retriever": retriever
        }
        
        pages = set(doc.metadata.get("page", 0) for doc in chunks)
        
        return {
            "doc_id": doc_id,
            "page_count": len(pages),
            "chunk_count": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def parse_answer_and_sources(raw_answer: str):
    import re
    if "don't know" in raw_answer.lower() or "could not find" in raw_answer.lower():
        return raw_answer, []
        
    pages_used = []
    clean_answer = raw_answer
    
    match = re.search(r'SOURCES:\s*\[(.*?)\]', raw_answer)
    if match:
        digits = re.findall(r'\d+', match.group(1))
        pages_used = sorted(list(set([int(d) for d in digits])))
    
    clean_answer = re.sub(r'SOURCES:\s*\[.*?\]', '', raw_answer).strip()
    clean_answer = re.sub(r'SOURCES:.*$', '', clean_answer, flags=re.MULTILINE).strip()
    
    # Fix the lost em dash and quotes replacement character
    clean_answer = clean_answer.replace('\ufffd', '—')
    return clean_answer, pages_used

@app.post("/chat")
def chat(req: ChatRequest):
    if req.doc_id not in document_store:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    store = document_store[req.doc_id]
    retriever = store["retriever"]
    
    try:
        relevant_docs = retriever.retrieve(req.question)
        if not relevant_docs:
            return {"answer": "Could not find relevant information in the PDF.", "pages_used": []}
            
        llm = get_llm()
        raw_answer = generate_answer(llm, relevant_docs, req.question, req.purpose)
        
        clean_answer, pages_used = parse_answer_and_sources(raw_answer)
        
        return {"answer": clean_answer, "pages_used": pages_used}
    except Exception as e:
        if "connection" in str(e).lower() or "ollama" in str(e).lower():
            raise HTTPException(status_code=503, detail="The AI model service (Ollama) is currently unavailable. Please ensure it is running.")
        raise HTTPException(status_code=500, detail="An error occurred while generating the answer.")

@app.post("/summary")
def summary(req: SummaryRequest):
    if req.doc_id not in document_store:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    store = document_store[req.doc_id]
    chunks = store["chunks"]
    
    try:
        llm = get_llm()
        sum_text = generate_summary(llm, chunks, req.purpose)
        return {"summary": sum_text}
    except Exception as e:
        if "connection" in str(e).lower() or "ollama" in str(e).lower():
            raise HTTPException(status_code=503, detail="The AI model service (Ollama) is currently unavailable. Please ensure it is running.")
        raise HTTPException(status_code=500, detail="An error occurred while generating the summary.")
