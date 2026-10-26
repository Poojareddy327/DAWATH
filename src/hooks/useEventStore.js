import { useEffect, useReducer } from 'react';
import { loadEvent, saveEvent } from '../lib/storage.js';
import { eventReducer } from '../lib/store.js';

/** Event state + dispatch, restored from and saved to localStorage (PRD FR-9). */
export function useEventStore() {
  const [event, dispatch] = useReducer(eventReducer, null, loadEvent);
  useEffect(() => {
    saveEvent(event);
  }, [event]);
  return [event, dispatch];
}
