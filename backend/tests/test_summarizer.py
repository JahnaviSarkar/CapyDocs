import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from app.summarizer import generate_summary, RateLimitException

class MockChunk:
    def __init__(self, content):
        self.page_content = content

@pytest.fixture
def mock_llm():
    llm = MagicMock()
    llm.ainvoke = AsyncMock()
    return llm

@pytest.mark.asyncio
async def test_generate_summary_retry_success(mock_llm):
    # Setup mock to fail twice with 429, then succeed
    mock_success_res = MagicMock()
    mock_success_res.content = "Success"
    
    mock_llm.ainvoke.side_effect = [
        Exception("429 rate limit reached"),
        Exception("429 rate limit reached"),
        mock_success_res
    ]
    
    chunks = [MockChunk("test chunk")]
    
    # We can't mock tenacity easily without patching time, but since min wait is 2, it will take ~6 seconds to run.
    # To speed up tests, we can patch tenacity sleep or just let it run if it's quick enough.
    with patch('app.summarizer.wait_exponential', return_value=lambda rs: 0.01):
        # We need to reload the module or just accept the test will take ~6 seconds.
        # For simplicity, we just run it. 
        # Actually, wait_exponential is evaluated at import time by the decorator. 
        # We can mock asyncio.sleep instead.
        with patch('asyncio.sleep', new_callable=AsyncMock):
            result, truncated = await generate_summary(mock_llm, chunks)
            
    assert result == "Success"
    assert mock_llm.ainvoke.call_count == 3
    assert not truncated

@pytest.mark.asyncio
async def test_generate_summary_concurrency(mock_llm):
    # Create chunks to form multiple batches (>3000 chars each)
    chunks = [MockChunk("a" * 3100) for _ in range(5)]
    
    mock_res = MagicMock()
    mock_res.content = "batch summary"
    mock_llm.ainvoke.return_value = mock_res
    
    # Track concurrency
    active_calls = 0
    max_active_calls = 0
    
    async def mock_ainvoke(*args, **kwargs):
        nonlocal active_calls, max_active_calls
        active_calls += 1
        max_active_calls = max(max_active_calls, active_calls)
        await asyncio.sleep(0.1)
        active_calls -= 1
        return mock_res
        
    mock_llm.ainvoke.side_effect = mock_ainvoke
    
    with patch('app.summarizer.SUMMARY_CONCURRENCY', 2):
        await generate_summary(mock_llm, chunks)
        
    # The max active calls during the map phase should be exactly 2
    # Plus possibly the final reduce step, but that happens after map is done.
    assert max_active_calls == 2

@pytest.mark.asyncio
async def test_generate_summary_truncation(mock_llm):
    chunks = [MockChunk("word " * 50) for _ in range(100)]
    mock_res = MagicMock()
    mock_res.content = "summary"
    mock_llm.ainvoke.return_value = mock_res
    
    result, truncated = await generate_summary(mock_llm, chunks)
        
    assert truncated is True
