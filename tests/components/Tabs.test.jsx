import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import Tabs from '../../src/components/Tabs.jsx';

const TABS = [
  { id: 'a', label: 'Budget' },
  { id: 'b', label: 'Timeline' },
  { id: 'c', label: 'Vendors' },
];

function Harness() {
  const [active, setActive] = useState('a');
  return (
    <Tabs label="Sections" tabs={TABS} active={active} onChange={setActive}>
      {(id) => <p>Panel {id}</p>}
    </Tabs>
  );
}

describe('Tabs (ARIA pattern)', () => {
  it('exposes tablist, tabs and a labelled panel with roving tabindex', () => {
    render(<Harness />);
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument();
    const [first, second] = screen.getAllByRole('tab');
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(first).toHaveAttribute('tabindex', '0');
    expect(second).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tabpanel', { name: 'Budget' })).toHaveTextContent('Panel a');
  });

  it('moves with arrow keys, wraps, and supports Home/End', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('tab', { name: 'Budget' }));

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Timeline' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel b');

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Vendors' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Budget' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel c');
  });
});
