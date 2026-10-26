import { useEffect, useRef, useState } from 'react';
import { requestChat } from '../lib/api.js';
import { buildChatContext, buildFallbackChatReply, describeUpdate } from '../lib/chat.js';
import { CHAT_HISTORY_LIMIT, CHAT_MESSAGE_MAX } from '../lib/constants.js';
import { sanitizeUpdates } from '../lib/schema.js';
import Button from './ui/Button.jsx';
import { inputClass } from './ui/Field.jsx';

const QUICK_CHIPS = [
  'Hyderabadi Dum Biryani catering estimate',
  'Plan B for rain in Gachibowli',
  'Add Marfa band & Shehnai to timeline',
  'What should I do this week?',
];

export default function ChatWidget({ event, dispatch, today }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const toggleRef = useRef(null);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [event.chat.length, open]);

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const send = async (message) => {
    const trimmed = message.trim().slice(0, CHAT_MESSAGE_MAX);
    if (!trimmed || busy) return;
    const history = event.chat
      .slice(-CHAT_HISTORY_LIMIT)
      .map(({ role, text: t }) => ({ role, text: t.slice(0, 2000) }));
    dispatch({
      type: 'chat/add',
      message: { role: 'user', text: trimmed, ts: new Date().toISOString() },
    });
    setText('');
    setBusy(true);

    const result = await requestChat({
      context: buildChatContext(event, today),
      history,
      message: trimmed,
    });
    const answer = result.fallback ? buildFallbackChatReply(event, trimmed, today) : result;
    dispatch({
      type: 'chat/add',
      message: {
        role: 'assistant',
        text: answer.reply,
        ts: new Date().toISOString(),
        offline: Boolean(result.fallback),
        updates: sanitizeUpdates(answer.proposedUpdates).map((data) => ({
          data,
          status: 'pending',
        })),
      },
    });
    setBusy(false);
  };

  return (
    <div className="print:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls="chat-panel"
        onClick={() => (open ? close() : setOpen(true))}
        className="fixed right-4 bottom-4 z-40 flex min-h-12 items-center gap-2 rounded-full border border-amber-400/50 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 px-5 font-semibold text-amber-100 shadow-xl transition-all hover:from-emerald-900 hover:to-teal-900 hover:shadow-emerald-950/40 active:scale-95 dark:from-amber-400 dark:via-yellow-400 dark:to-amber-500 dark:text-emerald-950"
      >
        <span aria-hidden="true">🕌</span>
        {open ? 'Close chat' : 'Ask Dawat'}
      </button>

      {open && (
        <section
          id="chat-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="chat-title"
          className="fixed inset-x-2 bottom-20 z-40 flex max-h-[75dvh] flex-col rounded-2xl border border-amber-300/80 bg-white/95 shadow-2xl backdrop-blur-md sm:right-4 sm:left-auto sm:w-[420px] dark:border-emerald-800/60 dark:bg-[#071f18]"
        >
          <header className="border-b border-amber-200/80 px-4 py-3 dark:border-emerald-900/60">
            <h2
              id="chat-title"
              className="text-lg font-semibold text-emerald-950 dark:text-amber-300"
            >
              Dawat AI Assistant · దావత్
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Suggestions only change your plan when you press Apply.
            </p>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
            {event.chat.length === 0 && (
              <p className="text-sm text-stone-700 dark:text-stone-300">
                Adaab & Namaskaram! Ask me anything about your Hyderabad/Telangana celebration,
                catering per plate, or timeline adjustments.
              </p>
            )}
            {event.chat.map((m, i) => (
              <div key={`${m.ts}-${i}`} className={m.role === 'user' ? 'text-right' : ''}>
                <p className="sr-only">{m.role === 'user' ? 'You said:' : 'Dawat said:'}</p>
                <div
                  className={`inline-block max-w-[90%] rounded-2xl px-3.5 py-2.5 text-left text-sm whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-950 to-teal-900 text-amber-100 shadow-sm dark:from-amber-400 dark:to-yellow-500 dark:text-emerald-950'
                      : 'border border-amber-200/70 bg-white text-stone-900 shadow-sm dark:border-emerald-900/60 dark:bg-[#041a14] dark:text-stone-100'
                  }`}
                >
                  {m.text}
                  {m.offline && (
                    <span className="mt-1 block text-xs opacity-80">(offline assistant)</span>
                  )}
                </div>
                {m.updates?.length > 0 && (
                  <ul className="mt-2 space-y-2" aria-label="Proposed changes">
                    {m.updates.map((u, j) => (
                      <li
                        key={j}
                        className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-500/40 dark:bg-stone-800"
                      >
                        <p className="text-stone-900 dark:text-stone-100">
                          {describeUpdate(u.data, event.plan)}
                        </p>
                        {u.status === 'pending' ? (
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                dispatch({
                                  type: 'chat/resolveUpdate',
                                  messageIndex: i,
                                  updateIndex: j,
                                  apply: true,
                                })
                              }
                            >
                              Apply
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                dispatch({
                                  type: 'chat/resolveUpdate',
                                  messageIndex: i,
                                  updateIndex: j,
                                  apply: false,
                                })
                              }
                            >
                              Dismiss
                            </Button>
                          </div>
                        ) : (
                          <p className="mt-1 text-xs font-semibold text-stone-700 dark:text-stone-300">
                            {u.status === 'applied' ? '✓ Applied' : 'Dismissed'}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {busy && (
              <p role="status" className="text-sm text-stone-600 dark:text-stone-400">
                Dawat is thinking…
              </p>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-amber-200/80 px-4 py-3 dark:border-emerald-900/60">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={busy}
                  onClick={() => send(chip)}
                  className="min-h-9 shrink-0 rounded-full border border-amber-300/70 bg-white px-3 text-xs font-semibold text-emerald-950 shadow-xs hover:border-emerald-800 hover:bg-amber-50/80 disabled:opacity-60 dark:border-emerald-800/60 dark:bg-[#041a14] dark:text-amber-200 dark:hover:bg-emerald-950/60"
                >
                  {chip}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(text);
              }}
            >
              <label htmlFor="chat-input" className="sr-only">
                Message Dawat
              </label>
              <input
                id="chat-input"
                ref={inputRef}
                className={inputClass}
                value={text}
                maxLength={CHAT_MESSAGE_MAX}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask about your plan…"
                autoComplete="off"
              />
              <Button type="submit" disabled={busy || !text.trim()}>
                Send
              </Button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
