/**
 * Global SVG material library — geological hatch patterns, metal/rock gradients and soft filters.
 * Mounted once (zero-size, not display:none so references resolve) and referenced by every
 * simulation diorama as fill="url(#pat-coal)" etc. See MAT for the typed id map.
 */
export const MAT = {
  soil: "url(#pat-soil)",
  sand: "url(#pat-sand)",
  shale: "url(#pat-shale)",
  coal: "url(#pat-coal)",
  rock: "url(#pat-rock)",
  lime: "url(#pat-lime)",
  ore: "url(#pat-ore)",
  goaf: "url(#pat-goaf)",
  hatch: "url(#pat-hatch)",
  metal: "url(#grad-metal)",
  metalH: "url(#grad-metal-h)",
  sky: "url(#grad-sky)",
  heat: "url(#grad-heat)",
  water: "url(#grad-water)",
  rockShade: "url(#grad-rock-shade)",
  core: "url(#grad-core)",
  wood: "url(#grad-wood)",
  steel: "url(#grad-steel)",
  glass: "url(#grad-glass)",
  shadow: "url(#f-shadow)",
  glow: "url(#f-glow)",
} as const;

export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden focusable="false">
      <defs>
        {/* Topsoil / alluvium: warm loam with root flecks */}
        <pattern id="pat-soil" width="14" height="10" patternUnits="userSpaceOnUse">
          <rect width="14" height="10" fill="#B7793F" />
          <circle cx="3" cy="3" r="1" fill="#8A5527" />
          <circle cx="10" cy="7" r="0.9" fill="#D19A5E" />
          <path d="M6 1 l2 3" stroke="#7A4A20" strokeWidth="0.6" />
        </pattern>
        {/* Sandstone: stippled grains */}
        <pattern id="pat-sand" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#E9D8AE" />
          <circle cx="2" cy="2" r="0.8" fill="#C9AE73" />
          <circle cx="7" cy="4" r="0.7" fill="#B89A5C" />
          <circle cx="4" cy="8" r="0.8" fill="#C9AE73" />
          <circle cx="9" cy="9" r="0.5" fill="#A88A4E" />
        </pattern>
        {/* Shale: fissile horizontal dashes */}
        <pattern id="pat-shale" width="16" height="8" patternUnits="userSpaceOnUse">
          <rect width="16" height="8" fill="#A8A29E" />
          <path d="M1 2.5h6M10 2.5h5M4 6.5h7" stroke="#857F7A" strokeWidth="0.9" strokeLinecap="round" />
        </pattern>
        {/* Coal: near-black with vitrain sheen */}
        <pattern id="pat-coal" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#1B2230" />
          <path d="M0 12 L12 0" stroke="#2E3A50" strokeWidth="1.2" />
          <path d="M-3 3 L3 -3 M9 15 L15 9" stroke="#2E3A50" strokeWidth="1.2" />
          <circle cx="3" cy="4" r="0.6" fill="#4B5A78" />
        </pattern>
        {/* Igneous / hard rock: crosses on grey */}
        <pattern id="pat-rock" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill="#A3ADBB" />
          <path d="M3 3.5h3M4.5 2v3M10 10.5h3M11.5 9v3" stroke="#7D8899" strokeWidth="0.9" strokeLinecap="round" />
          <circle cx="11" cy="3" r="0.7" fill="#C5CDD8" />
          <circle cx="4" cy="11" r="0.7" fill="#C5CDD8" />
        </pattern>
        {/* Limestone: brick courses */}
        <pattern id="pat-lime" width="20" height="10" patternUnits="userSpaceOnUse">
          <rect width="20" height="10" fill="#D9D4C3" />
          <path d="M0 0.5h20M0 5.5h20M5 0.5v5M15 5.5v5" stroke="#B8B19B" strokeWidth="0.8" />
        </pattern>
        {/* Ore: amber host with crystal flecks */}
        <pattern id="pat-ore" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#D58A1C" />
          <path d="M3 2 l2 2 -2 2 -2 -2z" fill="#F7C35A" />
          <path d="M9 7 l1.6 1.6 -1.6 1.6 -1.6 -1.6z" fill="#9A5B0B" />
        </pattern>
        {/* Goaf / caved rubble */}
        <pattern id="pat-goaf" width="22" height="16" patternUnits="userSpaceOnUse">
          <rect width="22" height="16" fill="#8F96A3" />
          <path d="M1 4 l5 -3 4 3 -2 5 -6 0z" fill="#B3B9C3" stroke="#6B7280" strokeWidth="0.6" />
          <path d="M12 9 l6 -2 3 5 -4 3 -5 -1z" fill="#A1A8B3" stroke="#6B7280" strokeWidth="0.6" />
          <path d="M8 12 l3 1 -1 3 -3 -1z" fill="#C4C9D1" stroke="#6B7280" strokeWidth="0.5" />
        </pattern>
        {/* Section hatch overlay (transparent) */}
        <pattern id="pat-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0v6" stroke="rgba(15,23,42,0.28)" strokeWidth="1" />
        </pattern>

        <linearGradient id="grad-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E7ECF2" />
          <stop offset="0.45" stopColor="#B4BECB" />
          <stop offset="0.55" stopColor="#97A3B3" />
          <stop offset="1" stopColor="#C9D1DB" />
        </linearGradient>
        <linearGradient id="grad-metal-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#97A3B3" />
          <stop offset="0.5" stopColor="#E7ECF2" />
          <stop offset="1" stopColor="#97A3B3" />
        </linearGradient>
        <linearGradient id="grad-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DBEAFE" />
          <stop offset="1" stopColor="#F8FAFC" />
        </linearGradient>
        <linearGradient id="grad-heat" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="0.35" stopColor="#10B981" />
          <stop offset="0.65" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id="grad-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7DD3FC" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="grad-rock-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id="grad-core" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E2E8F0" />
          <stop offset="0.35" stopColor="#F8FAFC" />
          <stop offset="1" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="grad-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B7791F" />
          <stop offset="1" stopColor="#7C4A12" />
        </linearGradient>
        <linearGradient id="grad-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#64748B" />
          <stop offset="0.5" stopColor="#334155" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id="grad-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="grad-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FDE68A" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FDE68A" stopOpacity="0" />
        </radialGradient>

        <filter id="f-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#0F172A" floodOpacity="0.28" />
        </filter>
        <filter id="f-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
