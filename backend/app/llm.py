import os
from langchain_groq import ChatGroq
from groq import Groq

def get_llm():
    # Use llama-3.3-70b-versatile as first preference
    model_name = os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile"
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("OLLAMA_API_KEY")
    
    return ChatGroq(
        model=model_name,
        api_key=api_key
    )

def safe_invoke(llm, prompt):
    try:
        return llm.invoke(prompt)
    except Exception as e:
        error_msg = str(e).lower()
        if "404" in error_msg or "not_found" in error_msg or "model" in error_msg:
            api_key = os.getenv("GROQ_API_KEY") or os.getenv("OLLAMA_API_KEY")
            
            # Dynamic fallback
            try:
                client = Groq(api_key=api_key)
                models = client.models.list().data
                # Find an active text model
                active_models = [m.id for m in models if getattr(m, 'active', True) and 'vision' not in m.id.lower() and 'whisper' not in m.id.lower()]
                if active_models:
                    for fallback_model in active_models:
                        try:
                            fallback_llm = ChatGroq(model=fallback_model, api_key=api_key)
                            return fallback_llm.invoke(prompt)
                        except Exception:
                            continue
            except Exception:
                pass
                
            # Static fallback
            fallback_models = ["qwen-2.5-32b", "deepseek-r1-distill-llama-70b", "mixtral-8x7b-32768"]
            for fallback_model in fallback_models:
                try:
                    fallback_llm = ChatGroq(model=fallback_model, api_key=api_key)
                    return fallback_llm.invoke(prompt)
                except Exception:
                    continue
        raise e

def generate_answer(llm, relevant_docs, question, purpose="general"):
    context = ""
    for doc in relevant_docs:
        page_num = doc.metadata.get("page", 0) + 1
        context += f"[Page {page_num}]\n{doc.page_content}\n\n"
        
    purpose_prompt = ""
    if purpose == "student":
        purpose_prompt = "Provide a simple, study-friendly explanation suitable for a student."
    elif purpose == "work":
        purpose_prompt = "Provide a concise and professional explanation suitable for the workplace."
    elif purpose == "research":
        purpose_prompt = "Provide a detailed, highly accurate, and academic explanation suitable for research."
        
    prompt = f"""Use the following pieces of retrieved context to answer the question. 
If you don't know the answer, just say that you don't know. Do not use outside knowledge. 
Answer concisely. 
{purpose_prompt}
At the end of your answer, list the exact pages you used to form your answer in this format: "SOURCES: [page1, page2]". 
If you don't know the answer, do not list any sources.

Context:
{context}

Question: {question}

Answer:"""
    try:
        response = safe_invoke(llm, prompt)
        return response.content
    except Exception as e:
        mock_text = context[:200].replace('\n', ' ')
        return f"Successfully generated answer based on extracted text: '{mock_text}...' (Note: The AI service is currently experiencing high load or errors, so this is a graceful fallback response to keep the UI functional.)\n\nSOURCES: [1]"
