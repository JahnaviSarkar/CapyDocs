# PROJECT RULES

- Never commit .env, .venv, node_modules, test PDFs, or any API key. Before every commit, run git status and show me the file list.
- Commit after each finished feature with a clear message (feat:, fix:, chore:, docs:), then push.
- Work on one task at a time. Do not build things I did not ask for.
- Explain each new concept in plain language, as I am learning.
- After each task, give me: what changed, how to test it, and what is next.
- If a library import breaks, prefer small code of our own over fragile framework classes.
- Keep a docs/evaluation.md table of test questions and results.
- **Safe Process Handling**: NEVER kill processes by name (e.g., no `Stop-Process -Name` or `taskkill /IM`). Only stop the exact Process IDs (PIDs) that you have explicitly started yourself, and always specify which ones.
