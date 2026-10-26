import { useRef } from 'react';

/**
 * WAI-ARIA tabs with automatic activation: ←/→ move and select, Home/End jump to the ends.
 * `tabs` = [{ id, label }]; the active panel is rendered by the parent via `children(activeId)`.
 */
export default function Tabs({ label, tabs, active, onChange, children }) {
  const refs = useRef({});

  const onKeyDown = (e) => {
    const index = tabs.findIndex((t) => t.id === active);
    const keys = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = tabs[keys[e.key]].id;
    onChange(next);
    refs.current[next]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="-mx-2 flex gap-1.5 overflow-x-auto [scrollbar-width:thin] rounded-2xl border border-amber-300/60 bg-white/85 p-1.5 shadow-sm backdrop-blur-sm sm:mx-0 dark:border-emerald-800/50 dark:bg-[#071f18]/80 print:hidden"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={onKeyDown}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                selected
                  ? 'border border-amber-400/40 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-amber-200 shadow-md dark:border-transparent dark:from-amber-400 dark:to-yellow-500 dark:text-emerald-950'
                  : 'text-stone-700 hover:bg-amber-50/80 hover:text-emerald-950 dark:text-stone-300 dark:hover:bg-emerald-900/40 dark:hover:text-amber-200'
              }`}
            >
              <span aria-hidden="true">{tab.icon} </span>
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        tabIndex={0}
        className="pt-6 focus-visible:outline-offset-4"
      >
        {children(active)}
      </div>
    </div>
  );
}
