import os
from langchain_community.document_loaders import PyPDFLoader

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

def load_and_clean_pdf(file_path):
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    return remove_headers_footers(documents)
