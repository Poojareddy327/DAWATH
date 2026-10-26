# Product Requirements — Utsav

**Version:** 1.1 · **Date:** Oct 20, 2026 · **Deadline:** Nov 1, 2026
**Challenge:** PromptWars Virtual, Challenge 5. The brief: build a GenAI-powered planning assistant for weddings, birthdays and community events, with budgets, timelines, vendor checklists and personalized ideas.

## 1. Problem

Planning an Indian event means juggling budgets, dates and dozens of vendors across scattered tools. Existing checklist apps are static and ignore culture. A GenAI planner can turn a few inputs into a realistic, personalized first draft in seconds, and the user can then own and edit it.

## 2. Goals / Non-Goals

**Goals**

- Generate a complete plan in **under 30 s** (budget, timeline, vendors, ideas).
- Make everything editable and trackable after generation.
- Refine the plan through a chat that understands it.
- Run on **free tiers only**. The rules give no GCP credits.
- **Never break the demo.** A deterministic fallback covers every AI failure.

**Non-Goals (v1):** vendor marketplace or booking, payments, multi-user collaboration, RSVP, login.

## 3. Personas (also used as test fixtures)

| Persona                  | Event                                                 | Needs                                                   |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------- |
| **Priya, 28**, Kochi     | Hindu wedding, ₹8L, 300 guests, 90 days out           | Muhurtham-aware timeline, sadhya menu, vendor shortlist |
| **Arjun, 35**, Pune      | Son's 7th birthday, ₹40k, 25 kids, 21 days out        | Theme ideas, entertainment, return gifts                |
| **Meera, 52**, Bengaluru | Community Onam sadhya, ₹1.2L, 150 people, 10 days out | Catering, volunteer tasks, budget tracking              |

## 4. Functional Requirements

### FR-1 Intake Form (one screen)

| Field            | Type     | Req      | Validation                                                                                                                |
| ---------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| Event type       | select   | ✅       | wedding · birthday · anniversary · baby-shower · housewarming · community · corporate                                     |
| Event date       | date     | ✅       | today ≤ date ≤ today + 2 years (IST)                                                                                      |
| Budget (₹)       | number   | ✅       | 5,000 – 5,00,00,000                                                                                                       |
| Guests           | number   | ✅       | 5 – 5000                                                                                                                  |
| City             | text     | ✅       | 2–60 chars                                                                                                                |
| Culture / region | select   | optional | North Indian, Kerala, Tamil, Telugu, Kannada, Marathi, Bengali, Punjabi, Gujarati, Jain, Muslim, Christian, Secular/Other |
| Preferences      | textarea | optional | ≤ 500 chars (diet, eco-friendly, indoor/outdoor, theme hints)                                                             |

- Inline errors, with `aria-describedby` on each field.
- A **"Try a sample"** button pre-fills one persona (this helps judges).

### FR-2 Plan Generation

- `POST /api/plan` calls Gemini in JSON mode with the Master Prompt (`PROMPT_SPEC.md` §2).
- The server validates the result with Zod. If it's invalid, it retries **once** with the Repair Prompt. If it's still invalid, or there's a timeout (25 s) or a 429, it returns `{ fallback: true }`.
- When the client gets a fallback flag or a network error, it runs `lib/fallback.js` and shows a non-blocking toast: "AI is busy — here's a smart starter plan. Try regenerating later."
- **Post-processing (always, AI or fallback):** normalize budget percents to 100, compute ₹ amounts, drop tasks whose `dueDaysBefore` is greater than the days left, then assign phases.
- Loading state: skeleton cards that rotate through "Splitting your budget… Building timeline… Finding vendors…".

### FR-3 Budget Tab

- Category list with %, ₹ allocated, ₹ spent and a progress bar.
- When you edit one category's %, the others scale proportionally so the total stays 100%.
- Add, edit and delete expenses (category, label, amount, date, note).
- A pie chart for allocation and a bar chart for allocated vs spent. Each chart has a "View as table" toggle.
- A **red overspend banner** appears when a category or the total goes over budget.

### FR-4 Timeline Tab

- Header: "**N days to go**" plus an overall progress %.
- Phases come from `dueDaysBefore` (`d`):
  - `booking`: d > 30
  - `final-month`: 8 ≤ d ≤ 30
  - `final-week`: 2 ≤ d ≤ 7
  - `day-of`: d ≤ 1
- Each task shows a checkbox, title, due date (event date − d), category chip and priority. You can add, edit and delete tasks.
- Overdue, unchecked tasks are highlighted.

### FR-5 Vendors Tab

- Cards show category, suggested type, estimated cost, contact (editable), notes and a status dropdown: `to-contact | quoted | booked | paid`.
- Filter chips by status, plus a count summary ("4 / 9 booked").
- You can add a custom vendor.

### FR-6 Ideas Tab

- Four sections: Theme & Decor · Food & Menu · Activities · Extras. There are 3–4 ideas each, and every idea has a 💡 "why this fits you" note.
- **Regenerate** calls `/api/ideas` with a new style seed (`traditional`, `modern-minimal`, `eco`, `budget-smart`, `grand`). It replaces only the ideas.

### FR-7 Chat Assistant

- A floating button opens a panel. The context sent is a **compact plan summary** (not the raw full state) plus the last 6 messages.
- The reply is `{ reply, proposedUpdates[] }`. Proposed updates appear as cards with **Apply** and **Dismiss** buttons, so nothing changes without user approval.
- Quick chips: "Make it eco-friendly", "Cut budget by 20%", "Plan B for rain", "What should I do this week?"

### FR-8 Export

- A print view (`@media print`) of the checklist, timeline and vendors.
- A jsPDF budget summary.

### FR-9 Persistence

- All state is saved in `localStorage` under `utsav:v1:event`, and the app restores it on reload.
- A "Start new plan" button asks for confirmation before clearing.

## 5. Non-Functional Requirements

| Area          | Requirement                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security      | The key lives in Vercel env only. `/api` validates input with Zod, caps body size at 20 KB and caps prompt length. `.env*` is git-ignored. No secrets in the repo.            |
| Reliability   | 25 s timeout, 1 repair retry, fallback planner, and a React error boundary                                                                                                    |
| Performance   | Lighthouse Performance ≥ 90, code-split charts and PDF                                                                                                                        |
| Accessibility | WCAG AA contrast; labels on every input; tabs follow the ARIA tabs pattern with arrow keys; visible focus; charts have table alternatives; `prefers-reduced-motion` respected |
| Responsive    | Works at 360px and up; tabs scroll on mobile                                                                                                                                  |
| Testing       | Vitest covers the schema, fallback (3 personas), budget rebalance, phase bucketing and form validation                                                                        |
| Code quality  | ESLint + Prettier; small pure functions in `lib/`; no dead code                                                                                                               |

## 6. Data Model (localStorage)

```json
{
  "version": 1,
  "meta": {
    "type": "",
    "date": "YYYY-MM-DD",
    "budget": 0,
    "guests": 0,
    "city": "",
    "culture": "",
    "prefs": "",
    "createdAt": ""
  },
  "plan": {
    "summary": "",
    "budget": {},
    "tasks": [],
    "vendors": [],
    "ideas": {},
    "warnings": [],
    "source": "ai|fallback"
  },
  "state": {
    "doneTaskIds": [],
    "vendorStatus": {},
    "vendorContacts": {},
    "styleSeed": "traditional"
  },
  "expenses": [{ "id": "", "categoryId": "", "label": "", "amount": 0, "date": "", "note": "" }],
  "chat": [{ "role": "user|assistant", "text": "", "ts": "" }]
}
```

## 7. Success Metrics

- The plan renders 100% of the time (AI or fallback).
- Judge path (sample → plan → 4 tabs → 2 chat turns → export) takes under 3 minutes.
- Lighthouse: Accessibility ≥ 95, Performance ≥ 90.

## 8. Risks

| Risk                         | Mitigation                                                       |
| ---------------------------- | ---------------------------------------------------------------- |
| Free-tier 429 during judging | Fallback planner + cached sample plan                            |
| Malformed AI JSON            | JSON mode + response schema + Zod + repair retry                 |
| Model name changes           | `GEMINI_MODEL` env var; nothing hard-coded                       |
| Key exposure                 | Server-side proxy only                                           |
| Scope creep                  | Day 10 is a hard deploy date; extras only after the core is done |
