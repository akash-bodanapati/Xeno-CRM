# Xeno Mini CRM

An AI-native Mini CRM built for the Xeno SDE Internship Assignment 2026. Helps consumer brands intelligently reach their shoppers through data-driven segmentation, personalised campaigns, and a two-service async delivery architecture.

---

## What This Is

A marketing CRM — not a sales or support CRM. Built for a fictional coffee brand (Brew & Bean) to demonstrate customer segmentation, campaign dispatch, delivery simulation, and AI-assisted workflows.

---

## Architecture

```
┌─────────────┐     HTTP      ┌─────────────────┐
│   Frontend  │ ────────────► │    Backend CRM   │
│  React/Vite │               │  Express + Node  │
│  Port 5173  │               │    Port 3001     │
└─────────────┘               └────────┬─────────┘
                                       │ POST /send
                                       ▼
                              ┌─────────────────┐
                              │ Channel Service  │
                              │ Express + Node   │
                              │    Port 3002     │
                              └────────┬─────────┘
                                       │ POST /api/callbacks/delivery
                                       ▼
                              ┌─────────────────┐
                              │  Backend CRM     │
                              │ (receipt ingest) │
                              └─────────────────┘
```

Three independently running services:
- **Frontend** — React SPA, Vite, Tailwind CSS, TanStack Query
- **Backend CRM** — Express, TypeScript, Supabase (PostgreSQL)
- **Channel Service** — Express, TypeScript, async delivery simulator

---

## AI Integration

Powered by Groq (Llama 3.3 70B). AI is woven into four core workflows:

- **Segment Suggestion** — describe your audience in plain English, AI generates filter rules and previews real customer count
- **Message Drafting** — AI writes personalised channel copy per campaign
- **Stats Interpretation** — AI explains campaign performance in plain language
- **Tara (AI Assistant)** — conversational assistant that can create segments, draft messages, and surface insights via natural language

---

## Project Structure

```
Xeno-CRM/
├── backend/              # CRM API server
│   ├── src/
│   │   ├── routes/       # customers, orders, segments, campaigns, callbacks, ai, analytics
│   │   ├── services/     # supabase client, groq AI client, channel service caller
│   │   ├── middleware/   # error handler, shared secret validation
│   │   ├── utils/        # segment filter engine, stats aggregator
│   │   └── types/        # shared TypeScript types
│   ├── schema.sql        # full database schema
│   ├── seed.sql          # seed data reference
│   └── .env.example      # required environment variables
│
├── channel-service/      # Standalone async delivery simulator
│   ├── src/
│   │   ├── routes/       # send, bulk, health
│   │   ├── services/     # delivery simulator with retries and callbacks
│   │   └── types/
│   └── .env.example
│
├── frontend/             # React SPA
│   ├── src/
│   │   ├── pages/        # Dashboard, Campaigns, Segments, Customers, Analytics, AI Assistant
│   │   ├── components/   # layout, shared UI, shadcn components
│   │   └── api/          # typed API clients per resource
│   └── .env.example
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- A Groq API key (free at console.groq.com)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/Xeno-CRM.git
cd Xeno-CRM
```

### 2. Set up environment variables

Copy the example files and fill in your values:
```bash
cp backend/.env.example backend/.env
cp channel-service/.env.example channel-service/.env
cp frontend/.env.example frontend/.env
```

### 3. Set up the database

Run `backend/schema.sql` in your Supabase SQL editor to create all tables.

Optionally run `backend/seed.sql` or hit `POST /api/seed` after starting the backend to populate demo data.

### 4. Install dependencies

```bash
cd backend && npm install
cd ../channel-service && npm install
cd ../frontend && npm install
```

### 5. Run all three services

Open three terminals:

**Terminal 1 — Backend CRM**
```bash
cd backend
npm run dev
# Running on http://localhost:3001
```

**Terminal 2 — Channel Service**
```bash
cd channel-service
npm run dev
# Running on http://localhost:3002
```

**Terminal 3 — Frontend**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/seed | Seed demo customers and orders |
| GET | /api/customers | List all customers |
| POST | /api/segments | Create a segment |
| POST | /api/campaigns | Create a campaign |
| POST | /api/campaigns/:id/send | Launch a campaign |
| GET | /api/campaigns/:id/stats | Get campaign performance stats |
| POST | /api/callbacks/delivery | Receive delivery receipts from channel service |
| POST | /api/ai/suggest-segment | AI segment suggestion |
| POST | /api/ai/draft-message | AI message drafting |
| POST | /api/ai/interpret-stats | AI stats interpretation |
| POST | /api/ai/chat | Conversational AI assistant (Tara) |

---

## Environment Variables

See `.env.example` in each service folder for the full list of required variables.

---

## Deployment

Each service deploys independently. Recommended platforms:
- **Backend + Channel Service** — Render (set env vars in dashboard)
- **Frontend** — Vercel (set `VITE_API_URL` to deployed backend URL)

When deploying, update these variables to point to live URLs instead of localhost:
- `CHANNEL_SERVICE_URL` in backend env
- `CRM_CALLBACK_URL` in channel-service env
- `VITE_API_URL` in frontend env

---
