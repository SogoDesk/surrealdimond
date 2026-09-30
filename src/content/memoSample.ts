/**
 * Sample long-term memo for the demo dealer account only, so the open memo
 * report (BRD R-28) has something to show before RightClick supplies the
 * real memo data (C-07). Every line is labelled "Sample" on the page; none
 * is a real stone, certificate or price, and the stock numbers sit outside
 * the diamond page's sample feed. Dates count back from today.
 */

import type { StoneShape } from "./diamonds";

export interface SampleMemoLine {
  memo: string;
  stock: string;
  daysAgo: number;
  kind: "stone" | "jewelry";
  shape?: StoneShape;
  carat: number;
  cut?: string;
  color?: string;
  clarity?: string;
  /** For jewelry: the catalog piece and its metal. */
  productId?: string;
  metal?: "wg" | "yg" | "rg";
}

export const sampleMemo: SampleMemoLine[] = [
  { memo: "MO-310482", stock: "SD087114", daysAgo: 6, kind: "stone", shape: "radiant", carat: 2.5, color: "F", clarity: "VVS2" },
  { memo: "MO-310482", stock: "SD087206", daysAgo: 6, kind: "stone", shape: "oval", carat: 2.03, color: "E", clarity: "VVS2" },
  { memo: "MO-297731", stock: "SD086530", daysAgo: 21, kind: "stone", shape: "cushion", carat: 1.2, color: "E", clarity: "VVS1" },
  { memo: "MO-288105", stock: "SD085918", daysAgo: 44, kind: "stone", shape: "round", carat: 1.51, cut: "Ideal", color: "D", clarity: "VVS1" },
  { memo: "MO-288105", stock: "JW-11741", daysAgo: 44, kind: "jewelry", carat: 1, productId: "oval-halo", metal: "wg" },
  { memo: "MO-270964", stock: "SD084477", daysAgo: 66, kind: "stone", shape: "pear", carat: 1.72, color: "D", clarity: "VVS2" },
  { memo: "MO-261350", stock: "SD083902", daysAgo: 79, kind: "stone", shape: "emerald", carat: 3.02, color: "F", clarity: "VS1" },
  { memo: "MO-261350", stock: "JW-14120", daysAgo: 79, kind: "jewelry", carat: 2, productId: "eternity-band", metal: "wg" },
];
