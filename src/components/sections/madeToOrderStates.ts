/**
 * Procedural stroke states for the Made to Order morph.
 *
 * Thirty-five hairline strokes share three states with identical point counts
 * per stroke, so a scrubbed progress can lerp their coordinates directly:
 *
 *   seed      a tight, slightly rounded square plate of nested outlines
 *   stack     horizontal growth layers stacked upward with a slight drift
 *   brilliant the side profile of a round brilliant: outline, girdle band,
 *             crown facet lines and pavilion lines meeting at the culet
 *
 * Every stroke is a polyline of POINTS_PER_STROKE points. Closed shapes run
 * from a mid-edge start around and back to it; open lines run out and back
 * along themselves, so a loop flattens into a line without twisting. Stroke i
 * of one state morphs into stroke i of the next: stack layers are ordered
 * bottom to top, brilliant lines are sorted by height to match, and seed
 * squares are ordered by distance from the middle layer.
 */

export type Point = [number, number];
export type StrokeState = Point[][];

export interface MadeToOrderStates {
  seed: StrokeState;
  stack: StrokeState;
  brilliant: StrokeState;
}

export const STAGE_SIZE = 560;
export const STROKE_COUNT = 35;
export const POINTS_PER_STROKE = 49;
/** How far the line blue strokes trail the ink strokes, in progress units. */
export const SKY_LAG = 0.05;

const CX = STAGE_SIZE / 2;
const CY = STAGE_SIZE / 2;
const MIDDLE_LAYER = Math.floor(STROKE_COUNT / 2);

/* ---------- sampling ---------- */

function resample(vertices: Point[], n: number): Point[] {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    const l = Math.hypot(vertices[i + 1][0] - vertices[i][0], vertices[i + 1][1] - vertices[i][1]);
    lengths.push(l);
    total += l;
  }
  const out: Point[] = [];
  if (total === 0 || vertices.length < 2) {
    const v = vertices[0] ?? [CX, CY];
    for (let k = 0; k < n; k++) out.push([v[0], v[1]]);
    return out;
  }
  let seg = 0;
  let segStart = 0;
  for (let k = 0; k < n; k++) {
    const target = (total * k) / (n - 1);
    while (seg < lengths.length - 1 && segStart + lengths[seg] < target) {
      segStart += lengths[seg];
      seg++;
    }
    const a = vertices[seg];
    const b = vertices[seg + 1];
    const f = lengths[seg] === 0 ? 0 : Math.min(1, Math.max(0, (target - segStart) / lengths[seg]));
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return out;
}

/** A closed shape: around from the first vertex and back to it. */
function loop(vertices: Point[]): Point[] {
  return resample([...vertices, vertices[0]], POINTS_PER_STROKE);
}

/**
 * An open line traced out and back so its point count matches the loops. The
 * out pass always runs left to right, matching the stack layers, so a layer
 * settles into its facet line without swinging around.
 */
function outAndBack(vertices: Point[]): Point[] {
  const first = vertices[0];
  const last = vertices[vertices.length - 1];
  const ordered = first[0] > last[0] || (first[0] === last[0] && first[1] > last[1]) ? [...vertices].reverse() : vertices;
  const back = ordered.slice(0, -1).reverse();
  return resample([...ordered, ...back], POINTS_PER_STROKE);
}

/* ---------- state A: seed ---------- */

/** Rank of a stack layer by distance from the middle layer (0 = middle). */
function centerRank(layer: number): number {
  const d = Math.abs(layer - MIDDLE_LAYER);
  if (d === 0) return 0;
  return 2 * d - (layer > MIDDLE_LAYER ? 1 : 0);
}

function buildSeed(): StrokeState {
  const minSide = 44;
  const maxSide = 200;
  const strokes: StrokeState = [];
  for (let i = 0; i < STROKE_COUNT; i++) {
    const rank = centerRank(i) / (STROKE_COUNT - 1);
    const h = (minSide + (maxSide - minSide) * rank) / 2;
    // start at the left mid-edge so the upper half is the out pass
    strokes.push(
      loop([
        [CX - h, CY],
        [CX - h, CY - h],
        [CX + h, CY - h],
        [CX + h, CY],
        [CX + h, CY + h],
        [CX - h, CY + h],
      ]),
    );
  }
  return strokes;
}

/* ---------- state B: layered stack ---------- */

function buildStack(): StrokeState {
  const spacing = 8.4;
  const strokes: StrokeState = [];
  for (let i = 0; i < STROKE_COUNT; i++) {
    const y = CY + (MIDDLE_LAYER - i) * spacing;
    const width = 296 + 18 * Math.cos(i * 0.9);
    const drift = (i - MIDDLE_LAYER) * 0.9 + 9 * Math.sin(i * 0.6);
    strokes.push(
      outAndBack([
        [CX + drift - width / 2, y],
        [CX + drift + width / 2, y],
      ]),
    );
  }
  return strokes;
}

/* ---------- state C: brilliant side profile ---------- */

const DEG = Math.PI / 180;

function buildBrilliant(): StrokeState {
  const R = 200; // girdle radius
  const Rt = 114; // table radius
  const crownH = 62;
  const girdleH = 12;
  const pavilionH = 170;
  const yTable = CY - (crownH + girdleH + pavilionH) / 2;
  const yGirdleTop = yTable + crownH;
  const yGirdleBot = yGirdleTop + girdleH;
  const yCulet = yGirdleBot + pavilionH;

  const lines: Point[][] = [];

  // outline: left girdle mid, over the crown and table, down the pavilion
  lines.push(
    loop([
      [CX - R, yGirdleTop + girdleH / 2],
      [CX - R, yGirdleTop],
      [CX - Rt, yTable],
      [CX + Rt, yTable],
      [CX + R, yGirdleTop],
      [CX + R, yGirdleBot],
      [CX, yCulet],
      [CX - R, yGirdleBot],
    ]),
  );

  // girdle band
  lines.push(outAndBack([[CX - R, yGirdleTop], [CX + R, yGirdleTop]]));
  lines.push(outAndBack([[CX - R, yGirdleBot], [CX + R, yGirdleBot]]));

  // crown: bezel apexes on the table, star tips part way down, girdle vertices
  const starDepth = 0.45;
  const rStar = Rt + (R - Rt) * starDepth;
  const yStar = yTable + crownH * starDepth;
  const apexX = (deg: number) => CX + Rt * Math.cos(deg * DEG);
  const starX = (deg: number) => CX + rStar * Math.cos(deg * DEG);
  const girdleX = (deg: number) => CX + R * Math.cos(deg * DEG);

  for (let k = 0; k < 4; k++) {
    const a = 22.5 + k * 45; // star tip angle
    const star: Point = [starX(a), yStar];
    // star facet sides: the two neighboring table apexes down to the tip
    lines.push(outAndBack([[apexX(a - 22.5), yTable], star]));
    lines.push(outAndBack([[apexX(a + 22.5), yTable], star]));
    // bezel lower edges: the tip down to the two neighboring girdle vertices
    lines.push(outAndBack([star, [girdleX(a - 22.5), yGirdleTop]]));
    lines.push(outAndBack([star, [girdleX(a + 22.5), yGirdleTop]]));
    // upper girdle facets meet beneath the tip
    lines.push(outAndBack([star, [girdleX(a), yGirdleTop]]));
  }

  // pavilion: lower girdle facets meet part way down, mains run to the culet
  const meetDepth = 0.78;
  const rMeet = R * (1 - meetDepth);
  const yMeet = yGirdleBot + pavilionH * meetDepth;
  const meetX = (deg: number) => CX + rMeet * Math.cos(deg * DEG);
  const culet: Point = [CX, yCulet];

  for (let k = 0; k < 4; k++) {
    const a = 22.5 + k * 45;
    const meet: Point = [meetX(a), yMeet];
    // lower girdle split continuing as the boundary between mains to the culet
    lines.push(outAndBack([[girdleX(a), yGirdleBot], meet, culet]));
    // the mains' upper edges from their girdle vertices to the meeting points
    lines.push(outAndBack([[girdleX(a - 22.5), yGirdleBot], meet]));
    lines.push(outAndBack([[girdleX(a + 22.5), yGirdleBot], meet]));
  }

  // order bottom to top so each stack layer settles into a nearby line
  const keyed = lines.map((pts) => {
    let sx = 0;
    let sy = 0;
    for (const p of pts) {
      sx += p[0];
      sy += p[1];
    }
    return { pts, x: sx / pts.length, y: sy / pts.length };
  });
  keyed.sort((a, b) => b.y - a.y || a.x - b.x);
  return keyed.map((k) => k.pts);
}

/* ---------- public api ---------- */

let cache: MadeToOrderStates | null = null;

export function getMadeToOrderStates(): MadeToOrderStates {
  if (!cache) cache = { seed: buildSeed(), stack: buildStack(), brilliant: buildBrilliant() };
  return cache;
}

export function createStrokeBuffer(): Point[] {
  const out: Point[] = [];
  for (let k = 0; k < POINTS_PER_STROKE; k++) out.push([0, 0]);
  return out;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Effective progress for one stroke: line blue strokes trail the ink ones. */
export function strokeProgress(index: number, progress: number): number {
  const lead = index % 2 === 0;
  return clamp01((progress - (lead ? 0 : SKY_LAG)) / (1 - SKY_LAG));
}

/**
 * Writes the interpolated points of stroke `index` at `progress` into `out`.
 * 0 to 0.5 moves seed to stack, 0.5 to 1 moves stack to brilliant.
 */
export function morphStroke(states: MadeToOrderStates, index: number, progress: number, out: Point[]): void {
  const p = strokeProgress(index, progress);
  const first = p < 0.5;
  const from = first ? states.seed[index] : states.stack[index];
  const to = first ? states.stack[index] : states.brilliant[index];
  const t = smooth(first ? p * 2 : (p - 0.5) * 2);
  for (let k = 0; k < POINTS_PER_STROKE; k++) {
    out[k][0] = from[k][0] + (to[k][0] - from[k][0]) * t;
    out[k][1] = from[k][1] + (to[k][1] - from[k][1]) * t;
  }
}

const fmt = (v: number) => (Math.round(v * 10) / 10).toString();

/**
 * Path data for a polyline with softened joins: each corner is cut by a small
 * quadratic so the strokes read as drawn lines rather than plotted segments.
 * Collinear points are skipped to keep the string short.
 */
export function pathFromPoints(pts: Point[], radius = 2.5): string {
  const n = pts.length;
  if (n === 0) return "";
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let i = 1; i < n - 1; i++) {
    const p = pts[i];
    const ix = p[0] - pts[i - 1][0];
    const iy = p[1] - pts[i - 1][1];
    const ox = pts[i + 1][0] - p[0];
    const oy = pts[i + 1][1] - p[1];
    const li = Math.hypot(ix, iy);
    const lo = Math.hypot(ox, oy);
    if (li < 0.01 || lo < 0.01) continue;
    const cos = (ix * ox + iy * oy) / (li * lo);
    if (cos > 0.995) continue;
    const r = Math.min(radius, li / 2, lo / 2);
    const ax = p[0] - (ix / li) * r;
    const ay = p[1] - (iy / li) * r;
    const bx = p[0] + (ox / lo) * r;
    const by = p[1] + (oy / lo) * r;
    d += `L${fmt(ax)} ${fmt(ay)}Q${fmt(p[0])} ${fmt(p[1])} ${fmt(bx)} ${fmt(by)}`;
  }
  d += `L${fmt(pts[n - 1][0])} ${fmt(pts[n - 1][1])}`;
  return d;
}
