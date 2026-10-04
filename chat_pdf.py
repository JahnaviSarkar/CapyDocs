import os
import sys
import warnings
from dotenv import load_dotenv

# Suppress warnings for a cleaner terminal
warnings.filterwarnings("ignore")

from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_ollama import ChatOllama
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rank_bm25 import BM25Okapi

# Load environment variables
load_dotenv()

def main():
    if len(sys.argv) < 2:
        print("Usage: python chat_pdf.py <path_to_pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f"Error: File '{pdf_path}' not found.")
        sys.exit(1)

    # 1. Load the PDF
    print(f"Loading {pdf_path}...")
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    # Dynamically detect and strip repeated headers/footers
    def remove_headers_footers(docs):
        if len(docs) <= 2:
            return docs
        from collections import Counter
        line_counts = Counter()
        for doc in docs:
            lines = set(line.strip() for line in doc.page_content.split('\n') if line.strip())
            for line in lines:
                line_counts[line] += 1
                
        # If a line appears on more than 50% of the pages, consider it a header/footer
        threshold = len(docs) * 0.5
        repeated_lines = {line for line, count in line_counts.items() if count > threshold}
        
        for doc in docs:
            filtered_lines = [
                line for line in doc.page_content.split('\n') 
                if line.strip() not in repeated_lines
            ]
            doc.page_content = '\n'.join(filtered_lines)
        return docs

    print("Cleaning headers and footers...")
    documents = remove_headers_footers(documents)

    # 2. Split into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)
    print(f"Split PDF into {len(chunks)} chunks.")

    # 3. Create Vector Store
    # We use a simple local HuggingFace embedding model (all-MiniLM-L6-v2) by default 
    # to avoid needing another Ollama model just for embeddings.
    print("Generating embeddings... (This might take a moment the first time to download the model)")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    try:
        vectorstore = FAISS.from_documents(chunks, embeddings)
    except Exception as e:
        print(f"Error creating embeddings: {e}")
        sys.exit(1)

    # We fetch top chunks using FAISS
    faiss_retriever = vectorstore.as_retriever(search_kwargs={"k": 10})

    # Keyword Search (BM25) setup
    print("Setting up Keyword Search (BM25)...")
    tokenized_corpus = [doc.page_content.lower().split() for doc in chunks]
    bm25 = BM25Okapi(tokenized_corpus)

    # 4. Initialize Ollama LLM
    model_name = os.getenv("OLLAMA_MODEL", "gemma4:cloud")
    print(f"Using Ollama model: {model_name}")
    try:
        llm = ChatOllama(model=model_name)
    except Exception as e:
        print(f"Error initializing Ollama: {e}")
        sys.exit(1)

    print("\nPDF loaded and ready! Type 'exit' or 'quit' to stop.")
    
    # 5. Chat Loop
    while True:
        try:
            question = input("\nAsk a question: ")
        except (KeyboardInterrupt, EOFError):
            break
            
        if question.lower() in ['exit', 'quit']:
            break
            
        if not question.strip():
            continue

        if question.lower() == 'summary':
            print("\nGenerating summary section by section (this may take a while)...")
            section_summaries = []
            for i, chunk in enumerate(chunks):
                print(f"Summarizing section {i+1}/{len(chunks)}...")
                prompt = f"Summarize the following text concisely:\n\n{chunk.page_content}"
                res = llm.invoke(prompt)
                section_summaries.append(res.content)
            
            print("\nCombining section summaries into final summary...")
            combined = "\n".join(section_summaries)
            final_prompt = f"Create a cohesive final summary from these section summaries:\n\n{combined}"
            final_res = llm.invoke(final_prompt)
            print("\nFinal Summary:")
            print(final_res.content)
            continue

        print("\nThinking...")
        
        # 1. Vector Search
        vector_docs = faiss_retriever.invoke(question)
        
        # 2. BM25 Keyword Search
        query_tokens = question.lower().split()
        bm25_scores = bm25.get_scores(query_tokens)
        top_bm25_indices = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)[:10]
        bm25_docs = [chunks[i] for i in top_bm25_indices]
        
        # 3. Reciprocal Rank Fusion (RRF)
        def rrf_score(doc_list):
            return {doc.page_content: idx for idx, doc in enumerate(doc_list)}
            
        vector_ranks = rrf_score(vector_docs)
        bm25_ranks = rrf_score(bm25_docs)
        
        all_unique_docs = {doc.page_content: doc for doc in vector_docs + bm25_docs}
        
        fused_scores = {}
        for content in all_unique_docs:
            score = 0
            if content in vector_ranks:
                score += 1 / (60 + vector_ranks[content])
            if content in bm25_ranks:
                score += 1 / (60 + bm25_ranks[content])
            fused_scores[content] = score
            
        ranked_docs = sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
        relevant_docs = [all_unique_docs[content] for content, score in ranked_docs[:5]]
        
        if not relevant_docs:
            print("Could not find relevant information in the PDF.")
            continue
            
        # Prepare context with explicit page numbers for the prompt
        context = ""
        for doc in relevant_docs:
            page_num = doc.metadata.get("page", 0) + 1
            context += f"[Page {page_num}]\n{doc.page_content}\n\n"
            
        prompt = f"""Use the following pieces of retrieved context to answer the question. 
If you don't know the answer, just say that you don't know. Do not use outside knowledge. 
Answer concisely. 
At the end of your answer, list the exact pages you used to form your answer in this format: "SOURCES: [page1, page2]". 
If you don't know the answer, do not list any sources.

Context:
{context}

Question: {question}

Answer:"""
        
        # Get response from Ollama
        try:
            response = llm.invoke(prompt)
            print("\nAnswer:")
            print(response.content)
        except Exception as e:
            print(f"\nError communicating with Ollama: {e}")
            print(f"Make sure Ollama is running and '{model_name}' is pulled (ollama pull {model_name})")

if __name__ == "__main__":
    main()
