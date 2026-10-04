# CapyDocs
Chat with your PDFs. An open-source RAG app with Papr the capybara.

## Running the Terminal Version
```bash
python chat_pdf.py path/to/pdf.pdf
```

## Running the Servers

The easiest way to start both the frontend and backend simultaneously is to use the provided start script:

```bash
.\start-dev.ps1
```

Alternatively, you can run them manually:
1. Activate your virtual environment:
   - **Windows:** `.\.venv\Scripts\activate`
   - **Mac/Linux:** `source .venv/bin/activate`
2. Install dependencies: `pip install -r backend/requirements.txt`
3. Change to the backend directory: `cd backend`
4. Run the server: `uvicorn app.main:app --reload`
5. Visit `http://localhost:8000/docs` to see the auto-generated API documentation and test the endpoints (`/upload`, `/chat`, `/summary`).
