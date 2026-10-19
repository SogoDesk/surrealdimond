"use client";

/**
 * Metal options per article, set in the admin console (BRD R-12, R-13,
 * input C-02): which of white, yellow and rose gold a piece is offered in,
 * and the one it opens in. A piece with no entry offers the metals its
 * imagery shows and opens in its curated default (src/content/catalog.ts).
 *
 * The storefront reads pieces through useWithMetals / useWithMetalsList, so
 * every card, Quick View and product page follows the console. In the
 * preview the choices are kept in this browser; the catalog database takes
 * over with the real console. The server render has no entries, so pages
 * hydrate on the catalog defaults and settle on the console's choice.
 */

import { useMemo } from "react";
import { metals as ALL_METALS, type Metal, type Product } from "@/content/catalog";
import { createLocalStore } from "./localStore";

export interface MetalOption {
  metals: Metal[];
  default: Metal;
}
export type MetalOptions = Record<string, MetalOption>;

const IDS = ALL_METALS.map((m) => m.id);
const isOptions = (v: unknown): v is MetalOptions =>
  typeof v === "object" &&
  v !== null &&
  Object.values(v).every((o: MetalOption) => Array.isArray(o?.metals) && o.metals.length > 0 && o.metals.every((m) => IDS.includes(m)) && o.metals.includes(o.default));

const store = createLocalStore<MetalOptions>("surreal-metals", {}, isOptions);

export const useMetalOptions = store.useStore;

/** Set a piece's metals and default; the default falls back to the first metal when it was switched off. */
export function setMetalOption(id: string, metals: Metal[], def: Metal) {
  const ordered = IDS.filter((m) => metals.includes(m));
  if (!ordered.length) return;
  store.set((all) => ({ ...all, [id]: { metals: ordered, default: ordered.includes(def) ? def : ordered[0] } }));
}

/** Back to the catalog's own metals and default. */
export function clearMetalOption(id: string) {
  store.set((all) => {
    const next = { ...all };
    delete next[id];
    return next;
  });
}

export const withMetals = (p: Product, all: MetalOptions): Product => {
  const o = all[p.id];
  return o ? { ...p, metalOptions: o.metals, defaultMetal: o.default } : p;
};

/** One piece as the console configured it. */
export function useWithMetals(p: Product): Product {
  const all = useMetalOptions();
  return useMemo(() => withMetals(p, all), [p, all]);
}

/** A list of pieces as the console configured them. */
export function useWithMetalsList(list: Product[]): Product[] {
  const all = useMetalOptions();
  return useMemo(() => list.map((p) => withMetals(p, all)), [list, all]);
}

/** A stable key that changes when a piece's console entry does, to restart state seeded from it. */
export function useMetalKey(id: string): string {
  const all = useMetalOptions();
  const o = all[id];
  return o ? `${o.metals.join("")}-${o.default}` : "catalog";
}
