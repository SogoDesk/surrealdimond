"use client";

/**
 * Media hooks that are safe during server rendering. Each one reads a media
 * query through useSyncExternalStore: the server snapshot is a stable default
 * and the client re-renders once with the real value after hydration.
 *
 *   const reduced = useReducedMotion();
 *   const touch = useIsTouch();
 *   const isDesktop = useBreakpoint("md");   // (min-width: 768px)
 *
 * Inside GSAP effects prefer the synchronous helpers (prefersReducedMotion,
 * isTouchDevice) so the animation setup sees the real value on its first run.
 */

import { useCallback, useSyncExternalStore } from "react";

export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 } as const;
export type Breakpoint = keyof typeof breakpoints;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const TOUCH = "(hover: none), (pointer: coarse)";

export function matchesMedia(query: string): boolean {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

export const prefersReducedMotion = () => matchesMedia(REDUCED_MOTION);
export const isTouchDevice = () => matchesMedia(TOUCH);

export function useMediaQuery(query: string, serverDefault = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverDefault,
  );
}

export function useReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION);
}

export function useIsTouch(): boolean {
  return useMediaQuery(TOUCH);
}

/** True when the viewport is at least the given breakpoint (name or px). */
export function useBreakpoint(min: Breakpoint | number, serverDefault = true): boolean {
  const px = typeof min === "number" ? min : breakpoints[min];
  return useMediaQuery(`(min-width: ${px}px)`, serverDefault);
}
