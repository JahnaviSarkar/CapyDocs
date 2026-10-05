import os
from langchain_groq import ChatGroq

def get_llm():
    # Use Groq's fast LLaMA 3 or Gemma models, defaulting to llama3-8b-8192
    model_name = os.getenv("GROQ_MODEL") or os.getenv("OLLAMA_MODEL", "llama3-8b-8192")
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("OLLAMA_API_KEY")
    
    return ChatGroq(
        model=model_name,
        api_key=api_key
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
