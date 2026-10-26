// Deterministic, rule-based planner (PROMPT_SPEC §7). Pure: same input → same plan.
// It must satisfy the same PlanSchema as the AI, so the demo never breaks.
import { categoryAmount } from './budget.js';
import { EVENT_TYPES, STYLE_SEEDS } from './constants.js';
import { formatINR, formatNumber } from './format.js';
import { slugify, uniqueId } from './ids.js';
import { daysLeftUntil } from './postprocess.js';

// ---------- Budget templates: [id, name, percent, notes] ----------

const BUDGETS = {
  wedding: [
    ['cat-venue', 'Venue', 25, 'Hall or auditorium incl. basic furniture and power backup'],
    ['cat-catering', 'Catering', 30, 'Meals for all functions, priced per plate'],
    ['cat-decor', 'Decor & flowers', 12, 'Mandap/stage, entrance, flowers and lighting'],
    ['cat-attire', 'Attire & jewellery', 10, 'Outfits, makeup and accessories for the couple'],
    ['cat-photo', 'Photography', 8, 'Photo + video coverage and an album'],
    ['cat-rituals', 'Rituals & priest', 5, 'Priest dakshina, pooja items, ceremony needs'],
    ['cat-entertainment', 'Entertainment', 3, 'Music, sound and lights'],
    ['cat-contingency', 'Contingency', 7, 'Buffer for surprises and last-minute costs'],
  ],
  birthday: [
    ['cat-venue', 'Venue', 20, 'Party hall, clubhouse or garden slot'],
    ['cat-catering', 'Food & cake', 30, 'Snacks, meal and the birthday cake'],
    ['cat-decor', 'Decor & theme', 15, 'Balloons, backdrop and themed props'],
    ['cat-entertainment', 'Entertainment', 15, 'Performer, games host or activities'],
    ['cat-gifts', 'Return gifts', 10, 'Small take-home gifts for guests'],
    ['cat-photo', 'Photography', 3, 'Candid photos of the day'],
    ['cat-contingency', 'Contingency', 7, 'Buffer for extras and last-minute costs'],
  ],
  anniversary: [
    ['cat-venue', 'Venue', 25, 'Restaurant private area, banquet or rooftop'],
    ['cat-catering', 'Catering', 35, 'Dinner, drinks and cake'],
    ['cat-decor', 'Decor & flowers', 12, 'Table settings, florals and lighting'],
    ['cat-photo', 'Photography', 10, 'Couple shoot and event coverage'],
    ['cat-entertainment', 'Entertainment', 8, 'Live music or a DJ'],
    ['cat-gifts', 'Gifts & favours', 3, 'Guest favours and the couple’s gift'],
    ['cat-contingency', 'Contingency', 7, 'Buffer for surprises'],
  ],
  'baby-shower': [
    ['cat-venue', 'Venue', 20, 'Home, community hall or banquet'],
    ['cat-catering', 'Catering', 35, 'Meal and sweets'],
    ['cat-decor', 'Decor', 18, 'Swing/seat decor, backdrop and flowers'],
    ['cat-rituals', 'Ceremony & games', 10, 'Ritual items (e.g. valaikaapu bangles) and games'],
    ['cat-gifts', 'Return gifts', 10, 'Gifts for guests'],
    ['cat-contingency', 'Contingency', 7, 'Buffer for extras'],
  ],
  housewarming: [
    ['cat-catering', 'Catering', 40, 'Breakfast or lunch for guests'],
    ['cat-rituals', 'Pooja & rituals', 15, 'Griha pravesh pooja, priest and items'],
    ['cat-decor', 'Decor & flowers', 12, 'Toran, rangoli, flowers and lighting'],
    ['cat-rentals', 'Rentals', 15, 'Shamiana, chairs, tables and serving ware'],
    ['cat-gifts', 'Return gifts', 10, 'Small gifts for guests'],
    ['cat-contingency', 'Contingency', 8, 'Buffer for extras'],
  ],
  community: [
    ['cat-venue', 'Venue & permits', 15, 'Hall or ground booking and local permissions'],
    ['cat-catering', 'Catering', 45, 'Main meal for everyone'],
    ['cat-decor', 'Decor', 8, 'Stage, banners and flowers'],
    ['cat-av', 'Sound & stage', 12, 'PA system, mics and stage lighting'],
    ['cat-logistics', 'Volunteers & logistics', 8, 'Volunteer T-shirts, water, cleanup, transport'],
    ['cat-misc', 'Programme & prizes', 5, 'Cultural programme costs and prizes'],
    ['cat-contingency', 'Contingency', 7, 'Buffer for extras'],
  ],
  corporate: [
    ['cat-venue', 'Venue', 30, 'Conference hall or banquet incl. seating'],
    ['cat-catering', 'Catering', 30, 'Tea breaks, lunch and dinner'],
    ['cat-av', 'AV & tech', 15, 'Projectors, mics, streaming and Wi-Fi'],
    ['cat-decor', 'Branding & decor', 8, 'Stage backdrop, standees and signage'],
    ['cat-entertainment', 'Speakers & entertainment', 7, 'Guest speaker or evening act'],
    ['cat-logistics', 'Logistics', 3, 'Transport, badges and kits'],
    ['cat-contingency', 'Contingency', 7, 'Buffer for surprises'],
  ],
};

// ---------- Task libraries: [title, dueDaysBefore, category, priority] ----------

const TASKS = {
  wedding: [
    ['Book the wedding venue', 120, 'Venue', 'high'],
    ['Shortlist and book the caterer', 110, 'Catering', 'high'],
    ['Finalise the guest list', 100, 'Guests', 'high'],
    ['Book photographer and videographer', 95, 'Photography', 'high'],
    ['Book decorator and agree the mandap design', 80, 'Decor & flowers', 'medium'],
    ['Shop for wedding outfits and jewellery', 75, 'Attire & jewellery', 'high'],
    ['Book makeup artist', 70, 'Attire & jewellery', 'medium'],
    ['Print or send digital invitations', 45, 'Guests', 'high'],
    ['Book music / sound and lights', 40, 'Entertainment', 'medium'],
    ['Plan guest stay and transport', 30, 'Logistics', 'medium'],
    ['Menu tasting with caterer', 25, 'Catering', 'medium'],
    ['Final outfit fittings', 14, 'Attire & jewellery', 'medium'],
    ['Confirm headcount with caterer', 7, 'Catering', 'high'],
    ['Pay vendor advances and share the day-of schedule', 5, 'Contingency', 'high'],
    ['Pack ceremony essentials kit', 2, 'Rituals & priest', 'medium'],
    ['Collect flowers and garlands', 1, 'Decor & flowers', 'high'],
    ['Hand over cash envelopes to a trusted coordinator', 0, 'Contingency', 'medium'],
  ],
  birthday: [
    ['Pick the party theme', 30, 'Decor & theme', 'high'],
    ['Book the venue or party hall', 28, 'Venue', 'high'],
    ['Make the guest list with parents’ numbers', 25, 'Guests', 'high'],
    ['Book entertainer (magician / games host)', 21, 'Entertainment', 'high'],
    ['Send invitations', 18, 'Guests', 'high'],
    ['Order the theme cake', 14, 'Food & cake', 'high'],
    ['Book decorator or buy decor kit', 12, 'Decor & theme', 'medium'],
    ['Finalise the food menu', 10, 'Food & cake', 'medium'],
    ['Buy return gifts', 8, 'Return gifts', 'medium'],
    ['Collect RSVPs and allergy info', 5, 'Guests', 'high'],
    ['Plan the games schedule', 4, 'Entertainment', 'medium'],
    ['Confirm all vendors and timings', 2, 'Venue', 'high'],
    ['Set up decor and the photo corner', 0, 'Decor & theme', 'high'],
    ['Pack a first-aid and wet-wipes kit', 1, 'Contingency', 'low'],
  ],
  anniversary: [
    ['Fix the format (dinner, party or getaway)', 45, 'Venue', 'high'],
    ['Book the venue', 40, 'Venue', 'high'],
    ['Make the guest list', 35, 'Guests', 'high'],
    ['Book caterer or set menu', 30, 'Catering', 'high'],
    ['Book photographer', 28, 'Photography', 'medium'],
    ['Send invitations', 21, 'Guests', 'high'],
    ['Book live music or DJ', 20, 'Entertainment', 'medium'],
    ['Collect old photos for a memory wall', 15, 'Decor & flowers', 'medium'],
    ['Order the cake', 7, 'Catering', 'medium'],
    ['Buy favours and the couple’s gift', 6, 'Gifts & favours', 'medium'],
    ['Confirm headcount with the venue', 3, 'Catering', 'high'],
    ['Collect flowers and set up decor', 0, 'Decor & flowers', 'high'],
  ],
  'baby-shower': [
    ['Fix an auspicious date with family', 40, 'Ceremony & games', 'high'],
    ['Book the venue', 35, 'Venue', 'high'],
    ['Make the guest list', 30, 'Guests', 'high'],
    ['Book caterer', 28, 'Catering', 'high'],
    ['Send invitations', 21, 'Guests', 'high'],
    ['Book decorator for swing/seat and backdrop', 18, 'Decor', 'medium'],
    ['Buy ritual items (bangles, sweets, flowers)', 10, 'Ceremony & games', 'medium'],
    ['Plan games and prizes', 9, 'Ceremony & games', 'low'],
    ['Buy return gifts', 8, 'Return gifts', 'medium'],
    ['Arrange comfortable seating for mom-to-be', 4, 'Venue', 'high'],
    ['Confirm headcount with caterer', 3, 'Catering', 'high'],
    ['Set up decor', 0, 'Decor', 'high'],
  ],
  housewarming: [
    ['Fix griha pravesh muhurtham with priest', 30, 'Pooja & rituals', 'high'],
    ['Make the guest list', 25, 'Guests', 'high'],
    ['Book caterer', 21, 'Catering', 'high'],
    ['Send invitations', 18, 'Guests', 'high'],
    ['Book shamiana, chairs and tables', 14, 'Rentals', 'medium'],
    ['Deep-clean the house', 7, 'Venue', 'high'],
    ['Buy pooja items and kalash', 6, 'Pooja & rituals', 'high'],
    ['Buy return gifts', 6, 'Return gifts', 'medium'],
    ['Arrange parking help for guests', 3, 'Rentals', 'low'],
    ['Confirm headcount with caterer', 3, 'Catering', 'high'],
    ['Order flowers, toran and rangoli colours', 2, 'Decor & flowers', 'medium'],
    ['Boil milk and set up the pooja area', 0, 'Pooja & rituals', 'high'],
  ],
  community: [
    ['Form the organising committee', 45, 'Volunteers & logistics', 'high'],
    ['Book the hall or ground and apply for permits', 40, 'Venue & permits', 'high'],
    ['Book the caterer', 35, 'Catering', 'high'],
    ['Open registrations / collect contributions', 30, 'Volunteers & logistics', 'high'],
    ['Book sound, stage and lights', 25, 'Sound & stage', 'medium'],
    ['Plan the cultural programme', 21, 'Programme & prizes', 'medium'],
    ['Assign volunteer roles (food, seating, cleanup)', 14, 'Volunteers & logistics', 'high'],
    ['Print banners and signage', 10, 'Decor', 'low'],
    ['Set up an expense sheet and receipts box', 9, 'Contingency', 'medium'],
    ['Confirm headcount with caterer', 5, 'Catering', 'high'],
    ['Buy prizes and certificates', 4, 'Programme & prizes', 'low'],
    ['Arrange drinking water and waste bins', 2, 'Volunteers & logistics', 'high'],
    ['Volunteer briefing', 1, 'Volunteers & logistics', 'high'],
    ['Set up venue and run the day', 0, 'Venue & permits', 'high'],
  ],
  corporate: [
    ['Define goals, audience and agenda', 60, 'Logistics', 'high'],
    ['Book the venue', 50, 'Venue', 'high'],
    ['Confirm speakers', 45, 'Speakers & entertainment', 'high'],
    ['Book AV and streaming partner', 40, 'AV & tech', 'high'],
    ['Book caterer', 35, 'Catering', 'high'],
    ['Open registrations', 30, 'Logistics', 'high'],
    ['Design branding and print collateral', 20, 'Branding & decor', 'medium'],
    ['Arrange transport and parking', 14, 'Logistics', 'medium'],
    ['Collect speaker slides', 7, 'AV & tech', 'medium'],
    ['Print badges and kits', 4, 'Logistics', 'medium'],
    ['AV rehearsal / tech check', 1, 'AV & tech', 'high'],
    ['Run the event and collect feedback', 0, 'Logistics', 'high'],
  ],
};

const CULTURE_WEDDING_TASKS = {
  Kerala: [['Fix muhurtham with priest', 130, 'Rituals & priest', 'high']],
  Tamil: [['Fix muhurtham with priest', 130, 'Rituals & priest', 'high']],
  Telugu: [['Fix muhurtham with priest', 130, 'Rituals & priest', 'high']],
  Kannada: [['Fix muhurtham with priest', 130, 'Rituals & priest', 'high']],
  'North Indian': [['Book mehendi artist', 60, 'Attire & jewellery', 'medium']],
  Punjabi: [['Book mehendi artist and dhol for sangeet', 60, 'Entertainment', 'medium']],
  Gujarati: [['Book mehendi artist and garba DJ', 60, 'Entertainment', 'medium']],
  Marathi: [['Fix muhurta and book mehendi artist', 60, 'Rituals & priest', 'medium']],
  Jain: [['Confirm Jain menu (no root vegetables) with caterer', 60, 'Catering', 'high']],
  Bengali: [['Fix lagna with purohit', 120, 'Rituals & priest', 'high']],
  Muslim: [['Nikah arrangements with qazi and nikahnama', 60, 'Rituals & priest', 'high']],
  Christian: [['Publish church banns and book the church', 90, 'Rituals & priest', 'high']],
};

const CULTURE_COMMUNITY_TASKS = {
  Kerala: [['Organise pookalam (flower carpet) team', 3, 'Decor', 'medium']],
};

// ---------- Vendors: [categoryId, type, share of category, notes, priority] ----------

const VENDORS = {
  wedding: [
    ['cat-catering', 'Caterer', 0.95, 'Ask for per-plate rates and a tasting', 'must-have'],
    [
      'cat-venue',
      'Wedding hall / auditorium',
      0.9,
      'Check capacity, parking and power backup',
      'must-have',
    ],
    [
      'cat-decor',
      'Mandap & floral decorator',
      0.85,
      'Get a 3D mock-up or past photos',
      'must-have',
    ],
    [
      'cat-photo',
      'Photographer & videographer',
      1,
      'Confirm deliverables and album timeline',
      'must-have',
    ],
    [
      'cat-rituals',
      'Priest / officiant',
      0.5,
      'Confirm ceremony duration and items list',
      'must-have',
    ],
    ['cat-attire', 'Bridal makeup artist', 0.3, 'Book a trial session', 'nice-to-have'],
    ['cat-entertainment', 'Live music band', 0.6, 'Ask for a sample set list', 'nice-to-have'],
    ['cat-entertainment', 'Sound & lighting', 0.4, 'Include generator backup', 'must-have'],
  ],
  birthday: [
    ['cat-venue', 'Party hall / clubhouse', 0.9, 'Check kid-safe space and AC', 'must-have'],
    ['cat-catering', 'Kids’ party caterer', 0.6, 'Ask for a kid-friendly menu', 'must-have'],
    ['cat-catering', 'Theme cake baker', 0.3, 'Share the theme and serving count', 'must-have'],
    [
      'cat-decor',
      'Balloon & theme decorator',
      0.9,
      'Ask for a backdrop + photo corner',
      'must-have',
    ],
    [
      'cat-entertainment',
      'Magician / games host',
      0.9,
      'Confirm show length and age range',
      'must-have',
    ],
    ['cat-gifts', 'Return gift supplier', 1, 'Bulk pricing for the guest count', 'nice-to-have'],
    ['cat-photo', 'Candid photographer', 1, '2-hour coverage is usually enough', 'nice-to-have'],
  ],
  anniversary: [
    [
      'cat-venue',
      'Restaurant private dining / banquet',
      0.9,
      'Ask about decor allowed',
      'must-have',
    ],
    ['cat-catering', 'Caterer or set menu', 0.9, 'Include the anniversary cake', 'must-have'],
    [
      'cat-decor',
      'Florist & table decor',
      0.9,
      'Keep the couple’s favourite flowers',
      'nice-to-have',
    ],
    ['cat-photo', 'Photographer', 1, 'Include a short couple shoot', 'must-have'],
    [
      'cat-entertainment',
      'Live musician / DJ',
      0.9,
      'Share a playlist of their old favourites',
      'nice-to-have',
    ],
  ],
  'baby-shower': [
    ['cat-venue', 'Banquet / community hall', 0.9, 'Ground floor or lift access', 'must-have'],
    ['cat-catering', 'Caterer', 0.95, 'Light, home-style menu works best', 'must-have'],
    [
      'cat-decor',
      'Decorator (swing & backdrop)',
      0.9,
      'Comfortable seat for the mom-to-be',
      'must-have',
    ],
    [
      'cat-rituals',
      'Ritual items & bangle seller',
      0.6,
      'Glass bangles, flowers, sweets',
      'nice-to-have',
    ],
    ['cat-gifts', 'Return gift supplier', 1, 'Bulk pricing for the guest count', 'nice-to-have'],
  ],
  housewarming: [
    ['cat-catering', 'Caterer', 0.95, 'Vegetarian menu is customary', 'must-have'],
    ['cat-rituals', 'Priest for griha pravesh', 0.6, 'Get the pooja items list early', 'must-have'],
    [
      'cat-rentals',
      'Shamiana & furniture rental',
      0.9,
      'Chairs, tables, serving counters',
      'must-have',
    ],
    [
      'cat-decor',
      'Florist (toran & rangoli)',
      0.9,
      'Fresh mango-leaf toran for the door',
      'nice-to-have',
    ],
    ['cat-gifts', 'Return gift supplier', 1, 'Steel or eco-friendly gifts', 'nice-to-have'],
  ],
  community: [
    ['cat-catering', 'Bulk caterer', 0.95, 'Get per-plate rates and serving staff', 'must-have'],
    ['cat-venue', 'Community hall / ground', 0.8, 'Check permits and toilets', 'must-have'],
    ['cat-av', 'Sound & stage rental', 0.95, 'Two mics + speaker for announcements', 'must-have'],
    ['cat-decor', 'Banner printer & decorator', 0.9, 'Bilingual signage helps', 'nice-to-have'],
    ['cat-logistics', 'Water, cleanup & waste service', 0.8, 'Plan segregated bins', 'must-have'],
    ['cat-misc', 'Trophies & prizes shop', 0.8, 'Order a few extras', 'nice-to-have'],
  ],
  corporate: [
    ['cat-venue', 'Conference venue / banquet', 0.9, 'Check breakout rooms and Wi-Fi', 'must-have'],
    ['cat-catering', 'Corporate caterer', 0.95, 'Tea breaks + lunch, dietary labels', 'must-have'],
    ['cat-av', 'AV & streaming partner', 0.95, 'Projector, mics, recording', 'must-have'],
    ['cat-decor', 'Branding & print vendor', 0.9, 'Backdrop, standees, badges', 'must-have'],
    ['cat-entertainment', 'Speaker / emcee', 0.9, 'Confirm topic and slot', 'nice-to-have'],
    ['cat-logistics', 'Transport partner', 0.9, 'Pick-up from metro / office', 'nice-to-have'],
  ],
};

const CULTURE_VENDOR_TWEAKS = {
  Kerala: {
    Caterer: 'Kerala sadhya caterer',
    'Live music band': 'Chenda melam / nadaswaram troupe',
  },
  Tamil: {
    Caterer: 'South Indian banana-leaf caterer',
    'Live music band': 'Nadaswaram & thavil troupe',
  },
  Telugu: { Caterer: 'Andhra-style caterer' },
  Kannada: { Caterer: 'Karnataka-style caterer' },
  Punjabi: { 'Live music band': 'Dhol players & DJ' },
  Gujarati: { 'Live music band': 'Garba / dandiya band' },
  Bengali: { 'Live music band': 'Shehnai & dhaak players' },
  Muslim: { 'Priest / officiant': 'Qazi for nikah', Caterer: 'Mughlai / biryani caterer' },
  Christian: { 'Priest / officiant': 'Church & officiant', 'Live music band': 'Choir / live band' },
  Jain: { Caterer: 'Jain-food caterer (no root vegetables)' },
};

const NORTH_WEDDING = new Set(['North Indian', 'Punjabi', 'Gujarati', 'Marathi', 'Jain']);

// ---------- Ideas ----------
// Each idea: [title, description, why(ctx)] where ctx carries the user's inputs.

const STYLE_THEMES = {
  traditional: [
    [
      'Marigold & mango-leaf toran entrance',
      'Fresh marigold strings and mango-leaf garlands framing every doorway, brass lamps along the path.',
      (c) =>
        `A classic welcome that suits a ${c.typeLabel} in ${c.city} and photographs beautifully.`,
    ],
    [
      'Brass & banana-leaf accents',
      'Brass uruli with floating flowers, banana-stem pillars and kolam/rangoli at the stage.',
      (c) =>
        `Traditional pieces can be rented locally in ${c.city}, keeping decor within ${c.decorBudget}.`,
    ],
  ],
  'modern-minimal': [
    [
      'Ivory & gold minimal stage',
      'One statement backdrop in ivory drapes, a few gold accents and warm fairy lights.',
      (c) => `A single focal point keeps decor within ${c.decorBudget} while looking premium.`,
    ],
    [
      'Monochrome florals',
      'Single-colour flower clusters on tables instead of heavy arches.',
      (c) => `Fewer, bolder flowers stretch ${c.decorBudget} further for ${c.guests} guests.`,
    ],
  ],
  eco: [
    [
      'Zero-plastic decor',
      'Fabric drapes, potted plants, paper lanterns and reusable signage boards.',
      (c) => `Eco choices suit ${c.guests} guests without single-use waste${c.prefsNote}.`,
    ],
    [
      'Potted-plant centrepieces',
      'Guests take the plants home at the end — decor and return gift in one.',
      (c) => `Doubles as a gift for ${c.guests} guests, saving on both decor and favours.`,
    ],
  ],
  'budget-smart': [
    [
      'DIY photo corner',
      'One printed backdrop, a fairy-light curtain and a few props.',
      (c) => `Costs a fraction of full-venue decor — useful at ${c.perGuest} per guest.`,
    ],
    [
      'Rent, don’t buy',
      'Rent urns, lamps and drapes from a local decor shop instead of buying.',
      (c) => `Renting in ${c.city} keeps decor under ${c.decorBudget}.`,
    ],
  ],
  grand: [
    [
      'Floral canopy walkway',
      'A tunnel of jasmine and roses leading guests to the main stage.',
      (c) =>
        `A memorable entry for ${c.guests} guests; fits the ${c.budgetLabel} plan if venue costs stay on track.`,
    ],
    [
      'Lighting show finale',
      'Choreographed LED and pixel lighting during the key moment.',
      (c) => `Creates a wow moment that ${c.guests} guests will share.`,
    ],
  ],
};

const TYPE_THEMES = {
  wedding: [
    [
      'Story-of-us wall',
      'A timeline of the couple’s photos along the entrance.',
      (c) => `A personal touch for ${c.guests} guests that costs little.`,
    ],
  ],
  birthday: [
    [
      'Jungle safari theme',
      'Animal cut-outs, green balloons and a safari-hat welcome.',
      (c) => `Kids aged around ${c.kidsAgeHint} love themes they can play in.`,
    ],
    [
      'Space explorer theme',
      'Planet balloons, star lights and a “rocket” photo booth.',
      (c) => `Easy to do with balloons and lights within ${c.decorBudget}.`,
    ],
  ],
  anniversary: [
    [
      'Then & now photo gallery',
      'Pair wedding-day photos with recent ones on a string-light wall.',
      (c) => `Celebrates the couple in front of ${c.guests} loved ones.`,
    ],
  ],
  'baby-shower': [
    [
      'Soft pastel floral swing',
      'A decorated swing or seat with pastel flowers for the mom-to-be.',
      (c) => `Keeps her comfortable and is the natural photo spot for ${c.guests} guests.`,
    ],
  ],
  housewarming: [
    [
      'Rangoli & diya welcome',
      'Large rangoli at the gate and diyas along the steps.',
      (c) => `Auspicious and inexpensive — perfect for a new home in ${c.city}.`,
    ],
  ],
  community: [
    [
      'Festival-street look',
      'Bunting, paper lanterns and a stage with a cultural backdrop.',
      (c) => `Simple, bright decor scales to ${c.guests} people on ${c.decorBudget}.`,
    ],
  ],
  corporate: [
    [
      'Branded journey wall',
      'A timeline of company milestones as the entry tunnel.',
      (c) => `Gives ${c.guests} attendees a talking point and photo spot.`,
    ],
  ],
};

// [title, description, why(ctx), vegFriendly]
const CULTURE_FOOD = {
  Kerala: [
    [
      'Kerala sadhya on banana leaf',
      'A full sadhya: avial, olan, __KERALA_VEG_DISH_UTSAV__, sambar, two payasams, served on banana leaves.',
      (c) =>
        `The heart of a ${c.culture} celebration — and plantain-leaf service suits ${c.guests} guests.`,
      true,
    ],
  ],
  Tamil: [
    [
      'Banana-leaf South Indian feast',
      'Sambar, rasam, kootu, poriyal, vadai and payasam served on leaves.',
      (c) => `Traditional for a ${c.culture} event and easy to scale to ${c.guests} guests.`,
      true,
    ],
  ],
  Telugu: [
    [
      'Andhra bhojanam',
      'Pulihora, gongura pachadi, pappu and bobbatlu with ghee.',
      (c) => `Brings ${c.culture} flavours your guests will expect.`,
      true,
    ],
  ],
  Kannada: [
    [
      'Karnataka oota',
      'Bisibele bath, kosambari, holige and mysore pak on banana leaves.',
      (c) => `A ${c.culture} classic that stays mostly vegetarian.`,
      true,
    ],
  ],
  'North Indian': [
    [
      'North Indian buffet',
      'Paneer tikka, dal makhani, naan station and gulab jamun.',
      (c) => `A crowd-pleaser for ${c.guests} guests in ${c.city}.`,
      true,
    ],
  ],
  Punjabi: [
    [
      'Punjabi dhaba counter',
      'Sarson da saag, makki di roti, chole-kulche and lassi.',
      (c) => `Hearty ${c.culture} food that suits a lively crowd.`,
      true,
    ],
  ],
  Gujarati: [
    [
      'Gujarati thali',
      'Dhokla, undhiyu, kadhi, thepla and shrikhand.',
      (c) => `A ${c.culture} favourite that is fully vegetarian.`,
      true,
    ],
  ],
  Marathi: [
    [
      'Maharashtrian pangat',
      'Puran poli, masale bhaat, amti and solkadhi.',
      (c) => `Honours ${c.culture} tradition at a reasonable per-plate cost.`,
      true,
    ],
  ],
  Bengali: [
    [
      'Bengali bhoj',
      'Luchi, shukto, cholar dal, mishti doi and rosogolla.',
      (c) => `Classic ${c.culture} courses your guests will love.`,
      true,
    ],
  ],
  Jain: [
    [
      'Jain thali (no root vegetables)',
      'Satvik dishes without onion, garlic or root vegetables.',
      (c) => `Respects ${c.culture} dietary rules for every guest.`,
      true,
    ],
  ],
  Muslim: [
    [
      'Biryani & kebab spread',
      'Dum biryani, seekh kebabs, mirchi ka salan and sheer khurma.',
      (c) => `A ${c.culture} celebration favourite for ${c.guests} guests.`,
      false,
    ],
  ],
  Christian: [
    [
      'Celebration feast & cake',
      'Appam with stew, roast, and a tiered celebration cake.',
      (c) => `Fits a ${c.culture} celebration in ${c.city}.`,
      false,
    ],
  ],
};

const GENERIC_FOOD = [
  [
    'Live chaat & dosa counters',
    'Freshly made counters keep queues moving and food hot.',
    (c) => `Live counters work well for ${c.guests} guests and cut wastage.`,
    true,
  ],
  [
    'Regional dessert station',
    'Three local sweets plus one fusion dessert.',
    (c) => `Local sweets from ${c.city} keep costs at about ${c.perGuest} per guest.`,
    true,
  ],
  [
    'Mocktail & sharbat bar',
    'Nannari sharbat, aam panna and lime soda in glass dispensers.',
    (c) => `Refreshing, alcohol-free and cheap per glass for ${c.guests} guests.`,
    true,
  ],
  [
    'Millet & salad corner',
    'A healthy corner with millet salads and fruit.',
    (c) => `Gives lighter options${c.prefsNote}.`,
    true,
  ],
  [
    'Mini-portion kids’ menu',
    'Mini dosas, idli pops, pasta and fruit cups.',
    (c) => `Keeps the youngest of your ${c.guests} guests happy.`,
    true,
  ],
];

const TYPE_ACTIVITIES = {
  wedding: [
    [
      'Sangeet / music night',
      'Family dance performances the evening before.',
      () => `Brings both families together before the big day.`,
    ],
    [
      'Couple’s grand entry',
      'A choreographed entry with music or a traditional band.',
      (c) => `A highlight moment for ${c.guests} guests.`,
    ],
  ],
  birthday: [
    [
      'Magic show',
      'A 45-minute interactive magic show.',
      (c) => `Holds attention for a group of ${c.guests}.`,
    ],
    [
      'Treasure hunt',
      'Clue cards hidden around the venue leading to a prize box.',
      (c) => `Needs only printouts, ideal for ${c.guests} kids.`,
    ],
    [
      'Craft corner',
      'Mask-making or clay modelling table with a helper.',
      () => `A calm activity for younger guests that they take home.`,
    ],
  ],
  anniversary: [
    [
      'Couple quiz',
      'Guests answer “how well do you know them” questions.',
      (c) => `Fun and personal with ${c.guests} close guests.`,
    ],
    [
      'Vow renewal moment',
      'A short heartfelt renewal with family blessings.',
      () => `Makes the evening meaningful at no extra cost.`,
    ],
  ],
  'baby-shower': [
    [
      'Guess the baby food',
      'Blindfolded tasting game with prizes.',
      (c) => `Light-hearted and easy for ${c.guests} guests.`,
    ],
    [
      'Blessings jar',
      'Guests write wishes for the baby on cards.',
      () => `A keepsake the family will treasure.`,
    ],
  ],
  housewarming: [
    [
      'House tour with stories',
      'A short guided tour sharing the home’s story.',
      (c) => `Lets ${c.guests} guests feel part of your new home.`,
    ],
    [
      'Plant-a-sapling corner',
      'Guests plant herbs in pots for the balcony.',
      () => `A green memory of the day.`,
    ],
  ],
  community: [
    [
      'Cultural programme',
      'Songs, dances and skits by members of all ages.',
      (c) => `Gets ${c.guests} people involved, not just watching.`,
    ],
    [
      'Traditional games',
      'Tug of war, lemon-and-spoon and musical chairs.',
      () => `Needs almost no budget and works for all ages.`,
    ],
  ],
  corporate: [
    [
      'Fireside chat',
      'A moderated conversation with a leader or guest.',
      (c) => `Engages ${c.guests} attendees more than slides.`,
    ],
    [
      'Team challenge',
      'A 30-minute problem-solving game in mixed teams.',
      (c) => `Builds connections across ${c.guests} attendees.`,
    ],
  ],
};

const CULTURE_ACTIVITIES = {
  Kerala: [
    [
      'Pookalam competition',
      'Teams create flower carpets; elders judge.',
      (c) => `A beloved ${c.culture} tradition that gets everyone involved.`,
    ],
  ],
  Gujarati: [
    [
      'Garba circle',
      'An hour of garba with a live dhol.',
      (c) => `A ${c.culture} favourite that everyone can join.`,
    ],
  ],
  Punjabi: [
    [
      'Bhangra session',
      'A dhol-led bhangra warm-up for all ages.',
      (c) => `Brings ${c.culture} energy to the floor.`,
    ],
  ],
  Bengali: [
    [
      'Adda & songs corner',
      'Rabindra sangeet and relaxed conversation.',
      (c) => `A warm ${c.culture} touch.`,
    ],
  ],
};

const GENERIC_ACTIVITIES = [
  [
    'Photo booth with props',
    'A backdrop with culture-themed props and instant prints.',
    (c) => `Every one of your ${c.guests} guests leaves with a memory.`,
  ],
  [
    'Blessings / wishes wall',
    'Guests pin notes on a decorated board.',
    () => `A keepsake that costs very little.`,
  ],
  [
    'Live performer',
    'A local singer or instrumentalist during dinner.',
    (c) => `Local artists in ${c.city} are affordable and add warmth.`,
  ],
];

const STYLE_EXTRAS = {
  traditional: [
    [
      'Brass diya return gifts',
      'Small brass diyas wrapped in cloth pouches.',
      (c) => `Auspicious and lasting; bulk pricing in ${c.city} keeps it affordable.`,
    ],
  ],
  'modern-minimal': [
    [
      'Digital invite + RSVP link',
      'One WhatsApp-friendly invite with a map link.',
      (c) => `Saves printing costs for ${c.guests} guests.`,
    ],
  ],
  eco: [
    [
      'Seed-paper invitations',
      'Invites that guests can plant afterwards.',
      (c) => `An eco-friendly start${c.prefsNote}.`,
    ],
  ],
  'budget-smart': [
    [
      'Bulk-buy return gifts',
      'Order one useful item in bulk, e.g. steel tumblers or notebooks.',
      (c) => `Bulk rates for ${c.guests} guests stretch the ${c.budgetLabel} budget.`,
    ],
  ],
  grand: [
    [
      'Guest welcome kits',
      'Water, snacks and a printed programme at each seat.',
      (c) => `Makes ${c.guests} guests feel cared for.`,
    ],
  ],
};

const TYPE_EXTRAS = {
  birthday: [
    [
      'Themed return-gift bags',
      'Activity books, crayons and a small toy in theme bags.',
      (c) => `Fits the gift budget for ${c.guests} kids.`,
    ],
  ],
  community: [
    [
      'Volunteer roster board',
      'A visible chart of who does what and when.',
      (c) => `Keeps ${c.guests} people’s event running without one person doing it all.`,
    ],
  ],
  corporate: [
    [
      'Feedback QR codes',
      'QR codes on tables linking to a 3-question survey.',
      (c) => `Measures success with ${c.guests} attendees.`,
    ],
  ],
};

const GENERIC_EXTRAS = [
  [
    'Steel-plate & cloth-napkin service',
    'Avoid disposables: rent steel plates and glasses.',
    (c) => `Cuts waste for ${c.guests} guests at a similar cost.`,
  ],
  [
    'Rain plan',
    'Keep a covered area or shamiana on standby.',
    (c) => `Weather in ${c.city} can surprise you — the contingency budget covers it.`,
  ],
  [
    'Guest WhatsApp group',
    'One group for timings, location and photos afterwards.',
    (c) => `Free and easy coordination for ${c.guests} guests.`,
  ],
];

// ---------- Helpers ----------

const PER_GUEST_MIN = {
  wedding: 1000,
  birthday: 400,
  anniversary: 600,
  'baby-shower': 400,
  housewarming: 300,
  community: 200,
  corporate: 800,
};

const typeLabel = (type) => EVENT_TYPES.find((t) => t.value === type)?.label.toLowerCase() ?? type;

function ideaContext(meta) {
  const decor = BUDGETS[meta.type].find(([id]) => id === 'cat-decor');
  return {
    typeLabel: typeLabel(meta.type),
    guests: formatNumber(meta.guests),
    city: meta.city,
    culture: meta.culture || 'family',
    budgetLabel: formatINR(meta.budget),
    perGuest: formatINR(Math.round(meta.budget / meta.guests)),
    decorBudget: formatINR(categoryAmount(meta.budget, decor ? decor[2] : 10)),
    prefsNote: meta.prefs ? ` and matches your note: “${meta.prefs.slice(0, 60)}”` : '',
    kidsAgeHint: '5–10',
  };
}

const toIdea =
  (ctx) =>
  ([title, description, why]) => ({ title, description, whyItFits: why(ctx) });

/** Rotate `list` by `offset`, skip avoided titles, take `count` (falls back to avoided ones). */
function pick(list, count, offset, avoid) {
  const n = list.length;
  const rotated = list.map((_, i) => list[(i + offset) % n]);
  const fresh = rotated.filter((item) => !avoid.has(item[0]));
  const used =
    fresh.length >= count ? fresh : [...fresh, ...rotated.filter((i) => avoid.has(i[0]))];
  return used.slice(0, count);
}

const isVegOnly = (meta) =>
  meta.culture === 'Jain' || /\b(veg|vegetarian|jain|satvik|sattvic)\b/i.test(meta.prefs);

/** Ideas in four sections; `styleSeed` rotates the mix so regenerate gives a fresh set. */
export function buildFallbackIdeas(meta, styleSeed = 'traditional', avoidTitles = []) {
  const ctx = ideaContext(meta);
  const seedIndex = Math.max(0, STYLE_SEEDS.indexOf(styleSeed));
  const avoid = new Set(avoidTitles);
  const vegOnly = isVegOnly(meta);

  const themes = [...STYLE_THEMES[STYLE_SEEDS[seedIndex]], ...(TYPE_THEMES[meta.type] ?? [])];
  for (const seed of STYLE_SEEDS)
    if (seed !== STYLE_SEEDS[seedIndex]) themes.push(...STYLE_THEMES[seed]);

  // Culture food always leads (e.g. Kerala → sadhya), then rotating generic options.
  const dietOk = ([, , , veg]) => !vegOnly || veg;
  const leadFood = (CULTURE_FOOD[meta.culture] ?? []).filter(dietOk).slice(0, 1);
  const food = [
    ...leadFood,
    ...pick(GENERIC_FOOD.filter(dietOk), 4 - leadFood.length, seedIndex, avoid),
  ];

  const activities = [
    ...(CULTURE_ACTIVITIES[meta.culture] ?? []),
    ...TYPE_ACTIVITIES[meta.type],
    ...GENERIC_ACTIVITIES,
  ];
  const extras = [
    ...STYLE_EXTRAS[STYLE_SEEDS[seedIndex]],
    ...(TYPE_EXTRAS[meta.type] ?? []),
    ...GENERIC_EXTRAS,
  ];

  const make = toIdea(ctx);
  return {
    theme: pick(themes, 4, 0, avoid).map(make),
    food: food.map(make),
    activities: pick(activities, 4, seedIndex % 2, avoid).map(make),
    extras: pick(extras, 3, 0, avoid).map(make),
  };
}

function buildTasks(meta, daysLeft) {
  const library = [...TASKS[meta.type]];
  if (meta.type === 'wedding') library.push(...(CULTURE_WEDDING_TASKS[meta.culture] ?? []));
  if (meta.type === 'community') library.push(...(CULTURE_COMMUNITY_TASKS[meta.culture] ?? []));

  // Compress the schedule proportionally when the event is closer than the library assumes.
  const maxDays = Math.max(...library.map(([, d]) => d));
  const scale = maxDays > daysLeft ? daysLeft / maxDays : 1;
  const taken = new Set();

  return library
    .map(([title, d, category, priority]) => ({
      title,
      dueDaysBefore: Math.floor(d * scale),
      category,
      priority,
    }))
    .sort((a, b) => b.dueDaysBefore - a.dueDaysBefore)
    .slice(0, 25)
    .map((task) => {
      const id = uniqueId(`task-${slugify(task.title)}`, taken);
      taken.add(id);
      return { id, ...task };
    });
}

function buildVendors(meta, categories) {
  const tweaks = CULTURE_VENDOR_TWEAKS[meta.culture] ?? {};
  const list = [...VENDORS[meta.type]];
  if (meta.type === 'wedding' && NORTH_WEDDING.has(meta.culture)) {
    list.push([
      'cat-attire',
      'Mehendi artist',
      0.1,
      'Ask for per-hand rates for guests',
      'nice-to-have',
    ]);
  }
  const taken = new Set();
  return list.map(([categoryId, type, share, notes, priority]) => {
    const category = categories.find((c) => c.id === categoryId);
    const label = tweaks[type] ?? type;
    const id = uniqueId(`ven-${slugify(type)}`, taken);
    taken.add(id);
    return {
      id,
      category: category.name,
      type: label,
      estCost: Math.round(categoryAmount(meta.budget, category.percent) * share),
      notes,
      priority,
    };
  });
}

function buildWarnings(meta, daysLeft, categories) {
  const warnings = [];
  const perGuest = Math.round(meta.budget / meta.guests);
  if (perGuest < PER_GUEST_MIN[meta.type]) {
    const catering = categories.find((c) => c.id === 'cat-catering');
    const perPlate = catering
      ? Math.round(categoryAmount(meta.budget, catering.percent) / meta.guests)
      : perGuest;
    warnings.push(
      `${formatINR(meta.budget)} for ${formatNumber(meta.guests)} guests is very tight — about ${formatINR(perGuest)} per guest (~${formatINR(perPlate)}/plate). Consider a shorter guest list or a simpler menu.`,
    );
  }
  if (meta.type === 'wedding' && daysLeft < 30) {
    warnings.push(
      `Only ${daysLeft} days left for a wedding — book the venue and caterer today; popular dates fill fast.`,
    );
  } else if (daysLeft < 7) {
    warnings.push(`Only ${daysLeft} days left — focus on the high-priority tasks first.`);
  }
  return warnings;
}

/**
 * Build a complete plan without AI. Must pass PlanSchema for every valid intake.
 * @param {object} meta  validated intake (type, date, budget, guests, city, culture, prefs)
 * @param {string} today "YYYY-MM-DD" in IST
 */
export function buildFallbackPlan(meta, today) {
  const daysLeft = daysLeftUntil(meta.date, today);
  const categories = BUDGETS[meta.type].map(([id, name, percent, notes]) => ({
    id,
    name,
    percent,
    notes,
  }));
  const label = typeLabel(meta.type);

  return {
    summary: `A ${meta.culture ? `${meta.culture} ` : ''}${label} plan for ${formatNumber(meta.guests)} guests in ${meta.city} on a ${formatINR(meta.budget)} budget, ${daysLeft} days out. Catering and venue take the biggest share — start with the high-priority bookings.`,
    budget: { categories },
    tasks: buildTasks(meta, daysLeft),
    vendors: buildVendors(meta, categories),
    ideas: buildFallbackIdeas(meta, 'traditional'),
    warnings: buildWarnings(meta, daysLeft, categories),
  };
}
