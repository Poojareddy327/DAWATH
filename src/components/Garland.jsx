// Dawat royal header: Kakatiya Kala Thoranam & Hyderabadi scalloped arch motif
// with golden Tangedu blossoms, marigold swags, mango leaves, and Basra pearl drops.
const MARIGOLDS = [
  [8, 10, 4.2],
  [22, 17, 4.8],
  [40, 21, 5.2],
  [58, 17, 4.8],
  [72, 10, 4.2],
];

export default function Garland() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="garland-sway block h-14 w-full"
      preserveAspectRatio="xMidYMin slice"
    >
      <defs>
        <pattern id="dawat-swag" width="80" height="52" patternUnits="userSpaceOnUse">
          {/* Hyderabadi Scalloped Arch & Kakatiya Curve in Nizam Gold & Emerald */}
          <path d="M0 6 Q20 28 40 28 Q60 28 80 6" fill="none" stroke="#d97706" strokeWidth="1.8" />
          <path
            d="M0 8 Q20 30 40 30 Q60 30 80 8"
            fill="none"
            stroke="#064e3b"
            strokeWidth="1.2"
            strokeDasharray="2,2"
          />

          {/* Marigolds & Telangana Tangedu floral clusters */}
          {MARIGOLDS.map(([cx, cy, r], i) => (
            <g key={cx}>
              {/* Petal cluster */}
              <circle cx={cx} cy={cy} r={r} fill={i % 2 === 0 ? '#d97706' : '#f59e0b'} />
              <circle cx={cx} cy={cy} r={r * 0.65} fill="#fbbf24" />
              <circle cx={cx} cy={cy} r={r * 0.3} fill="#78350f" />
            </g>
          ))}

          {/* Mango Leaves (Mamidi Thoranam) */}
          <path d="M40 27 q-6 10 0 21 q6 -11 0 -21z" fill="#047857" />
          <path d="M40 29 v17" stroke="#064e3b" strokeWidth="0.8" />

          <path d="M22 23 q-5 8 0 17 q5 -9 0 -17z" fill="#059669" />
          <path d="M58 23 q-5 8 0 17 q5 -9 0 -17z" fill="#059669" />

          {/* Basra Pearl Drop with Nizam gold finial */}
          <circle cx="40" cy="49" r="2.2" fill="#fef08a" stroke="#d97706" strokeWidth="0.5" />
          <line x1="40" y1="46" x2="40" y2="48" stroke="#d97706" strokeWidth="0.8" />

          {/* Arch pillars / joint rosettes */}
          <circle cx="0" cy="6" r="3.5" fill="#064e3b" stroke="#d97706" strokeWidth="1" />
          <circle cx="0" cy="6" r="1.5" fill="#fbbf24" />
          <circle cx="80" cy="6" r="3.5" fill="#064e3b" stroke="#d97706" strokeWidth="1" />
          <circle cx="80" cy="6" r="1.5" fill="#fbbf24" />
        </pattern>
      </defs>

      {/* Royal Deccani Emerald top trim with Nizam Gold filigree border */}
      <rect width="100%" height="5" fill="#064e3b" />
      <rect width="100%" height="2" y="5" fill="#d97706" />
      <rect width="100%" height="52" fill="url(#dawat-swag)" />
    </svg>
  );
}
