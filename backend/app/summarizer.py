def generate_summary(llm, chunks, purpose="general"):
    purpose_prompt = ""
    if purpose == "student":
        purpose_prompt = "Keep it simple and study-friendly."
    elif purpose == "work":
        purpose_prompt = "Keep it concise and professional."
    elif purpose == "research":
        purpose_prompt = "Keep it detailed and academic."
        
    full_text = "\n".join([c.page_content for c in chunks])
    
    # Truncate to ~18,000 characters to safely stay under Groq's Free Tier 6,000 TPM limit
    if len(full_text) > 18000:
        full_text = full_text[:18000] + "... [Text truncated to prevent exceeding free AI limits]"
        
    prompt = f"Create a cohesive final summary of this document. {purpose_prompt}\n\nDocument text:\n{full_text}"
    
    final_res = llm.invoke(prompt)
    return final_res.content
