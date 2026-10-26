// PRD §3 personas, with dates relative to today so "Try a sample" always validates.
import { addDays } from './dates.js';

export const PERSONAS = [
  {
    id: 'priya',
    label: 'Priya’s Kochi wedding',
    daysOut: 90,
    meta: {
      type: 'wedding',
      budget: 800000,
      guests: 300,
      city: 'Kochi',
      culture: 'Kerala',
      prefs: 'Muhurtham in the morning, vegetarian sadhya lunch, mostly traditional decor',
    },
  },
  {
    id: 'arjun',
    label: 'Arjun’s son’s 7th birthday',
    daysOut: 21,
    meta: {
      type: 'birthday',
      budget: 40000,
      guests: 25,
      city: 'Pune',
      culture: 'Marathi',
      prefs: '25 kids aged 6–8, superhero theme hints, indoor, return gifts needed',
    },
  },
  {
    id: 'meera',
    label: 'Meera’s community Onam sadhya',
    daysOut: 10,
    meta: {
      type: 'community',
      budget: 120000,
      guests: 150,
      city: 'Bengaluru',
      culture: 'Kerala',
      prefs: 'Onam sadhya, vegetarian, volunteers from the residents’ association, track spending',
    },
  },
];

/** Intake values (as the form expects them) for a persona, dated relative to `today`. */
export function personaIntake(persona, today) {
  return { ...persona.meta, date: addDays(today, persona.daysOut) };
}
