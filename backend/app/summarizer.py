def generate_summary(llm, chunks, purpose="general"):
    purpose_prompt = ""
    if purpose == "student":
        purpose_prompt = "Keep it simple and study-friendly."
    elif purpose == "work":
        purpose_prompt = "Keep it concise and professional."
    elif purpose == "research":
        purpose_prompt = "Keep it detailed and academic."
        
    section_summaries = []
    for chunk in chunks:
        prompt = f"Summarize the following text concisely. {purpose_prompt}\n\n{chunk.page_content}"
        res = llm.invoke(prompt)
        section_summaries.append(res.content)
    
    combined = "\n".join(section_summaries)
    final_prompt = f"Create a cohesive final summary from these section summaries. {purpose_prompt}\n\n{combined}"
    final_res = llm.invoke(final_prompt)
    return final_res.content
