import os
import sys
import warnings
from dotenv import load_dotenv

# Suppress warnings for a cleaner terminal
warnings.filterwarnings("ignore")

from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_ollama import ChatOllama
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

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

    # We fetch the top 3 most relevant chunks
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

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

        print("\nThinking...")
        
        # Retrieve relevant chunks from the PDF
        relevant_docs = retriever.invoke(question)
        
        if not relevant_docs:
            print("Could not find relevant information in the PDF.")
            continue
            
        # Extract context and page numbers
        context = ""
        pages = set()
        for doc in relevant_docs:
            context += doc.page_content + "\n\n"
            # PyPDFLoader is 0-indexed, so we add 1 for human-readable page numbers
            if "page" in doc.metadata:
                pages.add(doc.metadata["page"] + 1)
                
        # Create a prompt that forces the model to use only the provided context
        prompt = f"""Use the following pieces of retrieved context to answer the question. 
If you don't know the answer, just say that you don't know. 
Do not use outside knowledge. Answer concisely.

Context:
{context}

Question: {question}

Answer:"""
        
        # Get response from Ollama
        try:
            response = llm.invoke(prompt)
            print("\nAnswer:")
            print(response.content)
            
            # Show sources
            if pages:
                pages_str = ", ".join(str(p) for p in sorted(pages))
                print(f"\n[Source: Page(s) {pages_str}]")
        except Exception as e:
            print(f"\nError communicating with Ollama: {e}")
            print(f"Make sure Ollama is running and '{model_name}' is pulled (ollama pull {model_name})")

if __name__ == "__main__":
    main()
