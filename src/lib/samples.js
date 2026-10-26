// PRD §3 personas: authentic Telangana & Hyderabadi celebration cases,
// plus standard test fixtures. Dates are relative to today so "Try a sample" always validates.
import { addDays } from './dates.js';

export const PERSONAS = [
  {
    id: 'ananya',
    label: 'Ananya’s Hyderabad Telugu Pelli',
    daysOut: 90,
    meta: {
      type: 'wedding',
      budget: 1500000,
      guests: 500,
      city: 'Hyderabad',
      culture: 'Telugu (Telangana Pelli)',
      prefs:
        'Morning Muhurtham at Kompally convention hall, traditional Jeelakarra Bellam & Talambralu, Hyderabadi Dum Biryani & Telugu Vindu Bhojanam',
    },
  },
  {
    id: 'farhan',
    label: 'Farhan’s Banjara Hills Valima Dawat',
    daysOut: 45,
    meta: {
      type: 'wedding',
      budget: 700000,
      guests: 350,
      city: 'Hyderabad',
      culture: 'Hyderabadi Muslim (Nikah / Valima)',
      prefs:
        'Royal Dawat banquet at Banjara Hills, authentic Zafrani Mutton Dum Biryani, Double Ka Meetha, Marfa band, Sufi qawwali atmosphere',
    },
  },
  {
    id: 'arjun',
    label: 'Arjun’s Hyderabad Birthday Dawat',
    daysOut: 21,
    meta: {
      type: 'birthday',
      budget: 45000,
      guests: 30,
      city: 'Hyderabad',
      culture: 'Telugu',
      prefs:
        'Gachibowli party hall, superhero Tollywood theme for kids, mini biryani & snacks, return gifts',
    },
  },
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
    id: 'lavanya',
    label: 'Lavanya’s Warangal Sambaralu',
    daysOut: 12,
    meta: {
      type: 'community',
      budget: 90000,
      guests: 150,
      city: 'Warangal',
      culture: 'Telugu',
      prefs:
        'Telangana community Bathukamma festival, Pindi Vantalu, Tangedu flower decor, Oggu Katha folk troupe',
    },
  },
];

/** Intake values (as the form expects them) for a persona, dated relative to `today`. */
export function personaIntake(persona, today) {
  return { ...persona.meta, date: addDays(today, persona.daysOut) };
}
