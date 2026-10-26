# 🪔 Utsav — Your AI Celebration Planner

> PromptWars Virtual · Challenge 5 (Celebration & Event Planner) · Powered by the Gemini API

A _utsav_ is the festive garland hung across the doorway when a celebration is about to begin. **Utsav** is the doorway to your event. You answer six quick questions (event type, date, budget, guests, city, culture) and Gemini drafts a full plan you can edit: a budget split, a countdown timeline, a vendor checklist and personalized ideas. It all lives on one dashboard, and a chat assistant knows your plan.

**Live demo:** https://utsav-five.vercel.app/ · **Demo video:** https://youtu.be/CdI25O7siXY

**Lighthouse (live, desktop):** Performance 96 · Accessibility 100 · Best Practices 96 · SEO 100.

---

## The Problem

Event planning in India is scattered across tools. Budgets sit in Excel, timelines in WhatsApp, vendor numbers in phone notes and inspiration on Instagram. A 300-guest Kerala wedding and a 25-kid birthday party need completely different plans, but checklist apps give everyone the same template.

Utsav uses GenAI as the **planner** instead of a template. The plan is generated from your real constraints: budget tier, guest count, city, culture and days left.

## Features → Challenge Requirements

| #   | Requirement            | What Utsav does                                                                                                                                                                       |
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
  ├─ EventForm ──► POST /api/plan ──► Gemini (JSON mode + response schema) ──► Zod ─┐
  │                                   invalid? one repair retry · 429/5xx? next model │
  │                                   timeout 25 s / still invalid → { fallback }  ◄──┘
  │                 client: finalizePlan() → normalize %, compute ₹, fit tasks, phases
  │                 fallback flag / network error → lib/fallback.js (deterministic)
  ├─ Dashboard [Budget | Timeline | Vendors | Ideas] ◄─► storage adapter (localStorage)
  └─ Chat ──► POST /api/chat (compact plan summary + last 6 messages)
              ──► { reply, proposedUpdates[] } → each update Zod-checked → Apply / Dismiss
```

**Reliability by design**

- **Trust our maths, not the model's.** Budget percents are normalized to exactly 100 and every ₹ amount is computed in code. Tasks are rounded, negatives clamped to 0, anything due before today is dropped, and phases come from PRD FR-4.
- **Zod everywhere.** Request bodies (≤ 20 KB), model output, data coming back to the client, and every chat update are validated.
- **The demo never dies.** No key, no network, 429, 503 or timeout → the rule-based planner builds a plan that passes the very same schema, and the chat falls back to an offline assistant.

## Project Structure

```
api/
├── _lib/gemini.js       # JSON mode + response schema → Zod → repair retry → model list → fallback
├── _lib/http.js         # POST-only, 20 KB body cap, no-store
├── plan.js · chat.js · ideas.js · health.js
src/
├── components/          # EventForm, Dashboard, Tabs, Budget/Timeline/Vendors/Ideas tabs,
│   └── ui/              # ChatWidget, PrintView, ErrorBoundary · Button, Card, Field, Toast…
├── hooks/               # useEventStore (reducer + persistence), useToday (IST), useIsDark
├── lib/                 # pure, tested logic
│   ├── prompts.js       # all prompts, verbatim from docs/PROMPT_SPEC.md
│   ├── schema.js        # Zod schemas + Gemini response schema derived from them
│   ├── fallback.js      # deterministic rule-based planner (7 event types × 13 cultures)
│   ├── postprocess.js   # finalizePlan: our maths on every plan
│   ├── budget.js · dates.js · format.js · store.js · chat.js · validation.js
│   └── api.js · storage.js · pdf.js · samples.js · ids.js
tests/                   # 180+ Vitest specs: lib units, /api handlers (Gemini mocked), RTL
docs/                    # PRD, plan, prompt spec, submission guide
```

## Getting Started

```bash
git clone https://github.com/<you>/utsav.git
cd utsav
npm install

# Free key: https://aistudio.google.com/apikey
cp .env.example .env.local      # then paste your key and model id

npm run dev                     # Vite + a dev-only bridge that serves /api from .env.local
# or: npx vercel dev            # the exact Vercel runtime (needs `npx vercel login` once)

npm test                        # Vitest
npm run lint                    # ESLint (react, hooks, jsx-a11y) + Prettier-compatible
```

### Environment Variables (server-side only)

| Var              | Purpose                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY` | Gemini API key. Only read by `/api/*` functions.                                                                |
| `GEMINI_MODEL`   | Model id from AI Studio. Comma-separate to fail over on 429/503, e.g. `gemini-3.5-flash,gemini-3.5-flash-lite`. |

No `VITE_` prefix is used, so nothing secret gets bundled into the frontend. `GET /api/health` reports `hasKey` (true/false) and the model list — never the key.

### Deploy (Vercel)

Import the repo in Vercel, add both env vars under **Settings → Environment Variables**, and deploy. `vercel.json` sets the function duration and security headers (CSP, nosniff, frame-deny, referrer policy).

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
