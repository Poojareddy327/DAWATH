# 12-Day Build Plan — Utsav (Deadline: Nov 1, 2026)

**Rule:** the core (Days 1–5) must be deployed before any extras. Deploy early (Day 3) and then redeploy every day.

| Day | Date   | Deliverable                                     | Done when                                                                                                                         |
| --- | ------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Oct 20 | Docs + scaffold                                 | Vite + React + Tailwind boots; `/api/health` works via `vercel dev`; ESLint, Prettier and Vitest set up; `.env.example` committed |
| 2   | Oct 21 | Intake form + `/api/plan` + Zod + fallback      | Form validates; the 3 persona inputs each return a valid plan (AI **and** fallback); unit tests pass                              |
| 3   | Oct 22 | Dashboard shell + Budget tab + **first deploy** | Tabs (ARIA) render; rebalance works; expenses log; charts + table toggle; live on Vercel                                          |
| 4   | Oct 23 | Timeline + Vendors tabs                         | Countdown; phase grouping; check-off; vendor status/filter; all saved to localStorage                                             |
| 5   | Oct 24 | Ideas tab + regenerate                          | 4 sections with "why it fits"; regenerate swaps the style seed                                                                    |
| 6   | Oct 25 | Chat assistant                                  | Plan-aware replies; proposed-update cards with Apply/Dismiss                                                                      |
| 7   | Oct 26 | Error handling                                  | Timeout/429 → toast + fallback; error boundary; "Try a sample" button                                                             |
| 8   | Oct 27 | Export + polish                                 | Print CSS; jsPDF budget; dark mode; 360px QA                                                                                      |
| 9   | Oct 28 | Quality pass                                    | Lighthouse ≥ 90 on all four categories; axe has no critical issues; README final; tests green                                     |
| 10  | Oct 29 | **Final deploy** (hard date)                    | Public GitHub repo + live URL tested on a phone                                                                                   |
| 11  | Oct 30 | Demo video                                      | Recorded from the shot list in SUBMISSION.md                                                                                      |
| 12  | Oct 31 | Buffer + submit                                 | Submitted with a day to spare                                                                                                     |

## Definition of Done (every feature)

- [ ] Works with a free-tier Gemini key
- [ ] Still works when Gemini fails (fallback visible)
- [ ] Usable at 360px and with the keyboard alone
- [ ] State survives a reload
- [ ] Has at least one test for its logic in `lib/`
- [ ] No console errors
