import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';
import { FALLBACK_TOAST, STORAGE_KEY } from '../../src/lib/constants.js';

// The judge path with the AI unavailable: the fallback must carry the whole demo.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('offline'))),
  );
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

async function startSample(user) {
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Arjun/ }));
  return screen.findByRole('heading', { level: 1, name: /Birthday · Pune/ });
}

describe('App (offline judge path)', () => {
  it('builds a fallback plan, shows the toast and persists it', async () => {
    const user = userEvent.setup();
    await startSample(user);
    expect(screen.getByText(FALLBACK_TOAST)).toBeInTheDocument();
    expect(screen.getByText(/Smart starter plan/)).toBeInTheDocument();
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).meta.city).toBe('Pune'),
    );
  });

  it('logs an expense and raises the overspend banner', async () => {
    const user = userEvent.setup();
    await startSample(user);
    const form = screen.getByRole('form', { name: 'Add expense' });
    await user.type(within(form).getByLabelText('What for'), 'Hall advance');
    await user.type(within(form).getByLabelText('Amount (₹)'), '50000');
    await user.click(within(form).getByRole('button', { name: 'Add expense' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/over your budget/);
    expect(screen.getByRole('list', { name: 'Logged expenses' })).toHaveTextContent('Hall advance');
  });

  it('rebalances shares to 100% when one category changes', async () => {
    const user = userEvent.setup();
    await startSample(user);
    const venue = screen.getByLabelText('Venue Share %');
    await user.clear(venue);
    await user.type(venue, '40{Enter}');
    const shares = screen.getAllByLabelText(/Share %/).map((input) => Number(input.value));
    expect(shares[0]).toBe(40);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('checks off a task on the timeline and updates progress', async () => {
    const user = userEvent.setup();
    await startSample(user);
    await user.click(screen.getByRole('tab', { name: /Timeline/ }));
    expect(screen.getByRole('heading', { name: '21 days to go' })).toBeInTheDocument();
    const [first] = screen.getAllByRole('checkbox');
    await user.click(first);
    expect(first).toBeChecked();
    expect(screen.getByText(/1 of \d+ tasks done/)).toBeInTheDocument();
  });

  it('chat proposals change the plan only after Apply', async () => {
    const user = userEvent.setup();
    await startSample(user);
    await user.click(screen.getByRole('tab', { name: /Timeline/ }));
    const before = screen.getAllByRole('checkbox').length;

    await user.click(screen.getByRole('button', { name: 'Ask Utsav' }));
    const dialog = screen.getByRole('dialog', { name: 'Plan assistant' });
    await user.click(within(dialog).getByRole('button', { name: 'Plan B for rain' }));
    const applyButtons = await within(dialog).findAllByRole('button', { name: 'Apply' });
    expect(screen.getAllByRole('checkbox')).toHaveLength(before);

    await user.click(applyButtons[0]);
    expect(within(dialog).getByText('✓ Applied')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(before + 1);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask Utsav' })).toHaveFocus();
  });

  it('asks before starting a new plan', async () => {
    const user = userEvent.setup();
    await startSample(user);
    await user.click(screen.getByRole('button', { name: 'Start new plan' }));
    await user.click(screen.getByRole('button', { name: 'Yes, clear' }));
    expect(
      screen.getByRole('heading', { name: 'Plan your celebration in seconds' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem(STORAGE_KEY)).toBeNull());
  });
});
