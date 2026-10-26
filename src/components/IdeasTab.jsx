import { useState } from 'react';
import { requestIdeas } from '../lib/api.js';
import { FALLBACK_TOAST, IDEA_SECTIONS, STYLE_LABELS, STYLE_SEEDS } from '../lib/constants.js';
import { buildFallbackIdeas } from '../lib/fallback.js';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';

const nextSeed = (seed) => STYLE_SEEDS[(STYLE_SEEDS.indexOf(seed) + 1) % STYLE_SEEDS.length];

export default function IdeasTab({ event, dispatch, notify }) {
  const { meta, plan, state } = event;
  const [seed, setSeed] = useState(() => nextSeed(state.styleSeed));
  const [busy, setBusy] = useState(false);

  const regenerate = async () => {
    setBusy(true);
    const currentIdeaTitles = IDEA_SECTIONS.flatMap((s) => plan.ideas[s.key].map((i) => i.title));
    const { culture, prefs, type, date, budget, guests, city } = meta;
    const result = await requestIdeas({
      meta: { type, date, budget, guests, city, culture, prefs },
      styleSeed: seed,
      currentIdeaTitles,
    });
    const ideas = result.ideas ?? buildFallbackIdeas(meta, seed, currentIdeaTitles);
    dispatch({ type: 'ideas/replace', ideas, styleSeed: seed });
    if (!result.ideas) notify(FALLBACK_TOAST);
    setSeed(nextSeed(seed));
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <fieldset>
            <legend className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              Regenerate ideas in a new style
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {STYLE_SEEDS.map((s) => (
                <label
                  key={s}
                  className="flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-stone-300 bg-white px-3 text-sm has-checked:border-rose-900 has-checked:bg-rose-50 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-rose-900 dark:border-stone-600 dark:bg-stone-900 dark:has-checked:border-amber-400 dark:has-checked:bg-stone-800"
                >
                  <input
                    type="radio"
                    name="style-seed"
                    value={s}
                    checked={seed === s}
                    onChange={() => setSeed(s)}
                    className="accent-rose-900 dark:accent-amber-400"
                  />
                  {STYLE_LABELS[s]}
                </label>
              ))}
            </div>
          </fieldset>
          <Button onClick={regenerate} disabled={busy}>
            {busy ? 'Finding fresh ideas…' : '✨ Regenerate ideas'}
          </Button>
        </div>
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-400" aria-live="polite">
          Current style: {STYLE_LABELS[state.styleSeed]}
        </p>
      </Card>

      <div className={`grid gap-6 lg:grid-cols-2 ${busy ? 'opacity-60' : ''}`} aria-busy={busy}>
        {IDEA_SECTIONS.map((section) => (
          <Card key={section.key} aria-labelledby={`ideas-${section.key}`}>
            <h2
              id={`ideas-${section.key}`}
              className="text-xl font-semibold text-rose-900 dark:text-amber-300"
            >
              {section.label}
            </h2>
            <ul className="mt-3 space-y-4">
              {plan.ideas[section.key].map((idea) => (
                <li key={idea.title}>
                  <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100">
                    {idea.title}
                  </h3>
                  <p className="text-sm text-stone-700 dark:text-stone-300">{idea.description}</p>
                  <p className="mt-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-stone-800 dark:text-amber-100">
                    <span aria-hidden="true">💡 </span>
                    <span className="font-semibold">Why this fits you: </span>
                    {idea.whyItFits}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
