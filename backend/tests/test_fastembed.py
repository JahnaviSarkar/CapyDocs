import os
import pytest
from app.retrieval import Retriever
from langchain_core.documents import Document
import logging

def test_fastembed_retrieval(caplog):
    os.environ["EMBEDDING_BACKEND"] = "fastembed"
    chunks = [
        Document(page_content="Capybaras love swimming.", metadata={"page": 1}),
        Document(page_content="Apples are red.", metadata={"page": 2})
    ]
    with caplog.at_level(logging.INFO):
        retriever = Retriever(chunks)
        docs = retriever.retrieve("Do capybaras like water?")
        assert len(docs) > 0
        assert "Capybaras" in docs[0].page_content
        assert "Retriever initialized in mode: fastembed" in caplog.text
