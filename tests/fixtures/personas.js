// PRD §3 personas as fixed test fixtures (today = 2026-10-20 IST).
export const TODAY = '2026-10-20';

export const PRIYA = {
  type: 'wedding',
  date: '2027-01-18', // 90 days out
  budget: 800000,
  guests: 300,
  city: 'Kochi',
  culture: 'Kerala',
  prefs: '',
};

export const ARJUN = {
  type: 'birthday',
  date: '2026-11-10', // 21 days out
  budget: 40000,
  guests: 25,
  city: 'Pune',
  culture: '',
  prefs: 'superhero theme',
};

export const MEERA = {
  type: 'community',
  date: '2026-10-30', // 10 days out
  budget: 120000,
  guests: 150,
  city: 'Bengaluru',
  culture: 'Kerala',
  prefs: 'Onam sadhya, vegetarian',
};

export const PERSONA_CASES = [
  ['Priya (Kochi wedding)', PRIYA, 90],
  ['Arjun (Pune birthday)', ARJUN, 21],
  ['Meera (Bengaluru Onam)', MEERA, 10],
];
