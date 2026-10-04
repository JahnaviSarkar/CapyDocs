import os
from langchain_ollama import ChatOllama

def get_llm():
    model_name = os.getenv("OLLAMA_MODEL", "gemma4:cloud")
    return ChatOllama(model=model_name)

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
