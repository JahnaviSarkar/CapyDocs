import os
import asyncio
import logging
import psutil
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

logger = logging.getLogger(__name__)

SUMMARY_MAX_CHUNKS = int(os.getenv("SUMMARY_MAX_CHUNKS", "50"))
SUMMARY_CONCURRENCY = int(os.getenv("SUMMARY_CONCURRENCY", "2"))

class RateLimitException(Exception):
    pass

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True
)
async def _safe_ainvoke(llm, prompt):
    try:
        return await llm.ainvoke(prompt)
    except Exception as e:
        if "429" in str(e) or "rate limit" in str(e).lower() or "too many" in str(e).lower():
            logger.warning("Rate limit hit during summarization, backing off...")
            raise RateLimitException(str(e))
        raise

async def generate_summary(llm, chunks, purpose="general"):
    process = psutil.Process(os.getpid())
    mem_start = process.memory_info().rss / 1024 / 1024
    
    purpose_prompt = ""
    if purpose == "student":
        purpose_prompt = "Keep it simple and study-friendly."
    elif purpose == "work":
        purpose_prompt = "Keep it concise and professional."
    elif purpose == "research":
        purpose_prompt = "Keep it detailed and academic."
        
    truncated = False
    if len(chunks) > SUMMARY_MAX_CHUNKS:
        chunks = chunks[:SUMMARY_MAX_CHUNKS]
        truncated = True

    batches = []
    current_batch = []
    current_len = 0
    for chunk in chunks:
        l = len(chunk.page_content)
        if current_len + l > 3000 and current_batch:
            batches.append("\n".join(current_batch))
            current_batch = [chunk.page_content]
            current_len = l
        else:
            current_batch.append(chunk.page_content)
            current_len += l
    if current_batch:
        batches.append("\n".join(current_batch))

    sem = asyncio.Semaphore(SUMMARY_CONCURRENCY)
    
    async def process_batch(batch_text):
        async with sem:
            prompt = f"Summarize the following text concisely. {purpose_prompt}\n\n{batch_text}"
            res = await _safe_ainvoke(llm, prompt)
            return res.content

    try:
        if len(batches) == 1:
            # Skip map step if only one batch
            final_prompt = f"Create a cohesive final summary of this document. {purpose_prompt}\n\nDocument text:\n{batches[0]}"
            final_res = await _safe_ainvoke(llm, final_prompt)
            final_text = final_res.content
        else:
            section_summaries = await asyncio.gather(*(process_batch(b) for b in batches))
            combined = "\n".join(section_summaries)
            final_prompt = f"Create a cohesive final summary from these section summaries. {purpose_prompt}\n\n{combined}"
            final_res = await _safe_ainvoke(llm, final_prompt)
            final_text = final_res.content
    except Exception as e:
        logger.error("Error during summarization", exc_info=True)
        raise e

    mem_end = process.memory_info().rss / 1024 / 1024
    logger.info(f"Summary peak memory: start={mem_start:.2f}MB, end={mem_end:.2f}MB")
    
    return final_text, truncated

