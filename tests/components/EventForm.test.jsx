import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EventForm from '../../src/components/EventForm.jsx';
import { TODAY } from '../fixtures/personas.js';

const setup = () => {
  const onSubmit = vi.fn();
  render(<EventForm today={TODAY} onSubmit={onSubmit} />);
  return { onSubmit, user: userEvent.setup() };
};

describe('EventForm', () => {
  it('labels every input', () => {
    setup();
    for (const label of [
      'Event type',
      'Event date',
      'Total budget (₹)',
      'Number of guests',
      'City',
      /Culture \/ region/,
      /Preferences/,
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it('shows inline errors tied with aria-describedby and focuses the first one', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Create my plan' }));

    const type = screen.getByLabelText('Event type');
    expect(type).toHaveAttribute('aria-invalid', 'true');
    expect(type).toHaveAccessibleDescription('Choose an event type');
    expect(screen.getByLabelText('Total budget (₹)')).toHaveAccessibleDescription(
      /₹5,000 to ₹5,00,00,000 Enter your budget in ₹/,
    );
    expect(type).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits validated, typed values', async () => {
    const { onSubmit, user } = setup();
    await user.selectOptions(screen.getByLabelText('Event type'), 'birthday');
    await user.type(screen.getByLabelText('Event date'), '2026-11-10');
    await user.type(screen.getByLabelText('Total budget (₹)'), '40000');
    await user.type(screen.getByLabelText('Number of guests'), '25');
    await user.type(screen.getByLabelText('City'), 'Pune');
    await user.click(screen.getByRole('button', { name: 'Create my plan' }));

    expect(onSubmit).toHaveBeenCalledWith({
      type: 'birthday',
      date: '2026-11-10',
      budget: 40000,
      guests: 25,
      city: 'Pune',
      culture: '',
      prefs: '',
    });
  });

  it('“Try a sample” fills a persona and submits it', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('button', { name: /Priya/ }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'wedding',
        city: 'Kochi',
        budget: 800000,
        date: '2027-01-18',
      }),
    );
    expect(screen.getByLabelText('City')).toHaveValue('Kochi');
  });
});
