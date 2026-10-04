# CapyDocs
Chat with your PDFs. An open-source RAG app with Papr the capybara.

## Running the Terminal Version
```bash
python chat_pdf.py path/to/pdf.pdf
```

## Running the Backend Server
The backend is a FastAPI server located in the `backend/` directory.

1. Activate your virtual environment:
   - **Windows:** `.\.venv\Scripts\activate`
   - **Mac/Linux:** `source .venv/bin/activate`
2. Install dependencies: `pip install -r backend/requirements.txt`
3. Change to the backend directory: `cd backend`
4. Run the server: `uvicorn app.main:app --reload`
5. Visit `http://localhost:8000/docs` to see the auto-generated API documentation and test the endpoints (`/upload`, `/chat`, `/summary`).
