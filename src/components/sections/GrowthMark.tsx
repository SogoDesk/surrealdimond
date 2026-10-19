/**
 * The CVD growth drawing that replaced the 3D opening stone in the time
 * chapter. A seed plate, then layer upon layer of diamond growing on it, then
 * the brilliant cut out of the grown block. Pure SVG: TimeCounter owns the
 * motion and finds the parts by data attribute.
 *
 *   [data-growth-seed]    the seed plate
 *   [data-growth-layer]   the grown layers, bottom to top
 *   [data-growth-cut]     the brilliant's outline and facets
 *   [data-growth-label]   the three captions (seed, grown, cut)
 */

const W = 400;
const SEED_Y = 452;
const LAYERS = 30;
const PITCH = 8.4;
const CX = W / 2;

/** Each layer is a touch wider than the last, then the top rounds off like a grown block. */
const layers = Array.from({ length: LAYERS }, (_, i) => {
  const y = SEED_Y - 10 - i * PITCH;
  const spread = 118 + i * 0.9 - Math.max(0, i - LAYERS + 5) ** 2 * 1.6;
  return { y, x1: CX - spread, x2: CX + spread };
});

/* The brilliant in profile, sized to sit inside the grown block. */
const GIRDLE_Y = 288;
const TABLE_Y = 236;
const CULET_Y = 420;
const G = 104; // girdle half-width
const T = 50; // table half-width
const crownPoints = [-G, -G * 0.62, -G * 0.24, G * 0.24, G * 0.62, G];
const tablePoints = [-T, -T * 0.34, T * 0.34, T];

const cutPaths = [
  // outline: table, crown, girdle, pavilion
  `M${CX - T} ${TABLE_Y} H${CX + T} L${CX + G} ${GIRDLE_Y} L${CX} ${CULET_Y} L${CX - G} ${GIRDLE_Y} Z`,
  `M${CX - G} ${GIRDLE_Y} H${CX + G}`,
  // crown facets: table points to girdle points
  ...tablePoints.map((t, i) => `M${CX + t} ${TABLE_Y} L${CX + crownPoints[i + 1]} ${GIRDLE_Y}`),
  `M${CX - T} ${TABLE_Y} L${CX - G * 0.62} ${GIRDLE_Y}`,
  `M${CX + T} ${TABLE_Y} L${CX + G * 0.62} ${GIRDLE_Y}`,
  // pavilion mains: girdle points to the culet
  ...crownPoints.slice(1, -1).map((p) => `M${CX + p} ${GIRDLE_Y} L${CX} ${CULET_Y}`),
  `M${CX - G * 0.62} ${GIRDLE_Y} L${CX - G * 0.2} ${CULET_Y - 34}`,
  `M${CX + G * 0.62} ${GIRDLE_Y} L${CX + G * 0.2} ${CULET_Y - 34}`,
];

export default function GrowthMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${W} 520`} fill="none" aria-hidden>
      <defs>
        {/* User space: the layers are flat lines, and a bounding-box gradient on a zero-height box paints nothing. */}
        <linearGradient id="growth-fade" gradientUnits="userSpaceOnUse" x1="0" y1={SEED_Y} x2="0" y2={SEED_Y - LAYERS * PITCH}>
          <stop offset="0" stopColor="var(--sky)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--sky)" stopOpacity="0.45" />
        </linearGradient>
        <filter id="growth-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g data-growth-layers stroke="url(#growth-fade)" strokeWidth="1.25" strokeLinecap="round">
        {layers.map((l, i) => (
          <path key={i} data-growth-layer d={`M${l.x1.toFixed(1)} ${l.y.toFixed(1)} H${l.x2.toFixed(1)}`} />
        ))}
      </g>

      <rect data-growth-seed x={CX - 124} y={SEED_Y - 3} width="248" height="6" rx="1" fill="var(--porcelain)" opacity="0.85" />

      <g data-growth-cut stroke="var(--porcelain)" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" filter="url(#growth-glow)">
        {cutPaths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      <g className="t-caption" fill="var(--fg-muted)" fontSize="11" letterSpacing="1.6">
        <text data-growth-label x={CX} y={SEED_Y + 30} textAnchor="middle">
          SEED PLATE
        </text>
        <text data-growth-label x={CX} y={SEED_Y - 10 - LAYERS * PITCH - 18} textAnchor="middle">
          GROWN, LAYER BY LAYER
        </text>
        <text data-growth-label x={CX} y={SEED_Y + 30} textAnchor="middle">
          CUT AND POLISHED
        </text>
      </g>
    </svg>
  );
}
