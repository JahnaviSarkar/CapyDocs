from fastapi.testclient import TestClient
from app.main import app, get_client_ip, TRUST_PROXY
import pytest
from fastapi import Request

class MockRequest:
    def __init__(self, headers=None, client_host="127.0.0.1"):
        self.headers = headers or {}
        class Client:
            host = client_host
        self.client = Client()

def test_get_client_ip():
    # Test without proxy trust
    req1 = MockRequest(headers={"X-Forwarded-For": "10.0.0.1, 192.168.1.1"}, client_host="127.0.0.1")
    # If TRUST_PROXY is false (default in tests if not set), it should return client host
    # Wait, TRUST_PROXY is imported from main, let's mock it if we can or just test the logic directly.
    import app.main
    app.main.TRUST_PROXY = False
    assert get_client_ip(req1) == "127.0.0.1"

    # Test with proxy trust
    app.main.TRUST_PROXY = True
    assert get_client_ip(req1) == "10.0.0.1"

    req2 = MockRequest(headers={}, client_host="127.0.0.1")
    assert get_client_ip(req2) == "127.0.0.1"

def test_summary_timeout():
    # Mock a slow LLM
    import time
    from unittest.mock import patch
    from fastapi.testclient import TestClient
    from app.main import app as my_app
    import app.main as main_module
    
    # Temporarily set timeout to a small value
    old_timeout = main_module.SUMMARY_TIMEOUT_SECONDS
    main_module.SUMMARY_TIMEOUT_SECONDS = 1
    
    main_module.document_store["fake_doc"] = {"chunks": []}
    
    def slow_llm(*args, **kwargs):
        time.sleep(2)
        return "Slow response"
        
    with patch("app.main.get_llm") as mock_get_llm:
        mock_llm = type("MockLLM", (), {"invoke": slow_llm})()
        mock_get_llm.return_value = mock_llm
        
        with patch("app.main.generate_summary", side_effect=slow_llm):
            client = TestClient(my_app)
            response = client.post("/summary", json={"doc_id": "fake_doc", "purpose": "general"})
            
            assert response.status_code == 200
            assert response.json()["is_fallback"] is True
            assert "AI service unavailable" in response.json()["summary"]
            
    # Restore
    main_module.SUMMARY_TIMEOUT_SECONDS = old_timeout
    del main_module.document_store["fake_doc"]
