"use client";

/**
 * Masked text reveal built on SplitText.
 *
 *   <SplitReveal as="h2" className="font-display text-6xl">The New Forever</SplitReveal>
 *   <SplitReveal by="chars" trigger="mount" delay={0.4}>Surreal</SplitReveal>
 *
 * Every line is wrapped in an overflow-clip mask and the words (or chars) rise
 * into place with a small settle in rotation. Waits for document.fonts.ready
 * before splitting, re-splits on resize, hides the text until the split is
 * ready, and reverts to the original markup on unmount. Reduced motion renders
 * the text untouched. Pass plain text or inline markup as children.
 *
 * useSplitLines(ref, build, options) exposes the same font-safe split for custom
 * animations. Return the tween or timeline from build so SplitText can revert
 * and rebuild it when the text re-splits.
 */

import { useEffect, useRef, type HTMLAttributes, type ReactNode, type RefObject, type ComponentType, type Ref } from "react";
import { registerGsap, gsap, SplitText, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";

export type SplitBy = "words" | "chars";

export interface UseSplitLinesOptions {
  by?: SplitBy;
  /** Wrap each line in an overflow-clip mask (default true). */
  mask?: boolean;
  /** Hide the element until the first split has run (default true). */
  hideUntilSplit?: boolean;
  enabled?: boolean;
  deps?: unknown[];
}

export function useSplitLines<T extends HTMLElement>(
  ref: RefObject<T | null>,
  build: (split: SplitText) => gsap.core.Animation | void,
  { by = "words", mask = true, hideUntilSplit = true, enabled = true, deps = [] }: UseSplitLinesOptions = {},
) {
  const buildRef = useRef(build);
  useEffect(() => {
    buildRef.current = build;
  }, [build]);

  useGSAP(
    (_context, contextSafe) => {
      const el = ref.current;
      if (!el || !enabled) return;
      registerGsap();
      let cancelled = false;
      let split: SplitText | undefined;
      if (hideUntilSplit) el.style.visibility = "hidden";

      const run = () => {
        if (cancelled) return;
        split = SplitText.create(el, {
          type: by === "chars" ? "lines,chars" : "lines,words",
          mask: mask ? "lines" : undefined,
          autoSplit: true,
          linesClass: "split-line",
          onSplit: (self) => {
            const animation = buildRef.current(self);
            el.style.visibility = "";
            return animation;
          },
        });
      };
      const fonts = typeof document !== "undefined" ? document.fonts : undefined;
      (fonts ? fonts.ready : Promise.resolve()).then(contextSafe ? (contextSafe(run) as () => void) : run);

      return () => {
        cancelled = true;
        split?.revert();
        el.style.visibility = "";
      };
    },
    { scope: ref, dependencies: [by, mask, hideUntilSplit, enabled, ...deps], revertOnUpdate: true },
  );
}

export interface SplitRevealProps extends HTMLAttributes<HTMLElement> {
  as?: keyof HTMLElementTagNameMap;
  by?: SplitBy;
  trigger?: "scroll" | "mount";
  delay?: number;
  duration?: number;
  /** Defaults to 0.02 for chars and 0.05 for words. */
  stagger?: number;
  start?: string;
  once?: boolean;
  children: ReactNode;
}

export default function SplitReveal({
  as = "p",
  by = "words",
  trigger = "scroll",
  delay = 0,
  duration = 1.1,
  stagger,
  start = "top 85%",
  once = true,
  children,
  ...rest
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useSplitLines(
    ref,
    (split) =>
      gsap.fromTo(
        by === "chars" ? split.chars : split.words,
        { yPercent: 110, rotation: 3 },
        {
          yPercent: 0,
          rotation: 0,
          duration,
          delay,
          ease: "surreal",
          stagger: stagger ?? (by === "chars" ? 0.02 : 0.05),
          transformOrigin: "0% 100%",
          scrollTrigger:
            trigger === "scroll"
              ? {
                  trigger: ref.current,
                  start,
                  once,
                  toggleActions: once ? "play none none none" : "play none none reverse",
                }
              : undefined,
        },
      ),
    { by, enabled: !prefersReducedMotion(), deps: [trigger, delay, duration, stagger, start, once] },
  );

  const Tag = as as unknown as ComponentType<HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement | null>; children?: ReactNode }>;
  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  );
}
