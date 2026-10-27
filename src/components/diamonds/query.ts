/**
 * Diamond page filters and sort (BRD R-16, R-17; client feedback F-B1, F-B2,
 * F-B4). Pure functions over the stone feed. Ranges are inclusive; color and
 * clarity are ranges over their grade scales (best first); measurements are
 * length, width and depth ranges in millimetres (placeholder layout until
 * Surreal's reference, C-16). Sorting is cut to what dealers use: Surreal's
 * own stones first, carat, and price once signed in. The M2O link carries
 * the search into the Made to Order request (R-19), and fromParams reads a
 * search handed over in the address (the site search, the homepage).
 */

import { CLARITIES, COLORS, GRADES, LABS, SHAPES, SHAPE_LABEL, shipsNextDay, type Fluorescence, type Grade, type Lab, type Source, type Stone, type StoneShape } from "@/content/diamonds";
import { stonePrice } from "@/lib/pricing";

export type SortKey = "featured" | "carat-asc" | "carat-desc" | "price-asc" | "price-desc";

export const SORT_LABEL: Record<SortKey, string> = {
  featured: "Next day delivery first",
  "carat-asc": "Carat, low to high",
  "carat-desc": "Carat, high to low",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
};
/** Price sorts need a price, so they are offered to signed-in dealers only. */
export const PRICE_SORTS: SortKey[] = ["price-asc", "price-desc"];

export interface DiamondQuery {
  shapes: StoneShape[];
  caratMin: number | null;
  caratMax: number | null;
  /** Indexes into COLORS, inclusive; null for any. */
  color: [number, number] | null;
  clarity: [number, number] | null;
  cut: Grade[];
  lab: Lab[];
  /** Measurements in millimetres. */
  lengthMin: number | null;
  lengthMax: number | null;
  widthMin: number | null;
  widthMax: number | null;
  depthMin: number | null;
  depthMax: number | null;
  /** Only stones delivered the next day. */
  nextDay: boolean;
  polish: Grade | null;
  symmetry: Grade | null;
  fluorescence: Fluorescence[];
  ratioMin: number | null;
  ratioMax: number | null;
  source: Source | null;
  sort: SortKey;
}

export const EMPTY: DiamondQuery = {
  shapes: [],
  caratMin: null,
  caratMax: null,
  color: null,
  clarity: null,
  cut: [],
  lab: [],
  lengthMin: null,
  lengthMax: null,
  widthMin: null,
  widthMax: null,
  depthMin: null,
  depthMax: null,
  nextDay: false,
  polish: null,
  symmetry: null,
  fluorescence: [],
  ratioMin: null,
  ratioMax: null,
  source: null,
  sort: "featured",
};

const gradeAtLeast = (g: Grade, min: Grade | null) => min === null || GRADES.indexOf(g) <= GRADES.indexOf(min);
const inRange = (n: number, lo: number | null, hi: number | null) => (lo === null || n >= lo) && (hi === null || n <= hi);

export function matches(s: Stone, q: DiamondQuery): boolean {
  if (q.shapes.length && !q.shapes.includes(s.shape)) return false;
  if (!inRange(s.carat, q.caratMin, q.caratMax)) return false;
  if (q.color && !inRange(COLORS.indexOf(s.color), q.color[0], q.color[1])) return false;
  if (q.clarity && !inRange(CLARITIES.indexOf(s.clarity), q.clarity[0], q.clarity[1])) return false;
  if (q.cut.length && (!s.cut || !q.cut.includes(s.cut))) return false;
  if (q.lab.length && !q.lab.includes(s.lab)) return false;
  if (!inRange(s.length, q.lengthMin, q.lengthMax) || !inRange(s.width, q.widthMin, q.widthMax) || !inRange(s.depth, q.depthMin, q.depthMax)) return false;
  if (q.nextDay && !shipsNextDay(s)) return false;
  if (!gradeAtLeast(s.polish, q.polish) || !gradeAtLeast(s.symmetry, q.symmetry)) return false;
  if (q.fluorescence.length && !q.fluorescence.includes(s.fluorescence)) return false;
  if (!inRange(s.ratio, q.ratioMin, q.ratioMax)) return false;
  if (q.source && s.source !== q.source) return false;
  return true;
}

export function sortStones(list: Stone[], sort: SortKey): Stone[] {
  const out = [...list];
  const by = {
    featured: (a: Stone, b: Stone) => Number(!shipsNextDay(a)) - Number(!shipsNextDay(b)) || a.carat - b.carat,
    "carat-asc": (a: Stone, b: Stone) => a.carat - b.carat,
    "carat-desc": (a: Stone, b: Stone) => b.carat - a.carat,
    "price-asc": (a: Stone, b: Stone) => stonePrice(a) - stonePrice(b),
    "price-desc": (a: Stone, b: Stone) => stonePrice(b) - stonePrice(a),
  }[sort];
  return out.sort(by);
}

export const hasMeasurements = (q: DiamondQuery) => [q.lengthMin, q.lengthMax, q.widthMin, q.widthMax, q.depthMin, q.depthMax].some((v) => v !== null);

/** How many filters are on, for the Clear button and the More filters badge. */
export function activeCount(q: DiamondQuery): { quick: number; more: number } {
  const quick = [q.shapes.length > 0, q.caratMin !== null || q.caratMax !== null, q.color !== null, q.clarity !== null, q.cut.length > 0, hasMeasurements(q), q.nextDay].filter(Boolean).length;
  const more = [q.lab.length > 0, q.polish !== null, q.symmetry !== null, q.fluorescence.length > 0, q.ratioMin !== null || q.ratioMax !== null, q.source !== null].filter(Boolean).length;
  return { quick, more };
}

/** Made to Order link carrying the search: first shape, a size and a ratio (R-19). */
export function m2oHref(q: DiamondQuery, stone?: Stone): string {
  const params = new URLSearchParams();
  const shape = stone?.shape ?? q.shapes[0];
  if (shape) params.set("shape", shape);
  const size = stone?.carat ?? q.caratMin ?? null;
  if (size !== null) params.set("size", size.toFixed(2));
  const ratio = stone?.ratio ?? q.ratioMin ?? null;
  if (ratio !== null && shape && shape !== "round") params.set("ratio", ratio.toFixed(2));
  if (stone) params.set("from", stone.id);
  const qs = params.toString();
  return `/diamonds/made-to-order${qs ? `?${qs}` : ""}`;
}

export const describe = (q: DiamondQuery) =>
  [q.shapes.map((s) => SHAPE_LABEL[s]).join(", "), q.caratMin !== null ? `${q.caratMin} ct and up` : "", q.color ? `${COLORS[q.color[0]]} to ${COLORS[q.color[1]]}` : ""].filter(Boolean).join(" · ");

/* The search in the address */

const num = (v: string | null) => (v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
function scaleRange(scale: readonly string[], v: string | null): [number, number] | null {
  if (!v) return null;
  const [a, b = a] = v.toUpperCase().split("-");
  const i = scale.indexOf(a);
  const j = scale.indexOf(b);
  return i < 0 || j < 0 ? null : [Math.min(i, j), Math.max(i, j)];
}

/**
 * Filters from the address: shape (one or more, comma separated), cmin and
 * cmax (carat), color and clarity (a grade or a range, D-F, VVS1-VS1), lab,
 * next=1. Unknown values are ignored; null when the address has none.
 */
export function fromParams(params: URLSearchParams | null): Partial<DiamondQuery> | null {
  if (!params) return null;
  const out: Partial<DiamondQuery> = {};
  const shapes = (params.get("shape") ?? "").split(",").filter((x): x is StoneShape => (SHAPES as readonly string[]).includes(x));
  if (shapes.length) out.shapes = shapes;
  const cmin = num(params.get("cmin"));
  const cmax = num(params.get("cmax"));
  if (cmin !== null) out.caratMin = cmin;
  if (cmax !== null) out.caratMax = cmax;
  const color = scaleRange(COLORS, params.get("color"));
  if (color) out.color = color;
  const clarity = scaleRange(CLARITIES, params.get("clarity"));
  if (clarity) out.clarity = clarity;
  const lab = (params.get("lab") ?? "").toUpperCase().split(",").filter((x): x is Lab => (LABS as readonly string[]).includes(x));
  if (lab.length) out.lab = lab;
  if (params.get("next") === "1") out.nextDay = true;
  return Object.keys(out).length ? out : null;
}

/** The address for a search, the reverse of fromParams. */
export function toParams(q: Partial<DiamondQuery>): string {
  const p = new URLSearchParams();
  if (q.shapes?.length) p.set("shape", q.shapes.join(","));
  if (q.caratMin != null) p.set("cmin", String(q.caratMin));
  if (q.caratMax != null) p.set("cmax", String(q.caratMax));
  if (q.color) p.set("color", q.color[0] === q.color[1] ? COLORS[q.color[0]] : `${COLORS[q.color[0]]}-${COLORS[q.color[1]]}`);
  if (q.clarity) p.set("clarity", q.clarity[0] === q.clarity[1] ? CLARITIES[q.clarity[0]] : `${CLARITIES[q.clarity[0]]}-${CLARITIES[q.clarity[1]]}`);
  if (q.lab?.length) p.set("lab", q.lab.join(","));
  if (q.nextDay) p.set("next", "1");
  return p.toString();
}
