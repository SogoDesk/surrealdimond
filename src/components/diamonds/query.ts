/**
 * Diamond page filters and sort (BRD R-16, R-17). Pure functions over the
 * stone feed. Ranges are inclusive; color and clarity are ranges over their
 * grade scales (best first). The M2O link carries the search into the Made
 * to Order request (R-19).
 */

import { CLARITIES, COLORS, GRADES, SHAPE_LABEL, type Fluorescence, type Grade, type Lab, type Source, type Stone, type StoneShape } from "@/content/diamonds";

export type SortKey = "featured" | "carat-asc" | "carat-desc" | "color" | "clarity" | "ratio" | "stock";

export const SORT_LABEL: Record<SortKey, string> = {
  featured: "Surreal grown first",
  "carat-asc": "Carat, low to high",
  "carat-desc": "Carat, high to low",
  color: "Color, best first",
  clarity: "Clarity, best first",
  ratio: "Ratio",
  stock: "Stock ID",
};

export interface DiamondQuery {
  shapes: StoneShape[];
  caratMin: number | null;
  caratMax: number | null;
  /** Indexes into COLORS, inclusive; null for any. */
  color: [number, number] | null;
  clarity: [number, number] | null;
  cut: Grade[];
  lab: Lab[];
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
  if (!gradeAtLeast(s.polish, q.polish) || !gradeAtLeast(s.symmetry, q.symmetry)) return false;
  if (q.fluorescence.length && !q.fluorescence.includes(s.fluorescence)) return false;
  if (!inRange(s.ratio, q.ratioMin, q.ratioMax)) return false;
  if (q.source && s.source !== q.source) return false;
  return true;
}

export function sortStones(list: Stone[], sort: SortKey): Stone[] {
  const out = [...list];
  const by = {
    featured: (a: Stone, b: Stone) => Number(a.source !== "surreal") - Number(b.source !== "surreal") || a.carat - b.carat,
    "carat-asc": (a: Stone, b: Stone) => a.carat - b.carat,
    "carat-desc": (a: Stone, b: Stone) => b.carat - a.carat,
    color: (a: Stone, b: Stone) => COLORS.indexOf(a.color) - COLORS.indexOf(b.color) || a.carat - b.carat,
    clarity: (a: Stone, b: Stone) => CLARITIES.indexOf(a.clarity) - CLARITIES.indexOf(b.clarity) || a.carat - b.carat,
    ratio: (a: Stone, b: Stone) => a.ratio - b.ratio,
    stock: (a: Stone, b: Stone) => a.id.localeCompare(b.id),
  }[sort];
  return out.sort(by);
}

/** How many filters are on, for the Clear button and the More filters badge. */
export function activeCount(q: DiamondQuery): { quick: number; more: number } {
  const quick = [q.shapes.length > 0, q.caratMin !== null || q.caratMax !== null, q.color !== null, q.clarity !== null, q.cut.length > 0, q.lab.length > 0].filter(Boolean).length;
  const more = [q.polish !== null, q.symmetry !== null, q.fluorescence.length > 0, q.ratioMin !== null || q.ratioMax !== null, q.source !== null].filter(Boolean).length;
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
