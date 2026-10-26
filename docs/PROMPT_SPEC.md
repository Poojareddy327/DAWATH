# Prompt Spec & AI Contract — Utsav

All prompts live in `src/lib/prompts.js` and are imported by the `/api` functions. Every Gemini call uses:
`responseMimeType: "application/json"`, a `responseSchema` matching §3, `temperature: 0.7` (0.9 for ideas), and a 25 s timeout.

## 1. System Instruction (shared)

```
You are Utsav, an expert Indian event planner with 15 years of experience in weddings,
birthdays, and community events across Indian cities. You are practical, budget-aware and
culturally respectful. You give realistic Indian market prices in INR for the given city
and never invent specific business names, phone numbers or addresses — suggest vendor
TYPES and what to look for instead. Always respond with valid JSON only, matching the schema.
```

## 2. Master Plan Prompt

```
Create a complete event plan.

EVENT
- Type: {type}
- Date: {date} ({daysLeft} days from today, {today})
- Total budget: ₹{budget}
- Guests: {guests}
- City: {city}
- Culture/region: {culture || "not specified"}
- Preferences: {prefs || "none"}

RULES
1. budget.categories: 5–8 categories whose percent values sum to exactly 100.
   Fit the event type (e.g. wedding: venue, catering, decor, attire & jewellery,
   photography, rituals/priest, entertainment, contingency). Always include a
   5–10% "Contingency" category.
2. tasks: 12–25 tasks. dueDaysBefore must be an integer between 0 and {daysLeft}.
   If daysLeft is small, compress: prioritise booking venue/caterer first.
   Include culture-specific tasks where relevant (e.g. fix muhurtham with priest,
   mehendi booking, church banns, nikah arrangements).
3. vendors: 5–12 vendor types needed for THIS event and guest count, each with a
   realistic estCost in INR that fits inside its budget category.
4. ideas: 3–4 items each for theme, food, activities, extras. Each "whyItFits" must
   reference a specific input (budget, guests, city, culture or preferences).
   Food must respect dietary preferences.
5. warnings: list any real constraint problems (e.g. "₹40k for 300 guests is very
   tight — ~₹130/plate"). Empty array if none.
6. summary: 1–2 friendly sentences describing the plan.
Use short, lowercase-kebab ids (e.g. "cat-venue", "task-book-venue", "ven-caterer").
```

## 3. JSON Contract (Zod is the source of truth)

```js
Plan = {
  summary: string,
  budget: {
    categories: [{ id: string, name: string, percent: number, notes: string }] // 5–8
  },
  tasks: [{
    id: string, title: string, dueDaysBefore: int (>=0),
    category: string, priority: "high" | "medium" | "low"
  }],                                                                          // 12–25
  vendors: [{
    id: string, category: string, type: string, estCost: number,
    notes: string, priority: "must-have" | "nice-to-have"
  }],                                                                          // 5–12
  ideas: {
    theme:      [{ title: string, description: string, whyItFits: string }],
    food:       [ ...same ],
    activities: [ ...same ],
    extras:     [ ...same ]
  },
  warnings: string[]
}
```

**Client post-processing** (`lib/budget.js`, `lib/dates.js`). ₹ amounts are always computed by our code, never trusted from the model.

- Normalize the percents so they sum to 100, then `amount = round(budget * percent / 100)`.
- Clamp `dueDaysBefore` to `[0, daysLeft]`, then assign the phase per PRD FR-4.
- De-duplicate ids.

## 4. Repair Prompt (one retry only)

```
Your previous response failed validation with these errors:
{zodErrors}

Previous response:
{rawText}

Return the corrected JSON only, keeping all valid content unchanged.
```

## 5. Chat Prompt

**Context sent:** a compact summary built by `buildChatContext(state)`, not the whole raw state. It contains:

- event meta and days left
- budget categories with allocated and spent amounts
- open tasks (the next 10 by due date)
- vendor statuses
- the current idea titles

```
You are Utsav, the user's personal event planner. Here is their current plan:
{context}

Answer the user's message using THEIR numbers, tasks and vendors. Be concise
(max ~120 words), warm, and specific. If a change to the plan would help, propose it
in proposedUpdates — never claim you already changed anything.

Allowed update ops:
- { op: "set_budget_percent", categoryId, percent }
- { op: "add_task", title, dueDaysBefore, category, priority }
- { op: "add_vendor", category, type, estCost, notes }
- { op: "set_vendor_status", vendorId, status }
- { op: "add_idea", section, title, description, whyItFits }

Return JSON: { "reply": string, "proposedUpdates": Update[] }  (max 5 updates)

User: {message}
```

The client validates each update with Zod, ignores unknown ops, and applies one only when the user clicks **Apply**.

## 6. Regenerate Ideas Prompt

```
Give fresh ideas for this event in a "{styleSeed}" style
(one of: traditional, modern-minimal, eco, budget-smart, grand).
Event: {compact meta}. Avoid repeating these titles: {currentIdeaTitles}.
Return JSON: { ideas: { theme, food, activities, extras } } using the same item shape.
```

## 7. Fallback Planner (`lib/fallback.js`)

A pure, deterministic function `buildFallbackPlan(meta, today)` that **must pass the same Zod schema**.

- Budget templates per event type, with percent tables. Example for a wedding: venue 25, catering 30, decor 12, attire 10, photo 8, rituals 5, entertainment 3, contingency 7.
- A task library per event type, each task with a default `dueDaysBefore`. The library is filtered and compressed to fit `daysLeft`.
- A vendor list per event type, with costs taken as a % of each category.
- An idea bank keyed by event type and culture, plus a generic set.
- `warnings` includes the per-guest cost when it falls below a threshold.

## 8. Prompt Test Inputs

Use the 3 personas from the PRD. These are the checks:

- percents sum to 100 after normalization
- every task fits within days left
- Kerala input → the food ideas mention sadhya
- birthday input → no wedding vendors
- a tiny budget produces a warning
