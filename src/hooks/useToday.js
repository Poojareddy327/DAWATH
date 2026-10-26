import { useEffect, useState } from 'react';
import { todayIST } from '../lib/dates.js';

const CHECK_MS = 60000;

/** Today's IST date, refreshed each minute so the countdown rolls over at midnight. */
export function useToday() {
  const [today, setToday] = useState(todayIST);
  useEffect(() => {
    const timer = setInterval(() => setToday(todayIST()), CHECK_MS);
    return () => clearInterval(timer);
  }, []);
  return today;
}
