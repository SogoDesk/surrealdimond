/**
 * Query helpers for the shop pages. Filters and the sort live in the query
 * string (?metal=yg&shape=oval&sort=az) so a filtered view can be shared; each
 * group is single select and carries at most one value. Everything here is
 * pure: parse the query, serialize it, apply it to the catalog, describe a
 * piece's metal and carat selection. Density and paging are presentation
 * state and never reach the URL.
 */

import { caratOptions, categories, metals, products, productMetals, shapes, type Category, type Metal, type Product, type Shape } from "@/content/catalog";

export type Sort = "featured" | "az" | "za";

export const SORTS: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "az", label: "A to Z" },
  { id: "za", label: "Z to A" },
];

export interface ShopQuery {
  metal: Metal | null;
  shape: Shape | null;
  sort: Sort;
}

export const EMPTY_QUERY: ShopQuery = { metal: null, shape: null, sort: "featured" };

/** Pieces shown before the first "Show more". */
export const PAGE_SIZE = 24;
/** An editorial interlude follows every eighth card. */
export const INTERLUDE_EVERY = 8;
/** The made to order promo follows this card, once. */
export const PROMO_AFTER = 16;

const METAL_IDS = new Set<string>(metals.map((m) => m.id));
const SHAPE_IDS = new Set<string>(shapes.map((s) => s.id));
const SORT_IDS = new Set<string>(SORTS.map((s) => s.id));

/** One value per group; an older comma list yields its first valid entry. */
function parseOne<T extends string>(raw: string | null, valid: Set<string>): T | null {
  if (!raw) return null;
  for (const part of raw.split(",")) {
    const id = part.trim().toLowerCase();
    if (valid.has(id)) return id as T;
  }
  return null;
}

export function parseQuery(params: URLSearchParams | null): ShopQuery {
  if (!params) return EMPTY_QUERY;
  const sortRaw = params.get("sort");
  return {
    metal: parseOne<Metal>(params.get("metal"), METAL_IDS),
    shape: parseOne<Shape>(params.get("shape"), SHAPE_IDS),
    sort: sortRaw && SORT_IDS.has(sortRaw) ? (sortRaw as Sort) : "featured",
  };
}

/** The query string without the leading question mark; empty when nothing is set. */
export function serializeQuery(query: ShopQuery): string {
  const params = new URLSearchParams();
  if (query.metal) params.set("metal", query.metal);
  if (query.shape) params.set("shape", query.shape);
  if (query.sort !== "featured") params.set("sort", query.sort);
  return params.toString();
}

export const queryKey = (query: ShopQuery) => serializeQuery(query);

export const hasFilters = (query: ShopQuery) => query.metal !== null || query.shape !== null;

export const clearedQuery = (query: ShopQuery): ShopQuery => ({ ...query, metal: null, shape: null });

/** Radio behavior for a group: choosing the active value clears it. */
export const toggleOne = <T>(current: T | null, id: T): T | null => (current === id ? null : id);

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

/** Groups are AND; each group holds one value. */
export function matchesQuery(product: Product, query: ShopQuery, shapesOn: boolean): boolean {
  if (query.metal && !productMetals(product).includes(query.metal)) return false;
  if (shapesOn && query.shape && product.shape !== query.shape) return false;
  return true;
}

/** A piece as the visitor has configured it: a metal and a carat size. */
export interface PieceSelection {
  metal: Metal;
  carat: number;
}

/** The first carat offered in the piece's category; the renders show this size. */
export const firstCarat = (product: Product) => caratOptions[product.category][0];

/** Where a card starts: the filtered metal when there is one, else the piece's first metal, at the first carat. */
export function defaultSelection(product: Product, preferredMetal: Metal | null): PieceSelection {
  return { metal: preferredMetal ?? productMetals(product)[0], carat: firstCarat(product) };
}

/**
 * The render slug for a selection, or null when the library has none: a
 * render exists for the piece's own metals (its variant, else its primary
 * image) at the first carat only.
 */
export function renderForSelection(product: Product, selection: PieceSelection): string | null {
  if (selection.carat !== firstCarat(product)) return null;
  const variant = product.variants?.[selection.metal];
  if (variant) return variant;
  return productMetals(product).includes(selection.metal) ? product.image : null;
}

/** Category label with its last word emphasized: "Engagement <em>rings</em>." A one word label keeps its capital. */
export function splitLabel(label: string): { head: string; tail: string } {
  const words = label.trim().split(/\s+/);
  const tail = words.pop() ?? "";
  const head = words.join(" ");
  return { head, tail: head ? tail.toLowerCase() : tail };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
