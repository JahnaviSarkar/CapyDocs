import pytest
from app.pdf_loader import remove_headers_footers
from app.chunker import chunk_documents
from app.retrieval import Retriever
from langchain_core.documents import Document

def test_header_cleaner():
    docs = [
        Document(page_content="CapyDocs Header\nThis is page 1.\nFooter 1", metadata={"page": 0}),
        Document(page_content="CapyDocs Header\nThis is page 2.\nFooter 2", metadata={"page": 1}),
        Document(page_content="CapyDocs Header\nThis is page 3.\nFooter 3", metadata={"page": 2}),
    ]
    cleaned = remove_headers_footers(docs)
    assert "CapyDocs Header" not in cleaned[0].page_content
    assert "This is page 1." in cleaned[0].page_content

def test_chunker():
    doc = Document(page_content="A" * 2000, metadata={"page": 0})
    chunks = chunk_documents([doc])
    assert len(chunks) > 1

def test_retriever():
    # Mock chunks
    docs = [
        Document(page_content="Apple is a fruit.", metadata={"page": 0}),
        Document(page_content="Car is a vehicle.", metadata={"page": 0})
    ]
    retriever = Retriever(docs)
    res = retriever.retrieve("fruit")
    assert len(res) > 0
    assert "Apple" in res[0].page_content

def test_purpose_field_prompts():
    from app.llm import generate_answer
    from unittest.mock import MagicMock
    
    # Mock LLM
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = MagicMock(content="Mocked Answer")
    
    docs = [Document(page_content="Some context", metadata={"page": 0})]
    
    # Test 'student'
    generate_answer(mock_llm, docs, "What is this?", purpose="student")
    call_arg_student = mock_llm.invoke.call_args[0][0]
    assert "study-friendly explanation suitable for a student" in call_arg_student
    
    # Test 'work'
    generate_answer(mock_llm, docs, "What is this?", purpose="work")
    call_arg_work = mock_llm.invoke.call_args[0][0]
    assert "concise and professional explanation" in call_arg_work

def test_parse_answer_and_sources():
    from app.main import parse_answer_and_sources
    
    # Normal case
    raw = "The answer is X.\n\nSOURCES: [12, 13]"
    clean, pages = parse_answer_and_sources(raw)
    assert clean == "The answer is X."
    assert pages == [12, 13]
    
    # Missing sources bracket
    raw2 = "The answer is Y.\nSOURCES: 5"
    clean2, pages2 = parse_answer_and_sources(raw2)
    assert clean2 == "The answer is Y."
    assert pages2 == [] # Because it doesn't match the regex [..]
    
    # "don't know" case
    raw3 = "I don't know the answer.\nSOURCES: [1]"
    clean3, pages3 = parse_answer_and_sources(raw3)
    assert pages3 == []
    
    # Fix em dash
    raw4 = "She said, \ufffdHello!\ufffd \nSOURCES: [2]"
    clean4, pages4 = parse_answer_and_sources(raw4)
    assert clean4 == "She said, —Hello!—"
