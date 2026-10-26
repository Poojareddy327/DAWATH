# CLAUDE.md — Utsav

GenAI celebration & event planner for PromptWars Challenge 5 (deadline **Nov 1, 2026**).
Source of truth: `docs/` (README, PRD, PLAN, PROMPT_SPEC, SUBMISSION). **If docs conflict, `docs/PRD.md` wins.**
Build order and "Done when" checks follow `docs/PLAN.md`.

## Stack (do not change without asking)

- React 18 + Vite + Tailwind CSS, plain JavaScript (JSX). No TypeScript.
- Vercel Serverless Functions in `/api` for every Gemini call, using the official `@google/genai` SDK.
- Zod (schemas + AI validation), Recharts (code-split), jsPDF (code-split).
- Vitest + React Testing Library; ESLint + Prettier.
- Persistence: `localStorage` via `src/lib/storage.js` only (key `utsav:v1:event`).
- No new dependencies beyond this list without asking.

## Folder structure

```
api/                 # Vercel functions: health.js, plan.js, chat.js, ideas.js
  _lib/              # gemini.js (JSON mode + Zod + repair + fallback), http.js (POST-only, 20 KB cap)
src/
  components/        # small components; ui/ for Button, Card, Field, ProgressBar, Toast
  hooks/             # useEventStore (reducer + localStorage), useToday (IST), useIsDark
  lib/               # pure logic: prompts, schema, fallback, postprocess, budget, dates, format,
                     # store (reducer), chat, validation, ids, samples, storage, api, pdf
  App.jsx, main.jsx, index.css
tests/               # lib/ units, api/ handlers (Gemini mocked), components/ (RTL), fixtures/personas.js
docs/                # PRD, PLAN, PROMPT_SPEC, SUBMISSION, README
```

## Commands

| Command              | Does                                                          |
| -------------------- | ------------------------------------------------------------- |
| `npm install`        | Install deps                                                  |
| `npx vercel dev`     | Run frontend + `/api` locally (needs `.env.local`)            |
| `npm run dev`        | Vite + a dev-only bridge that serves `/api` from `.env.local` |
| `npm test`           | Vitest, run once                                              |
| `npm run test:watch` | Vitest watch mode                                             |
| `npm run lint`       | ESLint                                                        |
| `npm run format`     | Prettier write                                                |
| `npm run build`      | Production build to `dist/` (git-ignored)                     |

## Hard rules

1. **No secrets in the client.** `GEMINI_API_KEY` and `GEMINI_MODEL` are read from `process.env` in `/api` only. Never a `VITE_`-prefixed secret. Never log the key or full request headers. `.env*` is git-ignored; only `.env.example` is committed.
2. **All AI output passes Zod.** Gemini runs in JSON mode with a response schema derived from `src/lib/schema.js` (array-length keywords omitted — Gemini 400s on them; Zod enforces counts). Invalid output → one repair retry (PROMPT_SPEC §4) → still invalid, 25 s timeout, or 429/5xx → respond `{ fallback: true }`. `GEMINI_MODEL` may be a comma-separated list; 429/404/5xx moves to the next model within the same deadline.
3. **Fallback must always work.** `src/lib/fallback.js` is pure and deterministic (`buildFallbackPlan(meta, today)`), passes the same Zod schema, and is tested with all 3 PRD personas. The app must produce a plan with no API key and no network.
4. **Trust our maths, not the model's.** `finalizePlan` normalizes percents to 100 (₹ amounts are always derived, never stored); rounds and clamps negative `dueDaysBefore` to 0 and **drops** tasks beyond the days left (PRD FR-2 wins over PROMPT_SPEC's "clamp"); assigns phases per FR-4; de-dupes ids. "Today" is always IST (`Asia/Kolkata`).
5. Prompts live in `src/lib/prompts.js`, written exactly as in `docs/PROMPT_SPEC.md`.
6. Chat returns `{ reply, proposedUpdates }`; each update is Zod-validated, unknown ops ignored, applied only on user **Apply**.
7. `/api` validates request bodies with Zod and rejects bodies > 20 KB.
8. ₹ formatting only via `src/lib/format.js` (`Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`).

## Quality bar

- Logic lives in `src/lib/` as small pure functions with tests; components stay small.
- Accessibility: label on every input, `aria-describedby` for errors, ARIA tabs with arrow keys, visible focus, table alternative for every chart, WCAG AA contrast, respect `prefers-reduced-motion`.
- Mobile-first, check at 360px; dark mode via Tailwind `dark:`.
- Design: ivory/cream base, marigold (amber-500) + maroon (rose-900) accents, CSS/SVG utsav garland in header, Fraunces headings + Inter body. No purple AI gradients, no image assets.
- Before every commit: `npm run lint` and `npm test` green. Conventional commits, e.g. `feat(budget): rebalance + expense log`.
- Keep the repo lean: no `dist/`, no `node_modules/`, no large assets, no dead code.
