# VedaAI — Assessment Studio

VedaAI is a full-stack web app that helps teachers **create structured, exam-style question papers** with AI. Define subject, class, question types, marks, and optional reference material — Gemini generates a formatted paper you can preview in the browser and **download as PDF**.

Built for the VedaAI hiring assignment: Next.js 14, TypeScript, MongoDB, Google Gemini, and a polished, mobile-responsive UI.

---

## Features

| Area | What you get |
|------|----------------|
| **Assignments** | List, search, filter by status (Ready, Generating, Draft, Failed), delete |
| **Create flow** | Two-step form: details + optional uploads; configurable question types (MCQ, Short, Diagram, etc.) |
| **AI generation** | Structured JSON → normalized sections, difficulty tags, marks, answer key |
| **Result view** | Exam-style preview with collapsible answer key |
| **PDF export** | Server-generated PDF (PDFKit), not raw HTML print |
| **Regenerate** | Re-run generation for the same assignment |
| **Responsive UI** | Desktop sidebar + mobile bottom tab bar; touch-friendly controls |

---

## Architecture

The **recommended path** is a single **Next.js 14** app (`frontend/`) with API Route Handlers — deployable on Vercel without a separate server.

```
┌──────────────────────────────────────────────────────────────────┐
│  Next.js 14 (App Router) — localhost:3000 / Vercel               │
│  ├── UI: /assignments, /assignments/create, /assignments/:id/result │
│  └── API: /api/assignments/*  +  /api/internal/generate/:id      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                ┌────────────▼────────────┐
                │  MongoDB (local/Atlas)  │
                └────────────┬────────────┘
                             │
                ┌────────────▼────────────┐
                │  Google Gemini API      │
                └─────────────────────────┘
```

**Optional** (local / advanced): `backend/` Express server with **BullMQ**, **Redis**, **Socket.io**, and Puppeteer-based PDF — point the frontend at it via `NEXT_PUBLIC_API_URL`.

---

## Repository layout

```
VEDAAI/
├── frontend/                 # Primary app (UI + API routes)
│   ├── src/app/              # Pages & route handlers
│   ├── src/components/       # UI components
│   ├── src/lib/              # Client API, Zustand store
│   └── src/lib/server/       # DB, Gemini, PDF, generation
├── backend/                  # Optional Express + worker + WebSocket
├── scripts/                  # Docker & local dev helpers
├── docker-compose.yml        # MongoDB (+ Redis profile)
└── vercel.json               # Root → frontend on Vercel
```

---

## Prerequisites

- **Node.js** 18+ (20 recommended)
- **npm**
- **MongoDB** — local via Docker, [Homebrew](https://brew.sh), or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Google AI Studio** API key — [Get a Gemini API key](https://aistudio.google.com/apikey)
- **Docker + Colima** (macOS, optional) — for `docker compose` MongoDB

---

## Quick start (recommended)

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd VEDAAI
```

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/vedaai
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
INTERNAL_API_SECRET=dev-secret-change-in-production
```

### 2. Start MongoDB

**Option A — helper script (Colima + Docker):**

```bash
./scripts/docker-up.sh
```

**Option B — manual:**

```bash
colima start   # if using Colima on macOS
docker compose up -d mongodb
```

**Option C — no Docker:** use Atlas URI in `MONGODB_URI`, or run `./scripts/mongo-brew.sh`.

### 3. Install and run

```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** → redirects to **Assignments**.

**One-liner from repo root:**

```bash
./scripts/dev-local.sh
```

Creates `.env.local` if missing, starts MongoDB when Docker is available, then `npm run dev`.

### Clean dev restart (fixes stale `.next` chunk errors)

```bash
cd frontend
npm run dev:clean
```

---

## Environment variables

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | Model id (e.g. `gemini-2.5-flash`, `gemini-1.5-flash`) |
| `INTERNAL_API_SECRET` | Yes (prod) | Secret for `/api/internal/generate/[id]` |
| `NEXT_PUBLIC_API_URL` | No | If set, UI calls this host instead of same-origin API (Express backend) |
| `NEXT_PUBLIC_WS_URL` | No | Socket.io URL when using Express backend |

### Backend (`backend/.env`) — optional split stack

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Same database as frontend |
| `REDIS_URL` | `redis://localhost:6379` for BullMQ |
| `GEMINI_API_KEY` | Gemini key |
| `GEMINI_MODEL` | Model id |
| `PORT` | Default `4000` |
| `FRONTEND_URL` | CORS origin, e.g. `http://localhost:3000` |

Copy from `backend/.env.example`. Redis: `docker compose --profile with-redis up -d`.

---

## API (Next.js route handlers)

Base URL: same origin as the app (e.g. `http://localhost:3000`) unless `NEXT_PUBLIC_API_URL` is set.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/assignments` | List assignments |
| `POST` | `/api/assignments` | Create assignment (multipart: form fields + optional file) |
| `GET` | `/api/assignments/:id` | Get assignment metadata |
| `DELETE` | `/api/assignments/:id` | Delete assignment |
| `GET` | `/api/assignments/:id/result` | Generated paper JSON, or `{ ready: false, status }` while pending |
| `GET` | `/api/assignments/:id/result/pdf` | Download question paper as **PDF** |
| `POST` | `/api/assignments/:id/regenerate` | Trigger new generation |
| `POST` | `/api/internal/generate/:id` | Background generation (requires `Authorization` / secret) |

---

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import in [Vercel](https://vercel.com). Root `vercel.json` sets **`rootDirectory`: `frontend`**.
3. Set environment variables in the Vercel project:

   - `MONGODB_URI` — **Atlas** (not localhost)
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (optional)
   - `INTERNAL_API_SECRET` — long random string

4. Deploy. Long-running generation uses `/api/internal/generate/[id]` (`maxDuration` 300s on Pro — see `frontend/vercel.json`).

**Production notes**

- Use MongoDB Atlas with network access allowed for Vercel.
- PDF generation uses **PDFKit** (no headless Chrome on serverless).
- The UI **polls** assignment status on Vercel; the optional Express path can use **WebSocket** instead.

---

## Optional: Express backend (local)

For BullMQ queues, Redis, and Socket.io live updates:

```bash
# Terminal 1 — MongoDB + Redis
docker compose --profile with-redis up -d

# Terminal 2 — API
cd backend && npm install && npm run dev

# Terminal 3 — Worker
cd backend && npm run worker

# Terminal 4 — Frontend (pointing at Express)
cd frontend
# In .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:4000
# NEXT_PUBLIC_WS_URL=http://localhost:4000
npm run dev
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `./scripts/docker-up.sh` | Start Colima if needed, pull `mongo:7.0.14`, run MongoDB |
| `./scripts/dev-local.sh` | MongoDB + install deps + `npm run dev` |
| `./scripts/colima-reset.sh` | Reset Colima when Docker image pulls fail |
| `./scripts/mongo-brew.sh` | Run MongoDB via Homebrew (no Docker) |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| State | Zustand (client), polling on result page |
| API (default) | Next.js Route Handlers |
| Database | MongoDB + Mongoose |
| AI | Google Gemini (`@google/generative-ai`) |
| PDF | PDFKit (Next.js path) / Puppeteer (optional backend) |
| Optional queue | BullMQ + Redis + Socket.io (`backend/`) |
| Local infra | Docker Compose |

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `Cannot find module './XXX.js'` (dev) | Stop dev server → `cd frontend && npm run dev:clean` |
| `ECONNREFUSED 27017` | Start MongoDB: `./scripts/docker-up.sh` or fix `MONGODB_URI` |
| Docker / Colima errors | `./scripts/colima-reset.sh` then `./scripts/docker-up.sh`, or use Atlas |
| Gemini 429 / quota | Change `GEMINI_MODEL` (e.g. `gemini-2.5-flash` or `gemini-1.5-flash`) |
| Generation stuck | Use **Regenerate** on the result page, or `POST .../regenerate` |
| Port 3000 in use | Next.js picks 3001, 3002, … — check terminal output |
| EMFILE / watcher errors (macOS) | `WATCHPACK_POLLING=true` is already set in `npm run dev` |

---

## Development

```bash
cd frontend
npm run lint      # ESLint
npm run build     # Production build
npm run start     # Serve production build locally
```

---

## License

Private / assignment project — add your license if you open-source the repo.

---

## Acknowledgements

Built for the **VedaAI Full Stack Engineering** assignment: structured AI assessments, PDF export, and production-minded deployment on Vercel.
