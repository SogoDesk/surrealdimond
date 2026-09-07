/**
 * Query helpers for the shop pages. Filters and the sort live in the query
 * string (?metal=yg,wg&shape=oval&sort=az) so a filtered view can be shared.
 * Everything here is pure: parse the query, serialize it, apply it to the
 * catalog. Density and paging are presentation state and never reach the URL.
 */

import { categories, metals, products, productMetals, shapes, type Category, type Metal, type Product, type Shape } from "@/content/catalog";

export type Sort = "featured" | "az" | "za";

export const SORTS: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "az", label: "A to Z" },
  { id: "za", label: "Z to A" },
];

export interface ShopQuery {
  metals: Metal[];
  shapes: Shape[];
  sort: Sort;
}

export const EMPTY_QUERY: ShopQuery = { metals: [], shapes: [], sort: "featured" };

/** Pieces shown before the first "Show more". */
export const PAGE_SIZE = 24;
/** An editorial interlude follows every eighth card. */
export const INTERLUDE_EVERY = 8;
/** The made to order promo follows this card, once. */
export const PROMO_AFTER = 16;

const METAL_IDS = new Set<string>(metals.map((m) => m.id));
const SHAPE_IDS = new Set<string>(shapes.map((s) => s.id));
const SORT_IDS = new Set<string>(SORTS.map((s) => s.id));

function parseList<T extends string>(raw: string | null, valid: Set<string>): T[] {
  if (!raw) return [];
  const out: T[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim().toLowerCase();
    if (valid.has(id) && !out.includes(id as T)) out.push(id as T);
  }
  return out;
}

export function parseQuery(params: URLSearchParams | null): ShopQuery {
  if (!params) return EMPTY_QUERY;
  const sortRaw = params.get("sort");
  return {
    metals: parseList<Metal>(params.get("metal"), METAL_IDS),
    shapes: parseList<Shape>(params.get("shape"), SHAPE_IDS),
    sort: sortRaw && SORT_IDS.has(sortRaw) ? (sortRaw as Sort) : "featured",
  };
}

/** The query string without the leading question mark; empty when nothing is set. */
export function serializeQuery(query: ShopQuery): string {
  const params = new URLSearchParams();
  if (query.metals.length) params.set("metal", query.metals.join(","));
  if (query.shapes.length) params.set("shape", query.shapes.join(","));
  if (query.sort !== "featured") params.set("sort", query.sort);
  // Commas stay readable in the shared link.
  return params.toString().replace(/%2C/g, ",");
}

export const queryKey = (query: ShopQuery) => serializeQuery(query);

export const hasFilters = (query: ShopQuery) => query.metals.length > 0 || query.shapes.length > 0;

export function toggleIn<T>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** The shape group only applies where the pieces carry a center stone shape. */
export const showsShapes = (category: Category | null) => category === null || category === "engagement";

export const categoryFor = (id: Category | null) => (id ? categories.find((c) => c.id === id) ?? null : null);

export const poolFor = (category: Category | null): Product[] => (category ? products.filter((p) => p.category === category) : products);

export function sortProducts(list: Product[], sort: Sort): Product[] {
  const copy = [...list];
  if (sort === "az") return copy.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "za") return copy.sort((a, b) => b.name.localeCompare(a.name));
  // Featured first, catalog order within each half.
  return copy.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
}

/** Chips within a group are OR, groups are AND. */
export function matchesQuery(product: Product, query: ShopQuery, shapesOn: boolean): boolean {
  if (query.metals.length) {
    const own = productMetals(product);
    if (!query.metals.some((m) => own.includes(m))) return false;
  }
  if (shapesOn && query.shapes.length) {
    if (!product.shape || !query.shapes.includes(product.shape)) return false;
  }
  return true;
}

/** The render slug for a piece in a given metal, falling back to its primary image. */
export function renderFor(product: Product, metal: Metal | null): string {
  if (metal && product.variants?.[metal]) return product.variants[metal] as string;
  return product.image;
}

/** Category label with its last word emphasized: "Engagement <em>rings</em>." A one word label keeps its capital. */
export function splitLabel(label: string): { head: string; tail: string } {
  const words = label.trim().split(/\s+/);
  const tail = words.pop() ?? "";
  const head = words.join(" ");
  return { head, tail: head ? tail.toLowerCase() : tail };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
