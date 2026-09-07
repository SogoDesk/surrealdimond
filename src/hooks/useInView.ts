"use client";

/**
 * IntersectionObserver as a hook.
 *
 *   const { ref, inView } = useInView<HTMLDivElement>({ once: true });
 *   <div ref={ref} data-inview={inView || undefined} />
 *
 * once (default true) latches to true after the first intersection. The
 * default rootMargin trims the bottom 10% of the viewport so elements count as
 * visible once they are properly on screen rather than at the very edge.
 */

import { useEffect, useRef, useState, type RefObject } from "react";

export interface UseInViewOptions {
  once?: boolean;
  rootMargin?: string;
  threshold?: number | number[];
  /** Value reported on the server and before the observer fires. */
  initial?: boolean;
}

export interface UseInViewResult<T extends Element> {
  ref: RefObject<T | null>;
  inView: boolean;
}

export function useInView<T extends Element = HTMLElement>(
  options: UseInViewOptions = {},
): UseInViewResult<T> {
  const { once = true, rootMargin = "0px 0px -10% 0px", threshold = 0, initial = false } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(initial);
  const thresholdKey = Array.isArray(threshold) ? threshold.join(",") : String(threshold);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold: thresholdKey.split(",").map(Number) },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, rootMargin, thresholdKey]);

  return { ref, inView };
}
