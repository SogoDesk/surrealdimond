"use client";

/**
 * Recently viewed pieces for the dealer homepage (BRD R-08): product ids,
 * newest first, at most twelve, kept in this browser until dealer accounts
 * hold them.
 */

import { createLocalStore } from "./localStore";

const isIds = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");
const store = createLocalStore<string[]>("surreal-recent", [], isIds);

export const useRecent = store.useStore;

export function recordView(productId: string) {
  store.set((ids) => [productId, ...ids.filter((id) => id !== productId)].slice(0, 12));
}
