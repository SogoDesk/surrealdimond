"use client";

import { useSyncExternalStore } from "react";

/**
 * A small typed store over localStorage for this browser's preview state
 * (the demo dealer session, the cart, placed orders). Every component that
 * reads a store re-renders when any of them writes it, in this tab and in
 * others. Storage can be missing or blocked (private mode, blocked site
 * data): reads fall back to an in-memory copy, so the page keeps working for
 * the visit. The server snapshot is always the fallback, so the first paint
 * is the signed-out, empty state and hydration never disagrees.
 */
export function createLocalStore<T>(key: string, fallback: T, isValid: (value: unknown) => value is T) {
  const event = `surreal-store:${key}`;
  let raw: string | null | undefined;
  let value: T = fallback;
  let memory: string | null = null;

  const readRaw = () => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memory;
    }
  };

  const get = (): T => {
    const next = readRaw();
    if (next !== raw) {
      raw = next;
      try {
        const parsed: unknown = next ? JSON.parse(next) : fallback;
        value = isValid(parsed) ? parsed : fallback;
      } catch {
        value = fallback;
      }
    }
    return value;
  };

  const set = (next: T | ((prev: T) => T)) => {
    const resolved = typeof next === "function" ? (next as (prev: T) => T)(get()) : next;
    const text = JSON.stringify(resolved);
    memory = text;
    try {
      window.localStorage.setItem(key, text);
    } catch {
      // Storage blocked: the in-memory copy carries the visit.
    }
    window.dispatchEvent(new Event(event));
  };

  const subscribe = (onChange: () => void) => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) onChange();
    };
    window.addEventListener(event, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(event, onChange);
      window.removeEventListener("storage", onStorage);
    };
  };

  const useStore = () => useSyncExternalStore(subscribe, get, () => fallback);

  return { get, set, subscribe, useStore };
}
