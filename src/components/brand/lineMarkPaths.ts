/**
 * Procedural geometry for the Surreal line mark.
 *
 * The mark in the client's lockup (Banners/Social Media 5.jpg) is a family of
 * 23 curves. Each curve is drawn twice: once in ink and once in sky, the sky
 * copy translated 20.5 units right and 1 unit down, so the mark reads as
 * alternating ink and sky strokes. The family was fitted to the artwork:
 *
 *   stroke t in [0, 1]  (0 = outermost, thickest; 1 = innermost, thinnest)
 *   tip T, knee K, waist W and base B each slide along a guide line in t;
 *   three cubic beziers join them:
 *     tip  -> knee   soft arc on the outer strokes, straight line with a
 *                    sharp corner on the inner ones
 *     knee -> waist  the descent down and to the left (vertical tangent at W)
 *     waist -> base  the swing down and right, curling back into the base
 *   every scalar (handle lengths as fractions of the segment chord, tangent
 *   angles, the knee kink) is sampled at five knots and interpolated with a
 *   monotone cubic so the family stays smooth.
 *
 * Coordinates are in the reference crop's pixel space (about 819 x 1289 for
 * the whole mark). Paths run from the base up to the tip, so a DrawSVG sweep
 * from 0% to 100% draws each stroke out of the bottom edge toward its tip.
 */

export interface LineMarkPath {
  /** 0 = outermost stroke. */
  index: number;
  /** Family parameter, 0 at the outermost stroke, slightly above 1 at the innermost. */
  t: number;
  /** SVG path data (three cubic beziers), base to tip. */
  d: string;
  /** Stroke width in viewBox units. */
  width: number;
}

/** Curves in the reference artwork. */
export const LINE_MARK_CURVES = 23;

/** Translation of the sky layer relative to the ink layer, in viewBox units. */
export const LINE_MARK_SKY_OFFSET = { x: 20.5, y: 1 } as const;

/** Bounding box of both layers including stroke caps (x -24..793, y 23..1311) with a 2 unit margin. */
export const LINE_MARK_VIEWBOX = { x: -26, y: 21, width: 822, height: 1293 } as const;
export const LINE_MARK_VIEWBOX_STRING = `${LINE_MARK_VIEWBOX.x} ${LINE_MARK_VIEWBOX.y} ${LINE_MARK_VIEWBOX.width} ${LINE_MARK_VIEWBOX.height}`;
/** Width to height ratio of the mark's viewBox. */
export const LINE_MARK_ASPECT = LINE_MARK_VIEWBOX.width / LINE_MARK_VIEWBOX.height;

/** Brand colours of the artwork. */
export const LINE_MARK_INK = "#0B1F2A";
export const LINE_MARK_SKY = "#86DFFF";

type Pt = readonly [number, number];
type Cubic = readonly [Pt, Pt, Pt, Pt];

/*
 * Family parameters (fitted). The innermost reference stroke sits at
 * t = 22 / 21 because the guide lines were fitted on the 22 strokes that
 * could be traced cleanly and the last, 1 px wide one extrapolates from them.
 */
const T_MAX = 22 / 21;

const GUIDE = {
  tip: [354.4, 26.8, 752.1, 748.5],
  knee: [158.5452, 182.9798, 582.4846, 755.1612],
  waist: [165.0339, 637.3004, 439.8852, 951.6989],
  base: [-20, 1167.3, 651, 1302.3],
} as const;
/** Quadratic bulge of the waist guide (peaks at t = 0.5). */
const WAIST_BULGE: Pt = [-1.8431, -53.6771];
/** Pixel-centre correction applied to every anchor. */
const SHIFT: Pt = [0.6, 0.8];

/** Knot values at t = 0, 0.25, 0.5, 0.75, 1. */
const KNOTS = {
  a1: [0.1789, 0.1835, 0.3066, 0.7539, 0.6774],
  a2: [0.3645, 0.2686, 0.1395, 0.0449, 0.0334],
  kink: [0, 3.9656, -7.9048, -19.9335, -120.414],
  b1: [0.3176, 0.4733, 0.3867, 0.1177, 0.407],
  b2: [0.3116, 0.3102, 0.1911, 0.03, 0.02],
  c1: [0.1983, 0.2592, 0.259, 0.2118, 0.02],
  c2: [0.5251, 0.4827, 0.366, 0.2681, 0.1881],
  thBase: [-51.1237, -54.7821, -57.6825, -70.3171, -112.4543],
  thKneeOut: [103.7256, 105.0399, 109.9187, 118.5031, 129.9965],
  thTip: [171.7171, 169.6451, 165.7958, 169.6146, 178.2614],
} as const;

/** Stroke width in viewBox units: 9 on the outermost stroke, under 2 on the innermost. */
export function lineMarkStrokeWidth(t: number): number {
  return 9 - 6.9 * t;
}

/** Monotone cubic (Fritsch-Carlson) through equally spaced knots on [0, 1]. */
function pchip(v: readonly number[], t: number): number {
  const n = v.length;
  if (t <= 0) return v[0];
  if (t >= 1) return v[n - 1];
  const h = 1 / (n - 1);
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((v[i + 1] - v[i]) / h);
  const m: number[] = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]);
  }
  const endSlope = (da: number, db: number) => {
    let s = (3 * da - db) / 2;
    if (s * da <= 0) s = 0;
    else if (da * db <= 0 && Math.abs(s) > 3 * Math.abs(da)) s = 3 * da;
    return s;
  };
  m[0] = endSlope(d[0], d[1]);
  m[n - 1] = endSlope(d[n - 2], d[n - 3]);
  const k = Math.min(Math.floor(t / h), n - 2);
  const x = (t - k * h) / h;
  const x2 = x * x;
  const x3 = x2 * x;
  return (
    (2 * x3 - 3 * x2 + 1) * v[k] +
    (x3 - 2 * x2 + x) * h * m[k] +
    (-2 * x3 + 3 * x2) * v[k + 1] +
    (x3 - x2) * h * m[k + 1]
  );
}

function lerpLine(line: readonly [number, number, number, number], t: number): [number, number] {
  return [line[0] + (line[2] - line[0]) * t + SHIFT[0], line[1] + (line[3] - line[1]) * t + SHIFT[1]];
}

function dir(deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a)];
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** Control points of one curve, tip to base, as three cubic beziers. */
export function lineMarkCurve(t: number): Cubic[] {
  const T = lerpLine(GUIDE.tip, t);
  const K = lerpLine(GUIDE.knee, t);
  const B = lerpLine(GUIDE.base, t);
  const W = lerpLine(GUIDE.waist, t);
  const bulge = 4 * t * (1 - t);
  W[0] += bulge * WAIST_BULGE[0];
  W[1] += bulge * WAIST_BULGE[1];

  const a1 = pchip(KNOTS.a1, t);
  const a2 = pchip(KNOTS.a2, t);
  const b1 = pchip(KNOTS.b1, t);
  const b2 = pchip(KNOTS.b2, t);
  const c1 = pchip(KNOTS.c1, t);
  const c2 = pchip(KNOTS.c2, t);
  const thTip = pchip(KNOTS.thTip, t);
  const thKneeOut = pchip(KNOTS.thKneeOut, t);
  const thKneeIn = thKneeOut - 180 + pchip(KNOTS.kink, t);
  const thBase = pchip(KNOTS.thBase, t);

  const lenA = dist(T, K);
  const lenB = dist(K, W);
  const lenC = dist(W, B);
  const uT = dir(thTip);
  const uKin = dir(thKneeIn);
  const uKout = dir(thKneeOut);
  const uB = dir(thBase);

  const segA: Cubic = [
    T,
    [T[0] + a1 * lenA * uT[0], T[1] + a1 * lenA * uT[1]],
    [K[0] + a2 * lenA * uKin[0], K[1] + a2 * lenA * uKin[1]],
    K,
  ];
  const segB: Cubic = [
    K,
    [K[0] + b1 * lenB * uKout[0], K[1] + b1 * lenB * uKout[1]],
    [W[0], W[1] - b2 * lenB],
    W,
  ];
  const segC: Cubic = [W, [W[0], W[1] + c1 * lenC], [B[0] + c2 * lenC * uB[0], B[1] + c2 * lenC * uB[1]], B];
  return [segA, segB, segC];
}

const fmt = (v: number) => {
  const s = v.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
};

/** Path data for one curve, running from the base to the tip. */
export function lineMarkPathData(t: number): string {
  const segs = lineMarkCurve(t);
  // reverse so the path starts at the base: each cubic flips its control points
  const rev = segs
    .slice()
    .reverse()
    .map((s) => [s[3], s[2], s[1], s[0]] as Cubic);
  let d = `M${fmt(rev[0][0][0])} ${fmt(rev[0][0][1])}`;
  for (const s of rev) {
    d += `C${fmt(s[1][0])} ${fmt(s[1][1])} ${fmt(s[2][0])} ${fmt(s[2][1])} ${fmt(s[3][0])} ${fmt(s[3][1])}`;
  }
  return d;
}

/**
 * Paths for a mark with `count` curves spread evenly from the outermost to
 * the innermost stroke of the family. Draw each path once in ink and once in
 * sky translated by LINE_MARK_SKY_OFFSET to reproduce the artwork.
 */
export function getLineMarkPaths(count: number = LINE_MARK_CURVES): LineMarkPath[] {
  const n = Math.max(1, Math.round(count));
  const paths: LineMarkPath[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : (i / (n - 1)) * T_MAX;
    paths.push({ index: i, t, d: lineMarkPathData(t), width: lineMarkStrokeWidth(t) });
  }
  return paths;
}

/** Sample a curve as points, base to tip. Handy for scroll scrubbing and morph targets. */
export function sampleLineMarkCurve(t: number, samplesPerSegment = 24): [number, number][] {
  const segs = lineMarkCurve(t).slice().reverse();
  const out: [number, number][] = [];
  segs.forEach((s, si) => {
    const [p3, p2, p1, p0] = s; // reversed segment: start at the segment's original end
    for (let j = si === 0 ? 0 : 1; j <= samplesPerSegment; j++) {
      const u = j / samplesPerSegment;
      const v = 1 - u;
      out.push([
        v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
        v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
      ]);
    }
  });
  return out;
}
