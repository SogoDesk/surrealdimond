"use client";

import type { RefObject } from "react";
import { registerGsap, gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import { calmChapters } from "@/lib/motion";

/**
 * Shared homepage motion, set up once per section, in the vocabulary of the
 * chapters around it:
 * - [data-split] headings split into masked lines and their words rise into
 *   place with a small settle in rotation (the SplitReveal motion).
 * - [data-rise] children rise 32px and fade in, in document order, batched as
 *   they enter (stagger 0.08s, 1.1s, ease surreal).
 * - [data-reveal-img] frames open with clip-path from the edge named by
 *   data-reveal-img ("bottom" by default, "left" or "right") while their first
 *   image settles from a 1.12 scale (1.3s).
 * - [data-draw] SVG strokes inside the section draw in with DrawSVG.
 * - Hand-off: as the section leaves, its content sinks, shrinks and dims so
 *   the next section reads as sliding up over it (scrubbed). The next section
 *   must be positioned with an opaque ground. Opt in with handoff: true;
 *   pages outside the homepage keep their sections still.
 * Reduced motion: nothing is hidden and nothing moves. Calm chapters
 * (src/lib/motion.ts, on since the 27 October feedback): only the [data-rise]
 * fade-ins and [data-draw] strokes run, once each; no split headlines, no
 * image clip reveals, no scrubbed hand-off.
 */
export function useRevealIn(scope: RefObject<HTMLElement | null>, { handoff = false }: { handoff?: boolean } = {}) {
  useGSAP(
    () => {
      registerGsap();
      const root = scope.current;
      if (!root || prefersReducedMotion()) return;
      const calm = calmChapters();

      const splits = (calm ? [] : gsap.utils.toArray<HTMLElement>("[data-split]", root)).map((el) =>
        SplitText.create(el, {
          type: "lines,words",
          mask: "lines",
          autoSplit: true,
          linesClass: "split-line",
          onSplit: (self) =>
            gsap.fromTo(
              self.words,
              { yPercent: 110, rotation: 3 },
              { yPercent: 0, rotation: 0, duration: 1.1, ease: "surreal", stagger: 0.05, transformOrigin: "0% 100%", scrollTrigger: { trigger: el, start: "top 88%", once: true } },
            ),
        }),
      );

      const rise = gsap.utils.toArray<HTMLElement>("[data-rise]", root);
      if (rise.length) {
        gsap.set(rise, { autoAlpha: 0, y: 32 });
        ScrollTrigger.batch(rise, {
          start: "top 90%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: "surreal", stagger: 0.08, overwrite: true, clearProps: "transform" }),
        });
      }

      const CLIP_FROM: Record<string, string> = {
        bottom: "inset(100% 0% 0% 0%)",
        left: "inset(0% 100% 0% 0%)",
        right: "inset(0% 0% 0% 100%)",
      };
      (calm ? [] : gsap.utils.toArray<HTMLElement>("[data-reveal-img]", root)).forEach((frame) => {
        const img = frame.querySelector("img");
        const from = CLIP_FROM[frame.dataset.revealImg ?? ""] ?? CLIP_FROM.bottom;
        const delay = Number(frame.dataset.revealDelay ?? 0);
        const tl = gsap.timeline({ delay, scrollTrigger: { trigger: frame, start: "top 88%", once: true } });
        tl.fromTo(frame, { clipPath: from }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "surreal", clearProps: "clipPath" });
        if (img) tl.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: "surreal", clearProps: "transform" }, 0);
      });

      const draw = gsap.utils.toArray<SVGElement>("[data-draw]", root);
      if (draw.length) {
        gsap.set(draw, { drawSVG: "0%" });
        ScrollTrigger.batch(draw, {
          start: "top 88%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { drawSVG: "100%", duration: 1.6, ease: "power2.inOut", stagger: 0.06 }),
        });
      }

      const body = root.querySelector<HTMLElement>("[data-handoff]") ?? (root.firstElementChild as HTMLElement | null);
      if (handoff && body && !calm) {
        gsap.fromTo(
          body,
          { y: 0, scale: 1, autoAlpha: 1 },
          {
            y: () => innerHeight * 0.32,
            scale: 0.94,
            autoAlpha: 0.3,
            ease: "none",
            transformOrigin: "50% 0%",
            immediateRender: false,
            // A section shorter than the screen holds until its top reaches the top, so it is read whole before it sinks.
            scrollTrigger: { trigger: root, start: () => (root.offsetHeight < innerHeight ? "top top" : "bottom bottom"), end: "bottom top", scrub: true, invalidateOnRefresh: true },
          },
        );
      }

      return () => splits.forEach((s) => s.revert());
    },
    { scope },
  );
}
