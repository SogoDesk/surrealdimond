/**
 * Dealer prices, in US dollars, shown only to a signed-in dealer (BRD Q8:
 * prices behind the login). Visitors keep the "Log in for dealer price"
 * door everywhere.
 *
 * SAMPLE PRICE LIST. Surreal's dealer price list has not arrived, so the
 * figures below are a placeholder model: a base price per category at the
 * category's first carat size, scaled by carat weight and metal, and a per
 * carat price for loose stones scaled by size, color and clarity. When the
 * real list is connected (from RightClick or an Excel import), replace
 * jewelryPrice and stonePrice with lookups; nothing else changes.
 */

import { caratOptions, productById, type Category, type Metal, type Product } from "@/content/catalog";
import { stoneById } from "@/content/diamonds";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
/** Whole dollars, e.g. $2,450. */
export const formatUSD = (n: number) => usd.format(Math.round(n));

/** Sample base price per category at its first carat size, white gold. */
const BASE: Record<Category, number> = {
  engagement: 1450,
  "wedding-bands": 890,
  earrings: 980,
  necklaces: 2650,
  pendants: 690,
  rings: 1150,
  bracelets: 2400,
  "sterling-silver": 240,
};
const METAL: Record<Metal, number> = { wg: 1, yg: 1, rg: 1.02 };

const round5 = (n: number) => Math.round(n / 5) * 5;

/** A stable small spread per piece so neighbours do not all cost the same. */
function spread(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 0.88 + (h % 25) / 100;
}

/** The dealer price of one piece in a metal and total carat weight. */
export function jewelryPrice(product: Product, metal: Metal, carat: number): number {
  const first = caratOptions[product.category][0];
  const weight = Math.pow(carat / first, 1.35);
  return round5(BASE[product.category] * spread(product.id) * weight * METAL[metal]);
}

const COLOR: Record<string, number> = { D: 1.16, E: 1.09, F: 1.03, G: 0.96, H: 0.9, I: 0.84, J: 0.78 };
const CLARITY: Record<string, number> = { FL: 1.24, IF: 1.18, VVS1: 1.11, VVS2: 1.06, VS1: 1, VS2: 0.95, SI1: 0.86 };

/** The dealer price of a loose stone. */
export function stonePrice(stone: { carat: number; color: string; clarity: string }): number {
  const perCarat = 380 * Math.pow(stone.carat, 0.35) * (COLOR[stone.color] ?? 1) * (CLARITY[stone.clarity] ?? 1);
  return round5(perCarat * stone.carat);
}

/** A cart or order line's price: the stone, or the piece times its quantity. Null when the piece or stone is unknown. */
export function linePrice(line: { productId: string; metal: Metal; carat: number; qty: number; stoneId?: string }): number | null {
  if (line.stoneId) {
    const st = stoneById(line.stoneId);
    return st ? stonePrice(st) : null;
  }
  const p = productById(line.productId);
  return p ? jewelryPrice(p, line.metal, line.carat) * line.qty : null;
}

/** The sum of the lines' prices. */
export const linesTotal = (lines: Parameters<typeof linePrice>[0][]) => lines.reduce((sum, l) => sum + (linePrice(l) ?? 0), 0);
