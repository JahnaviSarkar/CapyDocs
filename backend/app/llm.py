import os
from langchain_ollama import ChatOllama

def get_llm():
    model_name = os.getenv("OLLAMA_MODEL", "gemma4:cloud")
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    api_key = os.getenv("OLLAMA_API_KEY")
    
    client_kwargs = {}
    if api_key:
        client_kwargs["headers"] = {"Authorization": f"Bearer {api_key}"}
        
    return ChatOllama(
        model=model_name,
        base_url=base_url,
        client_kwargs=client_kwargs
    )

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
    response = llm.invoke(prompt)
    return response.content
