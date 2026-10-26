# 🪔 Utsav — Your AI Celebration Planner

> PromptWars Virtual · Challenge 5 (Celebration & Event Planner) · Powered by the Gemini API

A _utsav_ is the festive garland hung across the doorway when a celebration is about to begin. **Utsav** is the doorway to your event. You answer six quick questions (event type, date, budget, guests, city, culture) and Gemini drafts a full plan you can edit: a budget split, a countdown timeline, a vendor checklist and personalized ideas. It all lives on one dashboard, and a chat assistant knows your plan.

**Live demo:** `<add Vercel URL>` · **Demo video:** `<add link>`

---

## The Problem

Event planning in India is scattered across tools. Budgets sit in Excel, timelines in WhatsApp, vendor numbers in phone notes and inspiration on Instagram. A 300-guest Kerala wedding and a 25-kid birthday party need completely different plans, but checklist apps give everyone the same template.

Utsav uses GenAI as the **planner** instead of a template. The plan is generated from your real constraints: budget tier, guest count, city, culture and days left.

## Features → Challenge Requirements

| #   | Requirement            | What Utsav does                                                                                                                                                                      |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Budget**             | AI splits the budget into categories in ₹. You can edit the split, and it re-balances to 100%. You log expenses, see allocated-vs-spent charts and get an overspend alert.            |
| 2   | **Timeline**           | A countdown ("42 days to go"). Tasks are generated between today and the event date and grouped by phase, with check-off and a progress bar.                                          |
| 3   | **Vendor checklist**   | Vendors fit the event (caterer, photographer, decorator, mehendi, sound & light…). Each one moves through `to-contact → quoted → booked → paid`, and you can filter and add your own. |
| 4   | **Personalized ideas** | Theme & decor, food & menu, activities and extras. Every idea comes with a "why this fits you" note. One click regenerates in a new style.                                            |

**Stand-out extras**

- 💬 **Plan-aware chat**: "Cut the budget by 20%" or "Plan B for rain". The assistant proposes changes, and you approve them before they apply.
- 🛟 **Never-dies demo**: if Gemini fails or rate-limits, a built-in rule-based planner still produces a valid plan.
- 🖨️ Print-friendly checklist and a PDF budget summary
- 📱 Mobile-first (360px and up), dark mode, keyboard accessible
- 🇮🇳 Indian context: ₹ with lakh/crore formatting, regional cuisines, muhurtham reminders

## Tech Stack

| Layer      | Choice                                              | Why                                                   |
| ---------- | --------------------------------------------------- | ----------------------------------------------------- |
| Frontend   | React 18 + Vite + Tailwind CSS                      | Fast and simple to deploy                             |
| AI         | Gemini API (JSON output mode), model set by env var | Free tier, structured output                          |
| API proxy  | Vercel Serverless Functions (`/api/*`)              | The API key **never reaches the browser**             |
| Validation | Zod                                                 | Rejects malformed AI output                           |
| Storage    | `localStorage` behind a storage adapter             | No sign-up needed; can be swapped for Firestore later |
| Charts     | Recharts (with a data-table fallback)               | Light, with accessible tables                         |
| PDF        | jsPDF + `@media print`                              | No backend needed                                     |
| Tests      | Vitest + React Testing Library                      | Covers schema, fallback, budget maths and the form    |
| Deploy     | Vercel (auto-deploy from GitHub)                    | Free                                                  |
| Built with | Claude Code (AI coding agent)                       | GenAI-first development, per challenge rules          |

## Architecture

```
Browser (React)
  ├─ EventForm ──► POST /api/plan  ──► Gemini (JSON mode) ──► Zod validate ─┐
  │                                    (retry once with repair prompt)       │
  │                                    (fails? → client fallback planner) ◄──┘
  ├─ Dashboard [Budget | Timeline | Vendors | Ideas]  ◄─► storage adapter (localStorage)
  └─ Chat ──► POST /api/chat (plan JSON + message) ──► { reply, proposedUpdates[] }
```

## Project Structure

```
api/
├── plan.js              # serverless: builds MASTER PROMPT, calls Gemini, validates
├── chat.js              # serverless: plan-aware chat
└── ideas.js             # serverless: regenerate ideas with a style seed
src/
├── components/
│   ├── EventForm.jsx
│   ├── Dashboard.jsx    # tabs + countdown header
│   ├── BudgetTab.jsx
│   ├── TimelineTab.jsx
│   ├── VendorsTab.jsx
│   ├── IdeasTab.jsx
│   ├── ChatWidget.jsx
│   └── ui/              # Button, Card, Toast, Skeleton…
├── lib/
│   ├── api.js           # fetch wrappers + timeout + fallback switch
│   ├── prompts.js       # all prompts (shared with /api)
│   ├── schema.js        # Zod schemas
│   ├── fallback.js      # deterministic rule-based planner
│   ├── budget.js        # rebalance, totals, overspend
│   ├── dates.js         # days-left, phase bucketing (IST)
│   ├── format.js        # ₹ lakh/crore formatting
│   └── storage.js       # localStorage adapter
├── App.jsx
└── main.jsx
tests/                   # Vitest specs
docs/                    # PRD, plan, prompt spec, submission guide
```

## Getting Started

```bash
git clone https://github.com/<you>/utsav.git
cd utsav
npm install

# Free key: https://aistudio.google.com/apikey
cp .env.example .env.local      # then paste your key

npx vercel dev                  # runs the frontend + /api functions locally
npm test                        # run tests
```

### Environment Variables (server-side only)

| Var              | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `GEMINI_API_KEY` | Gemini API key. Only read by `/api/*` functions.         |
| `GEMINI_MODEL`   | Model id, e.g. a current Flash model listed in AI Studio |

No `VITE_` prefix is used, so nothing secret gets bundled into the frontend.

## The Prompts

PromptWars is about prompting, so all our prompts are documented in [docs/PROMPT_SPEC.md](docs/PROMPT_SPEC.md):

1. **Master Plan Prompt**: turns form answers into strict JSON (budget, tasks, vendors, ideas)
2. **Repair Prompt**: fixes invalid JSON once, then we fall back
3. **Chat Prompt**: answers about _your_ plan and proposes structured updates
4. **Regenerate Ideas Prompt**: a style seed gives a fresh direction each time

## Docs

- [PRD](docs/PRD.md): requirements
- [PLAN](docs/PLAN.md): the 12-day build plan
- [PROMPT_SPEC](docs/PROMPT_SPEC.md): prompts and JSON contract
- [SUBMISSION](docs/SUBMISSION.md): checklist and demo-video shot list

## License

MIT
