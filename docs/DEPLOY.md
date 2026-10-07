# Deployment Guide

Follow these exact settings to deploy CapyDocs to Render (Backend) and Vercel (Frontend).

## Step 1: Deploy Backend (Render)
1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile` (relative to the root directory)
   - **Docker Context**: `.`
   - **Plan**: Free
   - **Health Check Path**: `/health`
4. Add the following **Environment Variables**:
   - `LLM_PROVIDER`: `groq`
   - `LLM_MODEL`: `llama-3.3-70b-versatile`
   - `GROQ_API_KEY`: (Enter your secret key)
   - `EMBEDDING_BACKEND`: `bm25`
   - `TRUST_PROXY`: `true`
   - `CORS_ORIGINS`: `[Vercel URL]` *(You will update this later after Vercel deployment)*
   - `MAX_UPLOADS_PER_HOUR`: `10`
   - `MAX_CHATS_PER_HOUR`: `50`
   - `MAX_SUMMARIES_PER_HOUR`: `5`
   - `MAX_PAGE_COUNT`: `50`
   - `MAX_CONCURRENT_SUMMARIES`: `2`
   - `REQUEST_TIMEOUT`: `60`
5. Click **Deploy Web Service**. Wait for the build to finish and copy your live Render URL (e.g., `https://capydocs.onrender.com`).

## Step 2: Deploy Frontend (Vercel)
1. Import your GitHub repository into Vercel.
2. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add the following **Environment Variables**:
   - `VITE_API_URL`: (Paste your live Render URL here, with NO trailing slash, e.g., `https://capydocs.onrender.com`)
4. Click **Deploy**. Copy your live Vercel URL once finished.

## Step 3: Finalize CORS
1. Go back to your **Render Dashboard** -> Environment Variables.
2. Update `CORS_ORIGINS` to include your new Vercel URL (e.g., `[Vercel URL]`).
3. Save changes. Render will automatically redeploy the backend with the new CORS rules.
