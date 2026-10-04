# Evaluation Notes

## Positional Accuracy
- **Question**: "what happened at the end"
- **Result**: `{'answer': "The old man swept a bottle of tonic out of his son's hand, causing it to smash and splash thick brown syrup onto his son's white trousers. After his wife ran to him, the old man sank flat on his back, closed his eyes, and groaned, —God is calling me—now let me go.", 'pages_used': [12, 13]}`
- **Status**: **PASS**. The positional heuristics correctly boosted the final chunks, pulling the exact scene of the smashed bottle and Varma's final quote.

## Source Parsing & Em Dash Fixes
- **Question**: "who is anita desai"
- **Result**: `{'answer': 'Anita Desai is the author of "A Devoted Son."', 'pages_used': [1, 13]}`
- **Status**: **PASS**. The `SOURCES:` bracket was successfully parsed into the `pages_used` array and stripped from the final user-facing text. Em dashes are properly rendered.

## Error Handling
- **Action**: Uploading a `.txt` file or >20MB file.
- **Status**: **PASS**. Returns a friendly 400 JSON error.
- **Action**: Chatting with a fake `doc_id`.
- **Status**: **PASS**. Returns a friendly 404 JSON error.
