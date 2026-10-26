export const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'baby-shower', label: 'Baby shower' },
  { value: 'housewarming', label: 'Housewarming' },
  { value: 'community', label: 'Community event' },
  { value: 'corporate', label: 'Corporate event' },
];

export const EVENT_TYPE_VALUES = EVENT_TYPES.map((t) => t.value);

export const CULTURES = [
  'North Indian',
  'Kerala',
  'Tamil',
  'Telugu',
  'Kannada',
  'Marathi',
  'Bengali',
  'Punjabi',
  'Gujarati',
  'Jain',
  'Muslim',
  'Christian',
  'Secular/Other',
];

export const LIMITS = {
  budgetMin: 5000,
  budgetMax: 50000000,
  guestsMin: 5,
  guestsMax: 5000,
  cityMin: 2,
  cityMax: 60,
  prefsMax: 500,
  maxDaysAhead: 730,
};

export const STYLE_SEEDS = ['traditional', 'modern-minimal', 'eco', 'budget-smart', 'grand'];

export const STYLE_LABELS = {
  traditional: 'Traditional',
  'modern-minimal': 'Modern minimal',
  eco: 'Eco-friendly',
  'budget-smart': 'Budget-smart',
  grand: 'Grand',
};

export const VENDOR_STATUSES = ['to-contact', 'quoted', 'booked', 'paid'];

export const VENDOR_STATUS_LABELS = {
  'to-contact': 'To contact',
  quoted: 'Quoted',
  booked: 'Booked',
  paid: 'Paid',
};

export const PRIORITIES = ['high', 'medium', 'low'];

export const IDEA_SECTIONS = [
  { key: 'theme', label: 'Theme & Decor' },
  { key: 'food', label: 'Food & Menu' },
  { key: 'activities', label: 'Activities' },
  { key: 'extras', label: 'Extras' },
];

export const PHASES = [
  { key: 'booking', label: 'Booking · 30+ days out' },
  { key: 'final-month', label: 'Final month' },
  { key: 'final-week', label: 'Final week' },
  { key: 'day-of', label: 'Day before & day of' },
];

export const STORAGE_KEY = 'utsav:v1:event';
export const THEME_KEY = 'utsav:theme';

export const AI_TIMEOUT_MS = 25000;
export const CLIENT_TIMEOUT_MS = 32000;
export const MAX_BODY_BYTES = 20 * 1024;
export const CHAT_HISTORY_LIMIT = 6;
export const CHAT_MESSAGE_MAX = 500;
export const CHAT_CONTEXT_MAX = 8000;
export const MAX_UPDATES = 5;

export const FALLBACK_TOAST = "AI is busy — here's a smart starter plan. Try regenerating later.";
