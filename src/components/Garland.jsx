// VEDUKA DAWAT Royal Architectural Crown:
// Chowmahalla & Falaknuma palace cusped multi-foil arches, illuminated Nizam Fanoos lanterns,
// Kakatiya Kala Thoranam scrollwork, and suspended royal amethyst teardrops & Basra pearls.
export default function Garland() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="garland-sway block h-16 w-full"
      preserveAspectRatio="xMidYMin slice"
    >
      <defs>
        {/* Glow filter for royal lanterns */}
        <filter id="fanoos-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <pattern id="veduka-palace-frieze" width="100" height="60" patternUnits="userSpaceOnUse">
          {/* Top Royal Cornice with Lozenge Trim */}
          <rect width="100" height="4" fill="#3b0764" />
          <rect y="4" width="100" height="2" fill="#d97706" />
          <rect y="6" width="100" height="1.5" fill="#f59e0b" />

          {/* Diamond lozenges along cornice */}
          <polygon points="25,4 27,6 25,8 23,6" fill="#fbbf24" />
          <polygon points="50,4 52,6 50,8 48,6" fill="#fbbf24" />
          <polygon points="75,4 77,6 75,8 73,6" fill="#fbbf24" />
          <polygon points="100,4 102,6 100,8 98,6" fill="#fbbf24" />

          {/* Deccani Cusped Multi-foil Arch (Chowmahalla style) */}
          <path
            d="M0,8 C12,8 15,22 25,24 C32,25 35,32 50,33 C65,32 68,25 75,24 C85,22 88,8 100,8"
            fill="none"
            stroke="#d97706"
            strokeWidth="1.8"
          />
          <path
            d="M0,10 C12,10 16,24 25,26 C32,27 36,34 50,35 C64,34 68,27 75,26 C84,24 88,10 100,10"
            fill="none"
            stroke="#7e22ce"
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* Kakatiya Kala Thoranam Spandrel Flourishes */}
          <path d="M0,8 Q12,16 6,24" fill="none" stroke="#f59e0b" strokeWidth="1" />
          <path d="M100,8 Q88,16 94,24" fill="none" stroke="#f59e0b" strokeWidth="1" />

          {/* Center Royal Illuminated Fanoos (Deccani Brass Lantern) */}
          <g transform="translate(50, 33)">
            {/* Hanging chain */}
            <line x1="0" y1="0" x2="0" y2="4" stroke="#d97706" strokeWidth="1" />

            {/* Lantern Dome & Cap */}
            <path d="M-5,4 Q0,1 5,4 L4,6 L-4,6 Z" fill="#d97706" />

            {/* Glass lantern chamber with warm candle glow */}
            <polygon
              points="-4,6 4,6 3,15 -3,15"
              fill="#fef3c7"
              stroke="#b45309"
              strokeWidth="0.8"
            />
            <circle cx="0" cy="10" r="2.2" fill="#f59e0b" filter="url(#fanoos-glow)" />
            <circle cx="0" cy="10" r="1" fill="#fffbeb" />

            {/* Lantern Base & Finial */}
            <path d="M-4,15 L4,15 L2,17 L-2,17 Z" fill="#d97706" />
            <polygon
              points="0,17 1.5,19 0,22 -1.5,19"
              fill="#7e22ce"
              stroke="#d97706"
              strokeWidth="0.5"
            />
          </g>

          {/* Side Amethyst & Pearl Pendants */}
          <g transform="translate(25, 25)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#d97706" strokeWidth="0.8" />
            <circle cx="0" cy="6" r="2.2" fill="#fef08a" stroke="#d97706" strokeWidth="0.6" />
            <polygon points="0,8 1.5,11 0,14 -1.5,11" fill="#6b21a8" />
          </g>

          <g transform="translate(75, 25)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#d97706" strokeWidth="0.8" />
            <circle cx="0" cy="6" r="2.2" fill="#fef08a" stroke="#d97706" strokeWidth="0.6" />
            <polygon points="0,8 1.5,11 0,14 -1.5,11" fill="#6b21a8" />
          </g>

          {/* Arch Pier Rosettes */}
          <circle cx="0" cy="8" r="3.5" fill="#4c1d95" stroke="#fbbf24" strokeWidth="1" />
          <circle cx="0" cy="8" r="1.5" fill="#fde047" />
          <circle cx="100" cy="8" r="3.5" fill="#4c1d95" stroke="#fbbf24" strokeWidth="1" />
          <circle cx="100" cy="8" r="1.5" fill="#fde047" />
        </pattern>
      </defs>

      <rect width="100%" height="60" fill="url(#veduka-palace-frieze)" />
    </svg>
  );
}
