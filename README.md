# Summarix

> A full-stack text summarization playground comparing **extractive vs. abstractive** transformer models, with **ROUGE-1 / 2 / L** automatic evaluation.

**Abstractive:** BART (`sshleifer/distilbart-cnn-12-6`) · T5 (`t5-small`)  
**Extractive:** TextRank over TF-IDF cosine similarities (`networkx` + `scikit-learn`)

---

## Project overview

| Layer     | Tech                                     |
|-----------|------------------------------------------|
| Backend   | FastAPI, PyTorch, HuggingFace `transformers`, `rouge-score` |
| Frontend  | React 18, Vite, Tailwind CSS, Recharts, Axios |
| DevOps    | Dockerfile × 2, docker-compose network  |

Features:
- Single-method summarization via BART, T5, or TextRank.
- **Compare All** mode: runs all three on the same input and renders a grouped bar chart of ROUGE-F1 scores when a reference summary is supplied.
- Documents longer than each model's context window (BART: 1024, T5: 512) are automatically chunked with sentence overlap and the per-chunk summaries merged.
- Models are cached at import and re-used across requests.

---

## Prerequisites

- **Python 3.10+** for the backend.
- **Node.js 18+** and npm for the frontend.
- (Optional) **Docker & Docker Compose** for containerized one-command startup.
- A decent internet connection on first run so `transformers` can download the model weights (~1.5GB total for distilBART + t5-small).

---

## Local setup

### Option 1 — Docker Compose (recommended)

```bash
docker compose up --build
```

Once both containers report ready:
- Backend health check: http://localhost:8000/health
- Frontend UI:            http://localhost:5173/

HuggingFace model weights are persisted to a Docker volume named `hf_cache` so restarts are instant.

### Option 2 — Manual run

#### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

First startup will download BART + T5 from HuggingFace — expect this to take a moment.

#### Frontend

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

Open http://localhost:5173/ in your browser.

---

## API reference

Base URL (default): `http://localhost:8000`

### `GET /health`

Simple liveness probe.

```
{ "status": "ok" }
```

### `GET /api/models`

Returns a description of each summarization method.

```json
{
  "bart": { "name": "BART (DistilBART-CNN)", "type": "abstractive", "description": "..." },
  "t5":   { "name": "T5 (t5-small)",         "type": "abstractive", "description": "..." },
  "extractive": { "name": "TextRank (TF-IDF)","type": "extractive", "description": "..." }
}
```

### `POST /api/summarize`

Run one summarization method.

**Request**
```json
{
  "text": "Your long document here…",
  "method": "bart",
  "reference_summary": "Optional human summary for ROUGE evaluation."
}
```

- `method` ∈ `bart`, `t5`, `extractive`.
- `reference_summary` is optional. If provided, a `rouge_scores` block is returned.

**Response — `SummaryResult`**
```json
{
  "method": "bart",
  "summary": "Generated summary text…",
  "rouge_scores": {
    "rouge1": { "precision": 0.55, "recall": 0.62, "fmeasure": 0.58 },
    "rouge2": { "precision": 0.31, "recall": 0.35, "fmeasure": 0.33 },
    "rougeL": { "precision": 0.50, "recall": 0.56, "fmeasure": 0.53 }
  }
}
```

### `POST /api/compare`

Run **all three** methods against the same text. The request body matches `/api/summarize` (the `method` field is ignored).

**Response — `CompareResponse`**
```json
{
  "results": [
    { "method": "bart",       "summary": "...", "rouge_scores": { ... } },
    { "method": "t5",         "summary": "...", "rouge_scores": { ... } },
    { "method": "extractive", "summary": "...", "rouge_scores": { ... } }
  ],
  "processing_time_ms": 4321.18
}
```

---

## Deployment notes

### Backend (Render / Railway / fly.io)

1. Point the platform at the `backend/` directory and use the included `Dockerfile`.
2. Set the environment variables:
   - `FRONTEND_ORIGIN` = the public URL of your deployed frontend (CORS allow-list).
   - Any worker with ≥4 GB RAM works for the distilBART + t5-small combo; GPU is optional and auto-detected via `torch.cuda.is_available()`.
3. First cold start downloads models — expect 30–60 s. Subsequent boots reuse the HuggingFace cache if the platform persists `/app/.cache/huggingface`.

### Frontend (Vercel / Netlify / Cloudflare Pages)

1. Root directory: `frontend`.
2. Build command: `npm run build`. Output directory: `dist`.
3. **Critical env var:**
   ```
   VITE_API_BASE_URL = https://your-backend.onrender.com
   ```
   (Must be set at **build time** — Vite embeds `import.meta.env.VITE_*` values into the static bundle.)

---

## File layout

```
Summarix/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, /health
│   ├── schemas.py               # Pydantic request/response models
│   ├── models/
│   │   ├── __init__.py
│   │   ├── abstractive.py       # BART + T5, cached loaders, doc chunking
│   │   └── extractive.py        # TextRank over TF-IDF cosine similarity
│   ├── services/
│   │   ├── __init__.py
│   │   ├── evaluate.py          # compute_rouge() via rouge_score
│   │   └── preprocess.py        # clean_text(), chunk_text()
│   ├── routers/
│   │   ├── __init__.py
│   │   └── summarize.py         # /api/summarize, /api/compare, /api/models
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/summarize.js     # fetchSummary / fetchComparison wrappers
│   │   ├── components/
│   │   │   ├── TextInput.jsx    # Document + reference textareas, sample loader
│   │   │   ├── ModelSelector.jsx
│   │   │   ├── SummaryCard.jsx  # Method badge, summary, ROUGE table, copy btn
│   │   │   └── RougeChart.jsx   # Grouped Recharts ROUGE-F1 bar chart
│   │   ├── App.jsx              # State container & orchestration
│   │   ├── App.css
│   │   ├── index.css            # Tailwind directives
│   │   └── main.jsx             # React entrypoint
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```
