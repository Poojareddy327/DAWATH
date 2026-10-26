import { Suspense, lazy, useCallback, useState } from 'react';
import EventForm from './components/EventForm.jsx';
import Header from './components/Header.jsx';
import LoadingPlan from './components/LoadingPlan.jsx';
import Toast from './components/ui/Toast.jsx';
import { useEventStore } from './hooks/useEventStore.js';
import { useToday } from './hooks/useToday.js';
import { requestPlan } from './lib/api.js';
import { FALLBACK_TOAST } from './lib/constants.js';
import { createEvent } from './lib/store.js';

const Dashboard = lazy(() => import('./components/Dashboard.jsx'));
const ChatWidget = lazy(() => import('./components/ChatWidget.jsx'));
const PrintView = lazy(() => import('./components/PrintView.jsx'));

export default function App() {
  const [event, dispatch] = useEventStore();
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState('');
  const today = useToday();
  const closeToast = useCallback(() => setToast(''), []);

  const generate = async (meta) => {
    setGenerating(true);
    const result = await requestPlan(meta);
    const source = result.plan ? 'ai' : 'fallback';
    const [{ buildFallbackPlan }, { finalizePlan }] = await Promise.all([
      import('./lib/fallback.js'),
      import('./lib/postprocess.js'),
    ]);
    const raw = result.plan ?? buildFallbackPlan(meta, today);
    const plan = finalizePlan(raw, meta, today, source);
    dispatch({ type: 'event/created', event: createEvent(meta, plan, new Date().toISOString()) });
    setGenerating(false);
    if (source === 'fallback') setToast(FALLBACK_TOAST);
  };

  let view;
  if (generating) view = <LoadingPlan />;
  else if (event)
    view = <Dashboard event={event} dispatch={dispatch} today={today} notify={setToast} />;
  else view = <EventForm today={today} onSubmit={generate} />;

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-rose-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <Header hasEvent={Boolean(event)} onReset={() => dispatch({ type: 'event/reset' })} />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Suspense fallback={<LoadingPlan />}>{view}</Suspense>
      </main>
      {event && !generating && (
        <Suspense fallback={null}>
          <ChatWidget event={event} dispatch={dispatch} today={today} />
          <PrintView event={event} today={today} />
        </Suspense>
      )}
      <Toast message={toast} onClose={closeToast} />
    </>
  );
}
