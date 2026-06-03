# nl-sql-rag

> Ask questions in plain English, get SQL queries executed against your database.

A production-ready RAG (Retrieval-Augmented Generation) pipeline that understands your database schema and converts natural language questions into SQL queries — then runs them.

**Live demo:** [nl-sql-rag.vercel.app](https://nl-sql-rag.vercel.app)

---

## How it works

```
User asks a question in plain English
        ↓
Backend embeds the question using Gemini Embedding
        ↓
ChromaDB finds the most relevant tables from your schema
        ↓
Gemini 2.5 Flash generates a SQL query using that context
        ↓
Query runs against your Supabase database
        ↓
Results returned to the user
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| Vector DB | ChromaDB (Chroma Cloud) |
| Embeddings | Gemini Embedding 001 |
| LLM | Gemini 2.5 Flash |
| Database | PostgreSQL via Supabase |
| Containerization | Docker + Docker Compose |
| Backend hosting | Railway |
| Frontend hosting | Vercel |

---

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Vercel        │  HTTPS  │   Railway        │
│   (Frontend)    │ ──────► │   (FastAPI)      │
│   React + Vite  │         │                  │
└─────────────────┘         └────────┬─────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                 ▼
             ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
             │ Chroma Cloud│ │  Supabase   │ │ Gemini API   │
             │ (Vectors)   │ │ (Postgres)  │ │ (LLM + Embed)│
             └─────────────┘ └─────────────┘ └──────────────┘
```

---

## Running Locally

### Prerequisites
- Docker Desktop installed and running
- API keys for Gemini, Supabase, and Chroma Cloud

### 1. Clone the repo
```bash
git clone https://github.com/yourname/nl-sql-rag
cd nl-sql-rag
```

### 2. Create your `.env` file inside `rag-fastapi/`
```bash
cp rag-fastapi/.env.example rag-fastapi/.env
```

Fill in your values:
```
DATABASE_URL=your_supabase_connection_string
GEMINI_API_KEY=your_gemini_api_key
CHROMA_API_KEY=your_chroma_cloud_api_key
```

### 3. Start everything
```bash
docker compose up --build
```

Backend runs at `http://localhost:8000`
Frontend runs at `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check backend status |
| POST | `/query` | Ask a question, get SQL + results |


---

## Project Structure

```
nl-sql-rag/
├── docker-compose.yml          # orchestrates all containers locally
├── rag-fastapi/                # backend
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                 # FastAPI app + endpoints
│   ├── embed_schema.py         # pulls schema from Supabase, embeds into ChromaDB
│   ├── rag.py                  # query logic, SQL generation, execution
│   └── .env.example
└── rag-fastapi-frontend/       # frontend
    ├── Dockerfile
    └── src/
```

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Backend | Supabase PostgreSQL connection string |
| `GEMINI_API_KEY` | Backend | Google Gemini API key |
| `CHROMA_API_KEY` | Backend | Chroma Cloud API key |
| `VITE_API_URL` | Frontend | Railway backend URL |

---

## Deployment

### Backend → Railway
1. Connect your GitHub repo to Railway
2. Set root directory to `rag-fastapi`
3. Add environment variables
4. Deploy — Railway auto-deploys on every `git push`

### Frontend → Vercel
1. Connect your GitHub repo to Vercel
2. Set root directory to `rag-fastapi-frontend`
3. Add `VITE_API_URL` environment variable
4. Deploy — Vercel auto-deploys on every `git push`

---
