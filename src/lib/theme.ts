"use client";

/**
 * Light or dark theme (client feedback F-A5, for Surreal's review). The
 * choice is kept in this browser and set on <html> as data-mode; the script
 * in layout.tsx (modeScript.ts) applies it before the first paint so the
 * page never flashes the other theme. The palettes are in globals.css.
 */

import { useEffect } from "react";
import { createLocalStore } from "./localStore";
import { MODE_KEY } from "./modeScript";

export type Mode = "light" | "dark";

const store = createLocalStore<Mode>(MODE_KEY, "light", (v): v is Mode => v === "light" || v === "dark");

export const useMode = store.useStore;

export function setMode(mode: Mode) {
  store.set(mode);
  document.documentElement.dataset.mode = mode;
}

/** Keeps <html data-mode> in step with the stored choice (another tab, or the first render after hydration). */
export function useModeSync() {
  const mode = useMode();
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);
}
