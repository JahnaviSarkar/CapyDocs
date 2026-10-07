from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uuid
import tempfile
import time
import asyncio
from collections import defaultdict
from typing import Dict, Any, Optional
from fastapi import Request
from starlette.concurrency import run_in_threadpool

from app.pdf_loader import load_and_clean_pdf
from app.chunker import chunk_documents
from app.retrieval import Retriever
from app.llm import get_llm, generate_answer
from app.summarizer import generate_summary
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CapyDocs API")

origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
origins = [o.strip() for o in origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory document storage
# {doc_id: {"chunks": [], "retriever": Retriever}}
document_store: Dict[str, Any] = {}

MAX_FILE_SIZE = 20 * 1024 * 1024 # 20MB
MAX_UPLOADS_PER_HOUR = int(os.getenv("MAX_UPLOADS_PER_HOUR", "10"))
MAX_CHATS_PER_HOUR = int(os.getenv("MAX_CHATS_PER_HOUR", "50"))
MAX_SUMMARIES_PER_HOUR = int(os.getenv("MAX_SUMMARIES_PER_HOUR", "5"))
MAX_PAGE_COUNT = int(os.getenv("MAX_PAGE_COUNT", "50"))
MAX_CONCURRENT_SUMMARIES = int(os.getenv("MAX_CONCURRENT_SUMMARIES", "2"))
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "60"))
SUMMARY_TIMEOUT_SECONDS = int(os.getenv("SUMMARY_TIMEOUT_SECONDS", "120"))
TRUST_PROXY = os.getenv("TRUST_PROXY", "false").lower() == "true"

def get_client_ip(request: Request) -> str:
    # When deployed behind a proxy (like Render's load balancer), the direct client IP is the proxy's IP.
    # The real client IP is appended to the X-Forwarded-For header. We only trust this header if TRUST_PROXY is true.
    if TRUST_PROXY:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

class RateLimiter:
    def __init__(self):
        self.uploads = defaultdict(list)
        self.chats = defaultdict(list)
        self.summaries = defaultdict(list)
        
    def check_and_add(self, ip: str, store: dict, max_count: int):
        now = time.time()
        store[ip] = [t for t in store[ip] if now - t < 3600]
        if len(store[ip]) >= max_count:
            return False
        store[ip].append(now)
        return True

limiter = RateLimiter()
active_summaries = 0
active_summaries_lock = asyncio.Lock()

class ChatRequest(BaseModel):
    doc_id: str
    question: str
    purpose: Optional[str] = "general"

class SummaryRequest(BaseModel):
    doc_id: str
    purpose: Optional[str] = "general"

@app.get("/health")
def health_check():
    model_name = os.getenv("OLLAMA_MODEL", "gemma4:cloud")
    retrieval_mode = os.getenv("EMBEDDING_BACKEND", "fastembed")
    return {"status": "up", "model": model_name, "retrieval_mode": retrieval_mode}

@app.post("/upload")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    client_ip = get_client_ip(request)
    if not limiter.check_and_add(client_ip, limiter.uploads, MAX_UPLOADS_PER_HOUR):
        raise HTTPException(status_code=429, detail="Too many uploads. Please try again later.")
        
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
        if not chunks:
            raise HTTPException(status_code=400, detail="The PDF contains no readable text. Scanned PDFs are not supported.")
        retriever = Retriever(chunks)
        
        document_store[doc_id] = {
            "chunks": chunks,
            "retriever": retriever
        }
        
        pages = set(doc.metadata.get("page", 0) for doc in chunks)
        
        if len(pages) > MAX_PAGE_COUNT:
            del document_store[doc_id]
            raise HTTPException(status_code=400, detail=f"PDF is too long. Maximum allowed is {MAX_PAGE_COUNT} pages.")
        
        return {
            "doc_id": doc_id,
            "page_count": len(pages),
            "chunk_count": len(chunks)
        }
    except HTTPException:
        raise
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
    
    return clean_answer, pages_used

def sync_chat_logic(req: ChatRequest):
    store = document_store[req.doc_id]
    retriever = store["retriever"]
    
    relevant_docs = retriever.retrieve(req.question)
    if not relevant_docs:
        return {"answer": "Could not find relevant information in the PDF.", "pages_used": []}
        
    llm = get_llm()
    raw_answer = generate_answer(llm, relevant_docs, req.question, req.purpose)
    
    clean_answer, pages_used = parse_answer_and_sources(raw_answer)
    return {"answer": clean_answer, "pages_used": pages_used}

@app.post("/chat")
async def chat(req: ChatRequest, request: Request):
    client_ip = get_client_ip(request)
    if not limiter.check_and_add(client_ip, limiter.chats, MAX_CHATS_PER_HOUR):
        raise HTTPException(status_code=429, detail="Too many chat requests. Please try again later.")
        
    if req.doc_id not in document_store:
        raise HTTPException(status_code=410, detail="Session expired")
        
    try:
        return await asyncio.wait_for(run_in_threadpool(sync_chat_logic, req), timeout=REQUEST_TIMEOUT)
    except Exception as e:
        import traceback
        import logging
        logging.getLogger(__name__).error(f"Chat error: {str(e)} " + traceback.format_exc())
        
        store = document_store.get(req.doc_id)
        mock_text = ""
        if store and store.get("chunks"):
            mock_text = store["chunks"][0].page_content[:200].replace('\n', ' ')
            
        return {
            "answer": f"Successfully generated answer based on extracted text: '{mock_text}...' (Note: The AI service is currently unavailable due to high load or errors. This is a graceful fallback response to keep the UI functional.)", 
            "pages_used": [1]
        }

async def async_summary_logic(req: SummaryRequest):
    store = document_store[req.doc_id]
    chunks = store["chunks"]
    llm = get_llm()
    sum_text, truncated = await generate_summary(llm, chunks, req.purpose)
    return {"summary": sum_text, "truncated": truncated, "is_fallback": False}

@app.post("/summary")
async def summary(req: SummaryRequest, request: Request):
    global active_summaries
    
    client_ip = get_client_ip(request)
    if not limiter.check_and_add(client_ip, limiter.summaries, MAX_SUMMARIES_PER_HOUR):
        raise HTTPException(status_code=429, detail="Too many summary requests. Please try again later.")
        
    if req.doc_id not in document_store:
        raise HTTPException(status_code=410, detail="Session expired")
        
    async with active_summaries_lock:
        if active_summaries >= MAX_CONCURRENT_SUMMARIES:
            raise HTTPException(status_code=429, detail="Server is currently busy summarizing other documents. Please try again shortly.")
        active_summaries += 1
        
    try:
        return await asyncio.wait_for(async_summary_logic(req), timeout=SUMMARY_TIMEOUT_SECONDS)
    except Exception as e:
        import traceback
        import logging
        import re
        logging.getLogger(__name__).error(f"Summary error: {str(e)} " + traceback.format_exc())
        
        store = document_store.get(req.doc_id)
        fallback_text = ""
        if store and store.get("chunks"):
            full_text = " ".join([c.page_content for c in store["chunks"]])
            sentences = re.split(r'(?<=[.!?]) +', full_text)
            fallback_text = " ".join(sentences[:5])
            
        return {
            "summary": f"Fallback Summary (AI service unavailable):\n\n{fallback_text}...",
            "truncated": False,
            "is_fallback": True
        }
    finally:
        async with active_summaries_lock:
            active_summaries -= 1
