def generate_summary(llm, chunks):
    section_summaries = []
    for chunk in chunks:
        prompt = f"Summarize the following text concisely:\n\n{chunk.page_content}"
        res = llm.invoke(prompt)
        section_summaries.append(res.content)
    
    combined = "\n".join(section_summaries)
    final_prompt = f"Create a cohesive final summary from these section summaries:\n\n{combined}"
    final_res = llm.invoke(final_prompt)
    return final_res.content
