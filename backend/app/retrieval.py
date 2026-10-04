from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings
from rank_bm25 import BM25Okapi

class Retriever:
    def __init__(self, chunks):
        self.chunks = chunks
        self.embeddings = OllamaEmbeddings(model="nomic-embed-text")
        self.vectorstore = FAISS.from_documents(chunks, self.embeddings)
        self.faiss_retriever = self.vectorstore.as_retriever(search_kwargs={"k": 10})
        
        tokenized_corpus = [doc.page_content.lower().split() for doc in chunks]
        self.bm25 = BM25Okapi(tokenized_corpus)

    def retrieve(self, question):
        vector_docs = self.faiss_retriever.invoke(question)
        
        query_tokens = question.lower().split()
        bm25_scores = self.bm25.get_scores(query_tokens)
        top_bm25_indices = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)[:10]
        bm25_docs = [self.chunks[i] for i in top_bm25_indices]
        
        def rrf_score(doc_list):
            return {doc.page_content: idx for idx, doc in enumerate(doc_list)}
            
        vector_ranks = rrf_score(vector_docs)
        bm25_ranks = rrf_score(bm25_docs)
        
        all_unique_docs = {doc.page_content: doc for doc in vector_docs + bm25_docs}
        
        # Positional heuristics
        q_lower = question.lower()
        if any(word in q_lower for word in ['end', 'last', 'finally', 'conclusion']):
            for doc in self.chunks[-3:]:
                all_unique_docs[doc.page_content] = doc
        if any(word in q_lower for word in ['beginning', 'start', 'first']):
            for doc in self.chunks[:3]:
                all_unique_docs[doc.page_content] = doc
                
        fused_scores = {}
        for content in all_unique_docs:
            score = 0
            if content in vector_ranks:
                score += 1 / (60 + vector_ranks[content])
            if content in bm25_ranks:
                score += 1 / (60 + bm25_ranks[content])
            
            # Boost score if they match positional heuristics
            if any(word in q_lower for word in ['end', 'last', 'finally', 'conclusion']):
                if all_unique_docs[content] in self.chunks[-3:]:
                    score += 10.0 # Huge boost
            if any(word in q_lower for word in ['beginning', 'start', 'first']):
                if all_unique_docs[content] in self.chunks[:3]:
                    score += 10.0 # Huge boost
                    
            fused_scores[content] = score
            
        ranked_docs = sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
        relevant_docs = [all_unique_docs[content] for content, score in ranked_docs[:5]]
        return relevant_docs
