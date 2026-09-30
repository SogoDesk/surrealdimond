/**
 * The diamond page's stone feed. Until the RightClick connection and the
 * supplier feeds are live (BRD section 7), this is a SAMPLE feed: stones
 * generated from a fixed seed so every visit sees the same list, shaped like
 * the live dealer search (shape, carat, color, clarity, cut, polish,
 * symmetry, fluorescence, measurements, table, depth, lab) plus the fields
 * the BRD asks for (certificate number, stock ID, ratio, shipment). Nothing
 * here is a real stone, certificate or price, and the page says so. The
 * attribute list (C-04) and quick filters (C-03) replace these columns when
 * Surreal sends them.
 */

export const SHAPES = ["round", "oval", "pear", "emerald", "princess", "radiant", "cushion", "marquise", "asscher", "heart"] as const;
export type StoneShape = (typeof SHAPES)[number];
export const SHAPE_LABEL: Record<StoneShape, string> = {
  round: "Round",
  oval: "Oval",
  pear: "Pear",
  emerald: "Emerald",
  princess: "Princess",
  radiant: "Radiant",
  cushion: "Cushion",
  marquise: "Marquise",
  asscher: "Asscher",
  heart: "Heart",
};

export const COLORS = ["D", "E", "F", "G", "H", "I", "J"] as const;
export const CLARITIES = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1"] as const;
export const GRADES = ["Ideal", "Excellent", "Very Good", "Good"] as const;
export const FLUORESCENCE = ["None", "Faint", "Medium"] as const;
export const LABS = ["IGI", "GCAL"] as const;

export type Color = (typeof COLORS)[number];
export type Clarity = (typeof CLARITIES)[number];
export type Grade = (typeof GRADES)[number];
export type Fluorescence = (typeof FLUORESCENCE)[number];
export type Lab = (typeof LABS)[number];
export type Source = "surreal" | "supplier";

export interface Stone {
  id: string;
  shape: StoneShape;
  carat: number;
  color: Color;
  clarity: Clarity;
  /** Cut grade applies to round brilliants; fancy shapes carry none. */
  cut: Grade | null;
  polish: Grade;
  symmetry: Grade;
  fluorescence: Fluorescence;
  length: number;
  width: number;
  depth: number;
  ratio: number;
  tablePct: number;
  depthPct: number;
  lab: Lab;
  certificate: string;
  source: Source;
}

/* Deterministic generator (mulberry32) so the sample feed is stable. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weighted<T>(r: () => number, pairs: [T, number][]): T {
  const total = pairs.reduce((n, [, w]) => n + w, 0);
  let x = r() * total;
  for (const [v, w] of pairs) {
    x -= w;
    if (x <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
}

const RATIO: Record<StoneShape, [number, number]> = {
  round: [1, 1.01],
  oval: [1.3, 1.5],
  pear: [1.45, 1.7],
  emerald: [1.3, 1.5],
  princess: [1, 1.05],
  radiant: [1.05, 1.4],
  cushion: [1, 1.2],
  marquise: [1.85, 2.15],
  asscher: [1, 1.04],
  heart: [0.95, 1.05],
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function generate(count: number): Stone[] {
  const r = rng(20260930);
  const stones: Stone[] = [];
  for (let i = 0; i < count; i++) {
    const shape = weighted<StoneShape>(r, [
      ["round", 26],
      ["oval", 18],
      ["emerald", 11],
      ["radiant", 10],
      ["pear", 9],
      ["cushion", 8],
      ["princess", 6],
      ["marquise", 4],
      ["asscher", 4],
      ["heart", 4],
    ]);
    const band = weighted<[number, number]>(r, [
      [[0.5, 1], 18],
      [[1, 2], 30],
      [[2, 3], 22],
      [[3, 5], 16],
      [[5, 8], 9],
      [[8, 15], 5],
    ]);
    const carat = round2(band[0] + r() * (band[1] - band[0]));
    const [rLo, rHi] = RATIO[shape];
    const ratio = round2(rLo + r() * (rHi - rLo));
    // Equivalent round diameter, about 6.5mm at one carat, spread by the ratio.
    const d = 6.45 * Math.cbrt(carat);
    const width = round2(d / Math.sqrt(ratio));
    const length = round2(width * ratio);
    const depthPct = round2(shape === "round" ? 60.5 + r() * 2.5 : 62 + r() * 7);
    const tablePct = round2(shape === "round" ? 54 + r() * 4 : 58 + r() * 10);
    const grade = () => weighted<Grade>(r, [["Excellent", 82], ["Very Good", 16], ["Good", 2]]);
    const lab = weighted<Lab>(r, [["IGI", 76], ["GCAL", 24]]);
    stones.push({
      id: `SD${String(40210 + i * 7).padStart(6, "0")}`,
      shape,
      carat,
      color: weighted<Color>(r, [["D", 30], ["E", 30], ["F", 24], ["G", 10], ["H", 4], ["I", 1], ["J", 1]]),
      clarity: weighted<Clarity>(r, [["FL", 3], ["IF", 8], ["VVS1", 30], ["VVS2", 30], ["VS1", 19], ["VS2", 8], ["SI1", 2]]),
      cut: shape === "round" ? weighted<Grade>(r, [["Ideal", 58], ["Excellent", 40], ["Very Good", 2]]) : null,
      polish: grade(),
      symmetry: grade(),
      fluorescence: weighted<Fluorescence>(r, [["None", 90], ["Faint", 9], ["Medium", 1]]),
      length,
      width,
      depth: round2((width * depthPct) / 100),
      ratio,
      tablePct,
      depthPct,
      lab,
      certificate: lab === "IGI" ? `LG${Math.floor(600000000 + r() * 99999999)}` : `${Math.floor(20000000 + r() * 9999999)}`,
      source: r() < 0.82 ? "surreal" : "supplier",
    });
  }
  return stones;
}

export const stones: Stone[] = generate(260);
export const stoneById = (id: string) => stones.find((s) => s.id === id);

export const stoneTitle = (s: Stone) => `${s.carat.toFixed(2)} ct ${SHAPE_LABEL[s.shape]}`;
export const stoneGrade = (s: Stone) => `${s.color} ${s.clarity}`;
export const measurements = (s: Stone) => `${s.length.toFixed(2)} × ${s.width.toFixed(2)} × ${s.depth.toFixed(2)} mm`;
export const shipment = (s: Stone) => (s.source === "surreal" ? "Next day" : "Supplier stone");
