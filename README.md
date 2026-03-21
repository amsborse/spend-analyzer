# Spend Analyzer

Personal finance analysis tool: upload transaction CSVs, normalize and categorize, and explore spending with dashboards and drill-down.

## Folder structure

```
spend-analyzer/
├── backend/       # FastAPI API (Python)
├── frontend/      # React + Vite UI
├── ai_features/   # AI skills, prompts, future AI features
├── documents/     # Design doc, wiki, SOPs
├── infra/         # Docker, scripts
├── docker-compose.yml
└── README.md
```

## Run with Docker (recommended — one command)

From the `spend-analyzer` folder (where `docker-compose.yml` lives):

```bash
docker compose up --build
```

- **Web UI:** http://localhost:8080  
- **API:** http://localhost:8000  
- **API docs:** http://localhost:8000/docs  

The SQLite database is stored in a Docker volume (`spend_db`) so data persists across restarts.

To stop: `Ctrl+C` or `docker compose down`.

---

## Run locally (without Docker)

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API: http://127.0.0.1:8000  
Docs: http://127.0.0.1:8000/docs  

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173  

## Design

See [documents/design-doc.md](documents/design-doc.md) for the V1 design outline.
