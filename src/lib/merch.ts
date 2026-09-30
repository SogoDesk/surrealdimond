"use client";

/**
 * The storefront settings the admin console owns (BRD R-03, R-33, R-34,
 * R-35), and the hooks the storefront reads them through:
 *
 * - hot: the "Hot this week" pieces on the homepage, in order.
 * - pins: per page ("all" for the whole catalog, or a category id), the
 *   pieces featured to the top, in order.
 * - sorts: per page, the default sort; customers can still re-sort.
 * - banners: the homepage hero slides, in order, each on or off.
 *
 * Defaults come from src/content (featuring.ts, home.ts). In the preview the
 * console's changes are kept in this browser; the database takes over with
 * the real console, and every visitor then sees them.
 */

import { hotThisWeek } from "@/content/featuring";
import { heroSlides, type HeroSlide } from "@/content/home";
import type { Product } from "@/content/catalog";
import type { Sort } from "@/components/shop/filters";
import { createLocalStore } from "./localStore";

export interface Banner extends HeroSlide {
  active: boolean;
}

export interface Merch {
  hot: string[];
  pins: Record<string, string[]>;
  sorts: Record<string, Sort>;
  banners: Banner[];
}

export const DEFAULT_MERCH: Merch = {
  hot: hotThisWeek,
  pins: {},
  sorts: {},
  banners: heroSlides.map((b) => ({ ...b, active: true })),
};

const isMerch = (v: unknown): v is Merch => {
  const m = v as Merch;
  return typeof m === "object" && m !== null && Array.isArray(m.hot) && typeof m.pins === "object" && typeof m.sorts === "object" && Array.isArray(m.banners);
};

const store = createLocalStore<Merch>("surreal-merch", DEFAULT_MERCH, isMerch);

export const useMerch = store.useStore;
export const setMerch = (fn: (m: Merch) => Merch) => store.set(fn);
export const resetMerch = () => store.set(DEFAULT_MERCH);

/** The banners the homepage shows: the active ones in order, or every default if none is on. */
export function useBanners(): HeroSlide[] {
  const { banners } = useMerch();
  const on = banners.filter((b) => b.active);
  return on.length ? on : heroSlides;
}

/** The page's default sort, "featured" unless the console set another. */
export const pageSort = (m: Merch, page: string): Sort => m.sorts[page] ?? "featured";

/** Pinned pieces first, in their pinned order; the rest keep their order. */
export function applyPins(list: Product[], pinned: string[] | undefined): Product[] {
  if (!pinned?.length) return list;
  const rank = new Map(pinned.map((id, i) => [id, i]));
  const top = list.filter((p) => rank.has(p.id)).sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  return [...top, ...list.filter((p) => !rank.has(p.id))];
}

/** Move an item within a list by delta, clamped to the ends. */
export function move<T>(list: T[], index: number, delta: number): T[] {
  const to = Math.max(0, Math.min(list.length - 1, index + delta));
  if (to === index) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(to, 0, item);
  return next;
}
