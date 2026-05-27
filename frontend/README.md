# VedaAI — Assessment Studio

VedaAI is a full-stack web app that helps teachers **create structured, exam-style question papers** with AI. Define subject, class, question types, marks, and optional reference material — Gemini generates a formatted paper you can preview in the browser and **download as PDF**.

Built for the VedaAI hiring assignment: Next.js 14, TypeScript, MongoDB, Google Gemini, and a mobile-responsive UI.

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

Single **Next.js 14** app with API Route Handlers — deployable on Vercel without a separate server.

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

Optionally point the UI at an external Express API via `NEXT_PUBLIC_API_URL` (BullMQ + Socket.io).

---

## Project structure

```
src/
├── app/                    # Pages & API route handlers
│   ├── assignments/        # List, create, result
│   └── api/                # REST + internal generate
├── components/             # UI (layout, cards, forms)
└── lib/
    ├── api.ts              # Client fetch helpers
    ├── assignmentStore.ts  # Zustand state
    └── server/             # DB, Gemini, PDF, generation
```

---

## Prerequisites

- **Node.js** 18+ (20 recommended)
- **MongoDB** — [Atlas](https://www.mongodb.com/atlas) or local (`mongodb://localhost:27017/vedaai`)
- **Gemini API key** — [Google AI Studio](https://aistudio.google.com/apikey)

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/310511/VEDAAI.git
cd VEDAAI
npm install
```

### 2. Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/vedaai
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
INTERNAL_API_SECRET=dev-secret-change-in-production
```

### 3. MongoDB

Use **MongoDB Atlas** (recommended for Vercel), or run MongoDB locally:

```bash
docker run -d -p 27017:27017 --name vedaai-mongo mongo:7.0.14
```

### 4. Run

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

**Clean restart** (fixes stale `.next` errors):

```bash
npm run dev:clean
```

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | e.g. `gemini-2.5-flash`, `gemini-1.5-flash` |
| `INTERNAL_API_SECRET` | Yes (prod) | Secret for `/api/internal/generate/[id]` |
| `NEXT_PUBLIC_API_URL` | No | External API base URL (optional Express backend) |
| `NEXT_PUBLIC_WS_URL` | No | Socket.io URL (optional Express backend) |

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/assignments` | List assignments |
| `POST` | `/api/assignments` | Create assignment (multipart + optional file) |
| `GET` | `/api/assignments/:id` | Get assignment |
| `DELETE` | `/api/assignments/:id` | Delete |
| `GET` | `/api/assignments/:id/result` | Paper JSON or `{ ready: false, status }` |
| `GET` | `/api/assignments/:id/result/pdf` | Download **PDF** |
| `POST` | `/api/assignments/:id/regenerate` | Regenerate paper |
| `POST` | `/api/internal/generate/:id` | Background generation (authorized) |

---

## Deploy to Vercel

1. Import this repo in [Vercel](https://vercel.com) (framework: Next.js).
2. Set environment variables: `MONGODB_URI` (Atlas), `GEMINI_API_KEY`, `INTERNAL_API_SECRET`, optional `GEMINI_MODEL`.
3. Deploy. See `vercel.json` for function timeouts (generate route up to 300s).

**Notes:** PDF uses PDFKit (serverless-safe). Status updates use **polling** on the result page.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run dev:clean` | Remove `.next` and start dev |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

---

## Tech stack

Next.js 14 · TypeScript · Tailwind CSS · Zustand · MongoDB · Mongoose · Google Gemini · PDFKit

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot find module './XXX.js'` | `npm run dev:clean` |
| `ECONNREFUSED 27017` | Start MongoDB or fix `MONGODB_URI` |
| Gemini 429 / quota | Try another `GEMINI_MODEL` |
| Generation stuck | **Regenerate** on the result page |

---

## License

Private / assignment project — add a license if you open-source the repo.
