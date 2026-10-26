// Utsav garland: marigold swags with mango leaves, drawn as a repeating SVG pattern (no images).
const FLOWERS = [
  [8, 9.5, 4.2],
  [20, 16.5, 4.6],
  [40, 20, 5],
  [60, 16.5, 4.6],
  [72, 9.5, 4.2],
];

export default function Garland() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="garland-sway block h-12 w-full"
      preserveAspectRatio="xMidYMin slice"
    >
      <defs>
        <pattern id="utsav-swag" width="80" height="48" patternUnits="userSpaceOnUse">
          <path d="M0 4 Q40 34 80 4" fill="none" stroke="#881337" strokeWidth="1.5" />
          {FLOWERS.map(([cx, cy, r], i) => (
            <g key={cx}>
              <circle cx={cx} cy={cy} r={r} fill={i % 2 ? '#ea580c' : '#f59e0b'} />
              <circle cx={cx} cy={cy} r={r * 0.45} fill="#fde68a" />
            </g>
          ))}
          <path d="M40 25 q-5 9 0 19 q5 -10 0 -19z" fill="#15803d" />
          <path d="M40 27 v15" stroke="#14532d" strokeWidth="0.8" />
          <circle cx="0" cy="4" r="3" fill="#881337" />
          <circle cx="80" cy="4" r="3" fill="#881337" />
        </pattern>
      </defs>
      <rect width="100%" height="4" fill="#881337" />
      <rect width="100%" height="48" fill="url(#utsav-swag)" />
    </svg>
  );
}
