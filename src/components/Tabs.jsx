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
        className="-mx-4 flex gap-1 overflow-x-auto [scrollbar-width:thin] border-b border-amber-200 px-4 dark:border-stone-800 print:hidden"
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
              className={`shrink-0 rounded-t-xl border-b-3 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                selected
                  ? 'border-rose-900 text-rose-900 dark:border-amber-400 dark:text-amber-300'
                  : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
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
