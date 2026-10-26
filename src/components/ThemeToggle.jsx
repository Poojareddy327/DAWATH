import { useState } from 'react';
import { saveTheme } from '../lib/storage.js';
import Button from './ui/Button.jsx';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    saveTheme(next ? 'dark' : 'light');
    setDark(next);
  };

  return (
    <Button size="sm" variant="ghost" aria-pressed={dark} onClick={toggle}>
      <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
      Dark mode
    </Button>
  );
}
