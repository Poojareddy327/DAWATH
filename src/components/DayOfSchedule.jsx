import { useEffect, useState } from 'react';
import { formatDate } from '../lib/format.js';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';

const DEFAULT_SCHEDULES = {
  telugu_wedding: [
    {
      id: 'r-1',
      time: '06:00 AM',
      title: 'Mangala Snanam & Snathakam (Holy Bath & Rituals)',
      note: 'Close family & relatives assemble',
    },
    {
      id: 'r-2',
      time: '08:00 AM',
      title: 'Gauri Puja & Bride/Groom Mandap Entry',
      note: 'Nadaswaram & Shehnai artists start playing',
    },
    {
      id: 'r-3',
      time: '09:27 AM',
      title: 'Auspicious Sumuhurtham (Jeelakarra Bellam)',
      note: 'Sacred paste placed on heads at exact muhurtham',
    },
    {
      id: 'r-4',
      time: '10:15 AM',
      title: 'Kanyadanam & Mangalsutra Dharana',
      note: 'Tying of the three sacred knots',
    },
    {
      id: 'r-5',
      time: '11:00 AM',
      title: 'Talambralu & Saptapadi',
      note: 'Rose petals and sacred turmeric pearls',
    },
    {
      id: 'r-6',
      time: '12:30 PM',
      title: 'Royal Telugu Vindu Bhojanam (Grand Feast)',
      note: 'Dum Biryani, Pindi Vantalu, and traditional sweets',
    },
    {
      id: 'r-7',
      time: '06:30 PM',
      title: 'Appaginthalu & Send-Off Ceremony',
      note: 'Emotional blessing and traditional farewell',
    },
  ],
  hyderabadi_valima: [
    {
      id: 'r-1',
      time: '11:00 AM',
      title: 'Sehra Bandi & Baraat Assembly',
      note: 'Sherwani fitting and family felicitations',
    },
    {
      id: 'r-2',
      time: '01:30 PM',
      title: 'Jumma / Zuhr & Nikah Khawani',
      note: 'Formal consent & Ijab-o-Qubool with Qazi',
    },
    {
      id: 'r-3',
      time: '02:30 PM',
      title: 'Shahi Dawat Feast',
      note: 'Zafrani Dum Biryani, Mirchi Ka Salan, Double Ka Meetha',
    },
    {
      id: 'r-4',
      time: '07:30 PM',
      title: 'Grand Valima Banquet Reception',
      note: 'Stage entry & photo sessions with honored guests',
    },
    {
      id: 'r-5',
      time: '09:00 PM',
      title: 'Marfa Troupe & Festive Celebrations',
      note: 'Traditional Deccani Marfa beats',
    },
  ],
  birthday: [
    {
      id: 'r-1',
      time: '04:30 PM',
      title: 'Venue Setup, Sound & Balloon Decor Inspection',
      note: 'Music playlist & lighting check',
    },
    {
      id: 'r-2',
      time: '06:00 PM',
      title: 'Welcome Drinks & Guest Arrival',
      note: 'Welcome music & photo booth open',
    },
    {
      id: 'r-3',
      time: '07:00 PM',
      title: 'Grand Cake Cutting & Toast',
      note: 'Celebration song & sparklers',
    },
    {
      id: 'r-4',
      time: '07:45 PM',
      title: 'Fun Games, Dance & Activities',
      note: 'Kids & family engagement',
    },
    {
      id: 'r-5',
      time: '08:30 PM',
      title: 'Dinner Buffet & Return Gifts',
      note: 'Hot snacks, mini biryani, dessert',
    },
  ],
  general: [
    {
      id: 'r-1',
      time: '08:00 AM',
      title: 'Morning Setup & Flower Decor Finalization',
      note: 'Fresh floral garlands & seating check',
    },
    {
      id: 'r-2',
      time: '10:30 AM',
      title: 'Guest Welcome & Auspicious Invocation',
      note: 'Traditional welcome drinks & music',
    },
    {
      id: 'r-3',
      time: '12:00 PM',
      title: 'Main Ceremony & Celebrations',
      note: 'Core rituals and speeches',
    },
    {
      id: 'r-4',
      time: '01:30 PM',
      title: 'Grand Festive Feast (Dawat)',
      note: 'Full course catering served hot',
    },
    {
      id: 'r-5',
      time: '04:00 PM',
      title: 'Closing Moments & Return Favors',
      note: 'Thank you gifts distributed',
    },
  ],
};

function getScheduleKey(meta) {
  const c = (meta.culture || '').toLowerCase();
  const t = (meta.type || '').toLowerCase();
  if (t === 'birthday') return 'birthday';
  if (c.includes('telugu') || c.includes('pelli') || (t === 'wedding' && !c.includes('muslim'))) {
    return 'telugu_wedding';
  }
  if (
    c.includes('muslim') ||
    c.includes('nikah') ||
    c.includes('valima') ||
    c.includes('hyderabadi')
  ) {
    return 'hyderabadi_valima';
  }
  return 'general';
}

export default function DayOfSchedule({ event, notify }) {
  const { meta } = event;
  const storageKey = `dawat:dayof:${meta.createdAt ?? 'default'}`;

  const [rituals, setRituals] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    const key = getScheduleKey(meta);
    return DEFAULT_SCHEDULES[key] ?? DEFAULT_SCHEDULES.general;
  });

  const [checkedIds, setCheckedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}:done`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [newTime, setNewTime] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(rituals));
    } catch {
      // ignore
    }
  }, [rituals, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}:done`, JSON.stringify(checkedIds));
    } catch {
      // ignore
    }
  }, [checkedIds, storageKey]);

  const toggleRitual = (id) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleAddRitual = (e) => {
    e.preventDefault();
    if (!newTime.trim() || !newTitle.trim()) return;
    const newEntry = {
      id: `custom-${Date.now()}`,
      time: newTime.trim(),
      title: newTitle.trim(),
      note: 'Custom celebration milestone',
    };
    setRituals((prev) => [...prev, newEntry]);
    setNewTime('');
    setNewTitle('');
    setShowAdd(false);
    notify?.('Ritual added to day-of schedule!');
  };

  const shareWhatsApp = () => {
    const lines = [
      `🕌 *VEDUKA DAWAT — Day-Of Itinerary*`,
      `📅 *Date*: ${formatDate(meta.date)} · ${meta.city}`,
      `✨ *Celebration*: ${meta.culture ? `${meta.culture} ` : ''}${meta.type.toUpperCase()}`,
      '',
      `*Auspicious Chronology & Rituals:*`,
      ...rituals.map((r) => `⏰ *${r.time}* — ${r.title}${r.note ? `\n   _${r.note}_` : ''}`),
      '',
      `🙏 Hosted with joy & Deccani hospitality!`,
    ];

    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  const copyText = async () => {
    const text = rituals.map((r) => `${r.time} — ${r.title} (${r.note})`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      notify?.('Itinerary copied to clipboard!');
    } catch {
      notify?.('Please manually copy the schedule.');
    }
  };

  const doneCount = checkedIds.length;
  const progress = rituals.length > 0 ? Math.round((doneCount / rituals.length) * 100) : 0;

  return (
    <Card aria-labelledby="day-of-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              🪔
            </span>
            <h3
              id="day-of-title"
              className="font-display text-xl font-bold text-purple-950 dark:text-amber-300"
            >
              Day-Of Muhurtham & Ritual Schedule
            </h3>
            <span className="rounded-full border border-amber-400/80 bg-amber-100/90 px-2.5 py-0.5 text-xs font-bold text-amber-950 dark:bg-purple-950 dark:text-amber-200">
              {doneCount}/{rituals.length} Completed ({progress}%)
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
            Auspicious timeline for the big day. Coordinate family, priests, and coordinators.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={shareWhatsApp}>
            💬 WhatsApp Itinerary
          </Button>
          <Button size="sm" variant="ghost" onClick={copyText}>
            📋 Copy
          </Button>
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? 'Close' : '+ Add Ritual'}
          </Button>
        </div>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddRitual}
          className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-4 dark:border-purple-800/60 dark:bg-[#150a2b]"
        >
          <p className="text-xs font-bold text-purple-950 dark:text-amber-200 mb-2">
            Add Day-Of Milestone / Ritual
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Time (e.g. 09:15 AM)"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              required
              className="min-h-10 rounded-xl border border-amber-300 bg-white px-3 text-xs text-stone-900 focus:outline-none dark:border-purple-700 dark:bg-[#100722] dark:text-stone-100"
            />
            <input
              type="text"
              placeholder="Ritual or Activity Name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="sm:col-span-2 min-h-10 rounded-xl border border-amber-300 bg-white px-3 text-xs text-stone-900 focus:outline-none dark:border-purple-700 dark:bg-[#100722] dark:text-stone-100"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Save Ritual
            </Button>
          </div>
        </form>
      )}

      {/* Rituals list with time badges */}
      <ul className="divide-y divide-amber-200/60 dark:divide-purple-900/40">
        {rituals.map((r) => {
          const isDone = checkedIds.includes(r.id);
          return (
            <li
              key={r.id}
              className={`flex items-start gap-3 py-3 transition-colors ${
                isDone ? 'opacity-60' : ''
              }`}
            >
              <input
                id={`ritual-${r.id}`}
                type="checkbox"
                checked={isDone}
                onChange={() => toggleRitual(r.id)}
                className="mt-1 size-5 shrink-0 rounded cursor-pointer accent-purple-950 dark:accent-amber-400"
              />
              <div className="min-w-28 shrink-0">
                <span className="inline-block rounded-lg border border-amber-400/60 bg-gradient-to-r from-amber-100 to-amber-50 px-2 py-0.5 text-xs font-bold text-amber-950 dark:border-amber-400/30 dark:from-purple-950 dark:to-indigo-950 dark:text-amber-200">
                  {r.time}
                </span>
              </div>
              <div className="flex-1">
                <label
                  htmlFor={`ritual-${r.id}`}
                  className={`text-sm font-semibold cursor-pointer ${
                    isDone
                      ? 'text-stone-500 line-through dark:text-stone-400'
                      : 'text-stone-900 dark:text-stone-100'
                  }`}
                >
                  {r.title}
                </label>
                {r.note && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">{r.note}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
