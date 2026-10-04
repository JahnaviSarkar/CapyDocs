# Evaluation Results

| Question | Expected Concept/Feature | Result / Notes |
| -------- | ------------------------ | -------------- |
| who is anita desai | Author identification | PASS. Accurately identified Anita Desai as author, cited pages 1, 8, 9, 13. |
| who is bhatia | Minor character recall | PASS. Described Bhatia as Varma's neighbor who bathes outdoors, cited page 7, 8, 9, 10. |
| what happened at the end | Ending summary | PASS. LLM correctly answered based on retrieved context, cited [1, 2, 3, 4, 11] as context. |
| Summary (whole document) | Map-reduce summarization | PASS. Successfully combined section summaries into a highly detailed and coherent plot summary. |
| Upload non-PDF | Error handling | PASS. Returned 400 "Only PDF files are supported." without stack trace. |
| Upload > 20MB | Error handling | PASS. Returned 400 "File size exceeds the 20MB limit." without stack trace. |
| Chat with fake doc_id | Error handling | PASS. Returned 404 "Document not found." without stack trace. |
