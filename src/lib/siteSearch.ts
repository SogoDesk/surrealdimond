/**
 * Site search (F-B5): one engine behind the header's suggestions and the
 * results page, over the real catalog, the stone feed and the site's pages.
 *
 * The query is read word by word:
 * - Stone words become diamond filters: a shape ("oval", "ovals"), a carat
 *   ("2ct", "1.5 carat", "1-2ct", "3ct+"), a color ("D", "D-F", "DEF"), a
 *   clarity ("VVS1", "VS", "IF"), a lab ("IGI"), "next day". "Diamond",
 *   "stone", "loose", "lab grown" only say the search is about stones.
 * - A stock ID ("SD040210", or its digits) or a certificate number finds
 *   that stone.
 * - Everything else must match a piece of jewelry: its name, design line,
 *   category (with the usual words: ring, band, studs, bangle), style number,
 *   center shape or metal, word by word, from the start of a word, so a
 *   half-typed word already matches.
 * Stones are listed when every word was understood as a stone word; pieces
 * when every jewelry word matched. Pages (Legacy, Made to Order, the
 * collections, the dashboard) match on their names and a few keywords.
 */

import { categoryLabel, metals, productMetals, products, styleRef, type Product } from "@/content/catalog";
import { CLARITIES, COLORS, LABS, SHAPES, SHAPE_LABEL, stones, type Stone, type StoneShape } from "@/content/diamonds";
import { divisions } from "@/content/divisions";
import { EMPTY, matches, sortStones, toParams, type DiamondQuery } from "@/components/diamonds/query";

export interface PageHit {
  label: string;
  line: string;
  href: string;
}

export interface SearchResult {
  query: string;
  products: Product[];
  stones: Stone[];
  /** Stones matching the diamond filters read from the query (before any limit). */
  stoneTotal: number;
  /** The diamond filters read from the query, for Diamond Search. */
  stoneFilter: Partial<DiamondQuery> | null;
  stoneLabel: string;
  /** Diamond Search with those filters. */
  stoneHref: string;
  /** Stones found by stock ID or certificate. */
  exact: Stone[];
  pages: PageHit[];
}

const STOP = new Set(["a", "an", "the", "for", "in", "of", "and", "with", "on", "to", "show", "me", "find", "all", "my", "some", "i", "want", "need", "looking", "like", "please", "any"]);
const STONE_WORDS = new Set(["diamond", "diamonds", "stone", "stones", "loose", "lab", "grown", "labgrown", "lab-grown", "cvd", "certified", "cert", "carat", "carats", "ct"]);

/** Word stem: plural endings off ("earrings" > "earring", "bracelets" > "bracelet", "watches" > "watch"). */
const stem = (w: string) => (w.length > 4 && /(ches|shes|sses|xes)$/.test(w) ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);

const SYNONYMS: Record<string, string> = {
  engagement: "engagement ring bridal solitaire",
  "wedding-bands": "wedding band anniversary eternity",
  earrings: "earring",
  necklaces: "necklace chain",
  pendants: "pendant necklace charm",
  rings: "ring fashion cocktail",
  bracelets: "bracelet bangle",
  "sterling-silver": "sterling silver",
};

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[,;/()]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

interface Indexed {
  product: Product;
  terms: string[];
  style: string;
}

let index: Indexed[] | null = null;
function productIndex(): Indexed[] {
  if (index) return index;
  index = products.map((p) => {
    const metalWords = productMetals(p).map((m) => metals.find((x) => x.id === m)?.label ?? "");
    const text = [p.name, p.detail, categoryLabel(p.category), p.category.replace(/-/g, " "), SYNONYMS[p.category] ?? "", p.shape ?? "", ...metalWords, "gold"].join(" ");
    return { product: p, terms: Array.from(new Set(words(text).map(stem))), style: (styleRef(p) ?? "").toLowerCase() };
  });
  return index;
}

const PAGES: (PageHit & { keys: string })[] = [
  { label: "Lab Diamond Search", line: "Every loose stone, with filters", href: "/diamonds", keys: "diamond diamonds loose stones search lab grown" },
  { label: "Made to Order", line: "Grow a stone to your client's size", href: "/diamonds/made-to-order", keys: "made to order m2o grow custom stone size request" },
  { label: "Diamond Legacy", line: "Diamonds grown from the same seed line", href: "/legacy", keys: "legacy seed family heirloom generation" },
  { label: "Custom jewelry", line: "The custom order portal", href: "/custom", keys: "custom design cad bespoke portal" },
  { label: "Jewelry order form", line: "Order by style number", href: "/jewelry/order-form", keys: "order form style number bulk" },
  { label: "Retailer Dashboard", line: "Orders, memo, invoices and payments", href: "/dashboard", keys: "dashboard account retailer dealer portal" },
  { label: "Invoices and payments", line: "Open invoices, statement and reconciliation", href: "/dashboard/invoices", keys: "invoice invoices payment payments statement balance reconcile reconciliation billing" },
  { label: "Open memo items", line: "Stones on memo and memo reports", href: "/dashboard/memo", keys: "memo consignment report" },
  { label: "Trade show appointments", line: "Meet us at the shows", href: "/dashboard/trade-shows", keys: "trade show shows jck appointment booth" },
  { label: "Become a dealer", line: "Apply for a dealer account", href: "/apply", keys: "apply dealer become register account wholesale" },
  { label: "Dealer log in", line: "Log in for pricing and ordering", href: "/login", keys: "login log in sign password" },
  { label: "Schedule an appointment", line: "Showroom and virtual appointments", href: "/contact?type=appointment", keys: "appointment schedule visit showroom meeting" },
  { label: "Contact", line: "Phone, email and the office", href: "/contact", keys: "contact phone email call address office help" },
  { label: "About Surreal", line: "The grower behind the diamonds", href: "/about", keys: "about company grower story" },
  ...divisions.map((d) => ({ label: d.label, line: d.note ?? (d.group === "types" ? "Jewelry" : d.group === "collections" ? "Collection" : "Program"), href: d.href, keys: `${d.label} ${d.group} jewelry` })),
];

function readCarat(tok: string, next?: string): { lo: number | null; hi: number | null; used: number } | null {
  const unit = /^(ct|cts|carat|carats)$/;
  const m = tok.match(/^(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?(ct|cts|carat|carats)?(\+)?$/);
  if (!m) return null;
  const hasUnit = Boolean(m[3]) || (next !== undefined && unit.test(next));
  if (!hasUnit) return null;
  const a = Number(m[1]);
  const b = m[2] ? Number(m[2]) : null;
  if (a <= 0 || a > 30) return null;
  const used = m[3] ? 1 : 2;
  if (m[4]) return { lo: a, hi: null, used };
  if (b !== null) return { lo: Math.min(a, b), hi: Math.max(a, b), used };
  // A single size: a little either side, the way dealers search ("2ct" finds 1.95 to 2.10).
  return { lo: Math.round(a * 0.97 * 100) / 100, hi: Math.round(a * 1.06 * 100) / 100, used };
}

function readColor(tok: string, raw: string): [number, number] | null {
  const t = tok.toUpperCase();
  if (/^[D-J]-[D-J]$/.test(t)) {
    const [a, b] = t.split("-").map((c) => COLORS.indexOf(c as (typeof COLORS)[number]));
    return [Math.min(a, b), Math.max(a, b)];
  }
  if (/^[D-J]{2,3}$/.test(t) && "DEFGHIJ".includes(t)) return [COLORS.indexOf(t[0] as (typeof COLORS)[number]), COLORS.indexOf(t[t.length - 1] as (typeof COLORS)[number])];
  // A single letter only when typed as a capital, so "i" and "e" in a phrase stay words.
  if (/^[D-J]$/.test(raw)) {
    const i = COLORS.indexOf(raw as (typeof COLORS)[number]);
    return [i, i];
  }
  return null;
}

function readClarity(tok: string, raw: string): [number, number] | null {
  const t = tok.toUpperCase();
  if (t === "VVS") return [CLARITIES.indexOf("VVS1"), CLARITIES.indexOf("VVS2")];
  if (t === "VS") return [CLARITIES.indexOf("VS1"), CLARITIES.indexOf("VS2")];
  if (t === "IF" && raw !== "IF") return null;
  const i = CLARITIES.indexOf(t as (typeof CLARITIES)[number]);
  return i >= 0 ? [i, i] : null;
}

const shapeOf = (tok: string) => SHAPES.find((s) => s === tok || s === stem(tok) || `${s}s` === tok) ?? null;

const widen = (cur: [number, number] | null | undefined, add: [number, number]): [number, number] => (cur ? [Math.min(cur[0], add[0]), Math.max(cur[1], add[1])] : add);

export function searchSite(text: string, opts: { gone?: Set<string>; productLimit?: number; stoneLimit?: number } = {}): SearchResult {
  const query = text.trim();
  const raws = query.split(/\s+/).filter(Boolean);
  const toks = words(query);
  const filter: Partial<DiamondQuery> = {};
  const shapes: StoneShape[] = [];
  const productTerms: string[] = [];
  const exact: Stone[] = [];
  let stoneIntent = false;
  let unknownForStones = 0;

  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i];
    const raw = raws[i] ?? tok;
    if (STOP.has(tok)) continue;
    const carat = readCarat(tok, toks[i + 1]);
    if (carat) {
      filter.caratMin = carat.lo;
      filter.caratMax = carat.hi;
      i += carat.used - 1;
      continue;
    }
    if (STONE_WORDS.has(tok)) {
      stoneIntent = true;
      continue;
    }
    if (tok === "next" && toks[i + 1] === "day") {
      filter.nextDay = true;
      i += 1;
      continue;
    }
    const shape = shapeOf(tok);
    if (shape) {
      shapes.push(shape);
      productTerms.push(stem(tok));
      continue;
    }
    if ((LABS as readonly string[]).includes(tok.toUpperCase())) {
      filter.lab = [...(filter.lab ?? []), tok.toUpperCase() as (typeof LABS)[number]];
      continue;
    }
    const clarity = readClarity(tok, raw);
    if (clarity) {
      filter.clarity = widen(filter.clarity, clarity);
      continue;
    }
    const color = readColor(tok, raw);
    if (color) {
      filter.color = widen(filter.color, color);
      continue;
    }
    if (/^(sd)?\d{4,}$/.test(tok) || /^lg\d{5,}$/.test(tok)) {
      const digits = tok.replace(/^sd/, "");
      const hits = stones.filter((st) => st.id.toLowerCase().includes(digits) || st.certificate.toLowerCase().includes(tok));
      if (hits.length) {
        exact.push(...hits.slice(0, 5));
        continue;
      }
    }
    productTerms.push(stem(tok));
    unknownForStones += 1;
  }
  if (shapes.length) filter.shapes = Array.from(new Set(shapes));

  const gone = opts.gone ?? new Set<string>();
  const hasStoneFilter = Object.keys(filter).length > 0;
  const stoneSearch = (hasStoneFilter || stoneIntent) && unknownForStones === 0;
  const q: DiamondQuery = { ...EMPTY, ...filter };
  const stoneList = stoneSearch ? sortStones(stones.filter((st) => !gone.has(st.id) && matches(st, q)), "featured") : [];

  // Jewelry: every jewelry word must start a word of the piece (or its style number). A query that is
  // plainly about loose stones (a carat, color, clarity or lab, with nothing but a shape besides) lists none.
  const stoneSpecific = filter.caratMin != null || filter.caratMax != null || Boolean(filter.color) || Boolean(filter.clarity) || Boolean(filter.lab) || exact.length > 0;
  const onlyShapes = productTerms.every((t) => shapeOf(t));
  const productHits =
    productTerms.length === 0 || (stoneSpecific && onlyShapes)
      ? []
      : productIndex()
          .filter(({ terms, style }) => productTerms.every((t) => (style && t.length >= 3 && style.startsWith(t)) || terms.some((w) => w.startsWith(t))))
          .map((x) => x.product);

  const pageWords = toks.filter((t) => !STOP.has(t));
  const pages = pageWords.length
    ? PAGES.filter((p) => {
        const hay = words(`${p.label} ${p.keys}`).map(stem);
        return pageWords.every((t) => hay.some((w) => w.startsWith(stem(t))));
      })
    : [];

  const labelParts = [
    filter.shapes?.map((s) => SHAPE_LABEL[s]).join(", "),
    filter.caratMin != null || filter.caratMax != null ? (filter.caratMax == null ? `${filter.caratMin} ct and up` : `${filter.caratMin} to ${filter.caratMax} ct`) : "",
    filter.color ? (filter.color[0] === filter.color[1] ? COLORS[filter.color[0]] : `${COLORS[filter.color[0]]} to ${COLORS[filter.color[1]]}`) : "",
    filter.clarity ? (filter.clarity[0] === filter.clarity[1] ? CLARITIES[filter.clarity[0]] : `${CLARITIES[filter.clarity[0]]} to ${CLARITIES[filter.clarity[1]]}`) : "",
    filter.lab?.join(", "),
    filter.nextDay ? "next day delivery" : "",
  ].filter(Boolean);

  const qs = toParams(filter);
  return {
    query,
    products: productHits.slice(0, opts.productLimit ?? productHits.length),
    stones: stoneList.slice(0, opts.stoneLimit ?? stoneList.length),
    stoneTotal: stoneList.length,
    stoneFilter: stoneSearch ? filter : null,
    stoneLabel: labelParts.length ? labelParts.join(" · ") : "All stones",
    stoneHref: `/diamonds${qs ? `?${qs}` : ""}`,
    exact: Array.from(new Map(exact.map((s) => [s.id, s])).values()),
    pages: pages.slice(0, 6),
  };
}

/** Searches offered when the box is empty or nothing matched. */
export const POPULAR = ["Oval diamonds", "1-2ct oval DEF", "Engagement rings", "Tennis bracelets", "Studs", "Pear pendant", "Made to Order", "Legacy"];

