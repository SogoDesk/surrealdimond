import { useId } from "react";
import type { DivisionMotif as Motif } from "@/content/divisions";

/**
 * Drawn motifs for the divisions that have no photography yet: collections
 * and seasonal programs. Each is a square SVG (viewBox 0 0 100 100) in the
 * brand palette that reads at 40px in the mega menu and fills a bento tile on
 * the homepage. Lines carry data-draw so a parent can draw them in with
 * DrawSVG; stars and dots carry data-twinkle.
 */

const STARS: [number, number, number][] = [
  [18, 30, 1.8],
  [33, 22, 1.3],
  [47, 34, 2.4],
  [62, 27, 1.5],
  [74, 44, 1.9],
  [58, 58, 1.4],
  [70, 73, 2.1],
  [44, 66, 1.2],
  [30, 78, 1.6],
];
const LINKS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [5, 7],
  [7, 8],
  [2, 5],
];
const DUST: [number, number][] = [
  [10, 12], [86, 14], [92, 38], [8, 58], [88, 86], [16, 92], [52, 10], [80, 60], [24, 48], [60, 90], [40, 50], [94, 70],
];

function sparkle(x: number, y: number, r: number) {
  const k = r * 0.28;
  return `M${x} ${y - r * 2.2} C${x + k} ${y - k} ${x + k} ${y - k} ${x + r * 2.2} ${y} C${x + k} ${y + k} ${x + k} ${y + k} ${x} ${y + r * 2.2} C${x - k} ${y + k} ${x - k} ${y + k} ${x - r * 2.2} ${y} C${x - k} ${y - k} ${x - k} ${y - k} ${x} ${y - r * 2.2}Z`;
}

export default function DivisionMotif({ motif, className = "", title }: { motif: Motif; className?: string; title?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const g = (name: string) => `${name}-${uid}`;
  const a11y = title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true };

  if (motif === "constellation") {
    return (
      <svg viewBox="0 0 100 100" className={className} {...a11y} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={g("sky")} cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#15384b" />
            <stop offset="100%" stopColor="#0b1f2a" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${g("sky")})`} />
        {DUST.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={0.45} fill="#dceff7" opacity={0.55} data-twinkle />
        ))}
        {LINKS.map(([a, b], i) => (
          <line key={i} x1={STARS[a][0]} y1={STARS[a][1]} x2={STARS[b][0]} y2={STARS[b][1]} stroke="#70c0e0" strokeWidth={0.35} opacity={0.8} data-draw />
        ))}
        {STARS.map(([x, y, r], i) => (
          <path key={i} d={sparkle(x, y, r)} fill="#e8f6ff" data-twinkle />
        ))}
      </svg>
    );
  }

  if (motif === "enamel") {
    return (
      <svg viewBox="0 0 100 100" className={className} {...a11y} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={g("e1")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#86dfff" />
            <stop offset="100%" stopColor="#3a8fb5" />
          </linearGradient>
          <linearGradient id={g("e2")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1d4a63" />
            <stop offset="100%" stopColor="#0b1f2a" />
          </linearGradient>
          <radialGradient id={g("gloss")} cx="35%" cy="30%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="#dceff7" />
        <circle cx="42" cy="46" r="24" fill={`url(#${g("e2")})`} />
        <circle cx="42" cy="46" r="24" fill={`url(#${g("gloss")})`} />
        <circle cx="62" cy="58" r="20" fill={`url(#${g("e1")})`} />
        <circle cx="62" cy="58" r="20" fill={`url(#${g("gloss")})`} />
        <circle cx="42" cy="46" r="24" fill="none" stroke="#fafbfc" strokeWidth="0.8" data-draw />
        <circle cx="62" cy="58" r="20" fill="none" stroke="#fafbfc" strokeWidth="0.8" data-draw />
        <path d={sparkle(53, 50, 1.6)} fill="#ffffff" data-twinkle />
      </svg>
    );
  }

  if (motif === "laser") {
    const dots: [number, number][] = [];
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) dots.push([14 + col * 9, 14 + row * 9]);
    return (
      <svg viewBox="0 0 100 100" className={className} {...a11y} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={g("beam")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#86dfff" stopOpacity="0" />
            <stop offset="50%" stopColor="#e8f6ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#86dfff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="#0a0b0c" />
        {dots.map(([x, y], i) => {
          const onBeam = Math.abs(x - y) < 6;
          return <circle key={i} cx={x} cy={y} r={onBeam ? 1.5 : 0.9} fill={onBeam ? "#e8f6ff" : "#3a3f44"} data-twinkle={onBeam ? "" : undefined} />;
        })}
        <line x1="4" y1="4" x2="96" y2="96" stroke={`url(#${g("beam")})`} strokeWidth="0.8" data-draw />
      </svg>
    );
  }

  if (motif === "vermeil") {
    return (
      <svg viewBox="0 0 100 100" className={className} {...a11y} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={g("gold")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f3e2b4" />
            <stop offset="45%" stopColor="#e2c27a" />
            <stop offset="100%" stopColor="#b8914a" />
          </linearGradient>
          <linearGradient id={g("silver")} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#c9ced3" />
            <stop offset="100%" stopColor="#f2f4f6" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="#f7efe0" />
        <circle cx="50" cy="50" r="30" fill={`url(#${g("silver")})`} />
        <circle cx="50" cy="50" r="27" fill={`url(#${g("gold")})`} />
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M${29 + i * 4} ${30 + Math.abs(5 - i) * 1.2} L${29 + i * 4} ${70 - Math.abs(5 - i) * 1.2}`} stroke="#fff6dc" strokeWidth="0.3" opacity="0.5" />
        ))}
        <circle cx="50" cy="50" r="30" fill="none" stroke="#b8914a" strokeWidth="0.4" data-draw />
        <path d={sparkle(62, 38, 1.8)} fill="#ffffff" data-twinkle />
      </svg>
    );
  }

  if (motif === "holiday" || motif === "flyer") {
    const isFlyer = motif === "flyer";
    return (
      <svg viewBox="0 0 100 100" className={className} {...a11y} preserveAspectRatio="xMidYMid slice">
        <rect width="100" height="100" fill={isFlyer ? "#dceff7" : "#0b1f2a"} />
        {isFlyer ? (
          <g fill="#fafbfc" stroke="#0b1f2a" strokeWidth="0.5" strokeLinejoin="round">
            <path d="M24 28 L42 24 L42 76 L24 80Z" data-draw />
            <path d="M42 24 L60 28 L60 80 L42 76Z" data-draw />
            <path d="M60 28 L78 24 L78 76 L60 80Z" data-draw />
            <path d="M30 40h8M30 45h8M48 40h8M48 45h6M66 40h8M66 45h8" stroke="#70c0e0" />
          </g>
        ) : (
          <g fill="none" stroke="#86dfff" strokeWidth="0.6" strokeLinejoin="round">
            <path d="M30 26 L66 26 L70 30 L70 78 L30 78Z" fill="#12283a" data-draw />
            <path d="M36 36h24M36 42h18M36 66h28M36 71h20" stroke="#70c0e0" opacity="0.7" />
            <path d={sparkle(52, 54, 2.6)} fill="#e8f6ff" stroke="none" data-twinkle />
          </g>
        )}
      </svg>
    );
  }

  // silver
  return (
    <svg viewBox="0 0 100 100" className={className} {...a11y} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={g("ag")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#d7dce0" />
          <stop offset="100%" stopColor="#f2f4f6" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${g("ag")})`} />
      <circle cx="50" cy="50" r="22" fill="none" stroke="#8f9aa3" strokeWidth="0.6" data-draw />
      <path d={sparkle(50, 50, 2.4)} fill="#ffffff" stroke="#8f9aa3" strokeWidth="0.2" data-twinkle />
    </svg>
  );
}
