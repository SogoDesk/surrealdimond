"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The wishlist, kept in this browser until dealer accounts exist (then it
 * moves to the account). One store for every card and the header: a Set of
 * product ids in localStorage, with a same-tab event so every subscriber
 * re-renders when one card changes it. Storage can be unavailable (private
 * mode, blocked site data), so every read and write is guarded.
 */

const KEY = "surreal-wishlist";
const EVENT = "surreal-wishlist-change";
let cache: string | null = null;
let parsed: string[] = [];

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cache) {
    cache = raw;
    try {
      const value = raw ? JSON.parse(raw) : [];
      parsed = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
    } catch {
      parsed = [];
    }
  }
  return parsed;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const EMPTY: string[] = [];

export function useWishlist() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: the heart still toggles for this page view.
      cache = JSON.stringify(next);
      parsed = next;
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { ids, count: ids.length, has: (id: string) => ids.includes(id), toggle };
}
