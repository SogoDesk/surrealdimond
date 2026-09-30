"use client";

import type { RefObject } from "react";
import { registerGsap, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";

/**
 * Shared homepage reveals, set up once per section:
 * - [data-rise] children rise 32px and fade in, in document order, batched as
 *   they enter (stagger 0.08s, 1.1s, ease surreal).
 * - [data-reveal-img] frames open from the bottom edge with clip-path while
 *   their first image settles from a 1.12 scale (1.3s).
 * - [data-draw] SVG strokes inside the section draw in with DrawSVG.
 * Reduced motion: nothing is hidden and nothing moves.
 */
export function useRevealIn(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      registerGsap();
      const root = scope.current;
      if (!root || prefersReducedMotion()) return;

      const rise = gsap.utils.toArray<HTMLElement>("[data-rise]", root);
      if (rise.length) {
        gsap.set(rise, { autoAlpha: 0, y: 32 });
        ScrollTrigger.batch(rise, {
          start: "top 90%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: "surreal", stagger: 0.08, overwrite: true, clearProps: "transform" }),
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-reveal-img]", root).forEach((frame) => {
        const img = frame.querySelector("img");
        const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: "top 85%", once: true } });
        tl.fromTo(frame, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.3, ease: "surreal", clearProps: "clipPath" });
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
    },
    { scope },
  );
}
