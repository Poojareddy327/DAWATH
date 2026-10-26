import { Component } from 'react';
import { clearEvent } from '../lib/storage.js';

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('[utsav] UI error:', error?.message);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="mx-auto max-w-lg p-6 text-center">
        <h1 className="font-display text-2xl font-bold text-rose-900 dark:text-amber-300">
          Something went wrong
        </h1>
        <p className="mt-2 text-stone-700 dark:text-stone-300">
          Your plan is saved on this device. Try again, or start fresh if the problem keeps coming
          back.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            className="min-h-11 rounded-xl bg-rose-900 px-4 font-semibold text-white"
            onClick={() => this.setState({ failed: false })}
          >
            Try again
          </button>
          <button
            type="button"
            className="min-h-11 rounded-xl border border-rose-900/40 px-4 font-semibold text-rose-900 dark:text-amber-200"
            onClick={() => {
              clearEvent();
              this.setState({ failed: false });
              window.location.reload();
            }}
          >
            Start a new plan
          </button>
        </div>
      </main>
    );
  }
}
