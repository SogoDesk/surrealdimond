"use client";

/**
 * Shop by shape strip: six hand-drawn hairline outlines (Round, Oval, Emerald,
 * Radiant, Princess, Pear) linking into the loose diamond search.
 *
 *   const strip = useRef<ShapeStripHandle>(null);
 *   <ShapeStrip ref={strip} />   then strip.current?.draw() / .reset()
 *
 * draw() sweeps every outline in with DrawSVG (stagger 0.06s); hover redraws
 * the outline in 0.6s, draws the inner facet lines, fills mist from the bottom
 * and underlines the label in line blue. Below 768px the strip becomes a
 * horizontal scroll row of 88px tiles. Reduced motion: everything drawn, no
 * hover motion.
 */

import Link from "next/link";
import { useId, useImperativeHandle, useRef, type Ref } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, isTouchDevice } from "@/hooks/useMedia";

export interface ShapeStripHandle {
  draw: () => void;
  reset: () => void;
}

interface Shape {
  name: string;
  outline: string;
  facets: string[];
}

/* 72 x 72 viewBox, outlines closed, facet lines drawn only on hover. */
const SHAPES: Shape[] = [
  {
    name: "Round",
    outline: "M36 7 C52 7 65 20 65 36 C65 52 52 65 36 65 C20 65 7 52 7 36 C7 20 20 7 36 7 Z",
    facets: [
      "M36 21 L50 27 L50 45 L36 51 L22 45 L22 27 Z",
      "M36 7 L36 21 M65 36 L50 36 M36 65 L36 51 M7 36 L22 36",
      "M15.5 15.5 L22 27 M56.5 15.5 L50 27 M56.5 56.5 L50 45 M15.5 56.5 L22 45",
    ],
  },
  {
    name: "Oval",
    outline: "M36 6 C48 6 56 20 56 36 C56 52 48 66 36 66 C24 66 16 52 16 36 C16 20 24 6 36 6 Z",
    facets: [
      "M36 20 L46 28 L46 44 L36 52 L26 44 L26 28 Z",
      "M36 6 L36 20 M36 52 L36 66 M16 36 L26 36 M46 36 L56 36",
      "M22 16 L26 28 M50 16 L46 28 M22 56 L26 44 M50 56 L46 44",
    ],
  },
  {
    name: "Emerald",
    outline: "M27 8 H45 L50 13 V59 L45 64 H27 L22 59 V13 Z",
    facets: [
      "M29.5 15 H42.5 L45 17.5 V54.5 L42.5 57 H29.5 L27 54.5 V17.5 Z",
      "M32 22 H40 L41 23 V49 L40 50 H32 L31 49 V23 Z",
      "M22 13 L27 17.5 M50 13 L45 17.5 M22 59 L27 54.5 M50 59 L45 54.5",
    ],
  },
  {
    name: "Radiant",
    outline: "M27 10 H45 L53 18 V54 L45 62 H27 L19 54 V18 Z",
    facets: [
      "M31 20 H41 L46 25 V47 L41 52 H31 L26 47 V25 Z",
      "M19 18 L26 25 M53 18 L46 25 M53 54 L46 47 M19 54 L26 47",
      "M36 20 L36 10 M36 52 L36 62 M26 36 L19 36 M46 36 L53 36",
    ],
  },
  {
    name: "Princess",
    outline: "M13 13 H59 V59 H13 Z",
    facets: [
      "M25 25 H47 V47 H25 Z",
      "M13 13 L25 25 M59 13 L47 25 M59 59 L47 47 M13 59 L25 47",
      "M36 13 L36 25 M36 47 L36 59 M13 36 L25 36 M47 36 L59 36",
    ],
  },
  {
    name: "Pear",
    outline: "M36 6 C43 18 57 29 57 44 C57 56 48 66 36 66 C24 66 15 56 15 44 C15 29 29 18 36 6 Z",
    facets: [
      "M36 24 L45 36 L45 47 L36 54 L27 47 L27 36 Z",
      "M36 6 L36 24 M36 54 L36 66 M15 44 L27 44 M45 44 L57 44",
      "M21 30 L27 36 M51 30 L45 36 M22 56 L27 47 M50 56 L45 47",
    ],
  },
];

export default function ShapeStrip({ ref, className = "" }: { ref?: Ref<ShapeStripHandle>; className?: string }) {
  const rootRef = useRef<HTMLUListElement>(null);
  const uid = useId().replace(/:/g, "");

  useImperativeHandle(ref, () => ({
    draw: () => {
      const root = rootRef.current;
      if (!root) return;
      registerGsap();
      if (prefersReducedMotion()) {
        gsap.set(root.querySelectorAll("[data-outline]"), { drawSVG: "0% 100%" });
        return;
      }
      gsap.to(root.querySelectorAll("[data-outline]"), {
        drawSVG: "0% 100%",
        duration: 1.1,
        ease: "surreal",
        stagger: 0.06,
        overwrite: "auto",
      });
      gsap.to(root.querySelectorAll("[data-label]"), { autoAlpha: 1, duration: 0.6, stagger: 0.06, delay: 0.3, overwrite: "auto" });
    },
    reset: () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) return;
      gsap.to(root.querySelectorAll("[data-outline]"), { drawSVG: "0% 0%", duration: 0.6, overwrite: "auto" });
      gsap.to(root.querySelectorAll("[data-label]"), { autoAlpha: 0, duration: 0.4, overwrite: "auto" });
    },
  }));

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      if (!root) return;
      const outlines = root.querySelectorAll<SVGPathElement>("[data-outline]");
      const facets = root.querySelectorAll<SVGPathElement>("[data-facet]");
      const fills = root.querySelectorAll<SVGRectElement>("[data-fill]");
      const rules = root.querySelectorAll<HTMLElement>("[data-rule]");
      const labels = root.querySelectorAll<HTMLElement>("[data-label]");
      if (prefersReducedMotion()) {
        gsap.set(outlines, { drawSVG: "0% 100%" });
        gsap.set(labels, { autoAlpha: 1 });
        return;
      }
      // Start undrawn; draw() sweeps the outlines in when the stage reaches 60 percent.
      gsap.set(outlines, { drawSVG: "0% 0%" });
      gsap.set(facets, { drawSVG: "0% 0%" });
      gsap.set(fills, { scaleY: 0, transformOrigin: "50% 100%" });
      gsap.set(rules, { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(labels, { autoAlpha: 0 });
      if (isTouchDevice()) return;

      const items = Array.from(root.querySelectorAll<HTMLElement>("[data-shape]"));
      const handlers = items.map((item) => {
        const outline = item.querySelector("[data-outline]");
        const facet = item.querySelectorAll("[data-facet]");
        const fill = item.querySelector("[data-fill]");
        const rule = item.querySelector("[data-rule]");
        const enter = () => {
          gsap.fromTo(outline, { drawSVG: "100% 100%" }, { drawSVG: "0% 100%", duration: 0.6, ease: "surreal", overwrite: "auto" });
          gsap.to(facet, { drawSVG: "0% 100%", duration: 0.6, ease: "surreal", stagger: 0.05, delay: 0.15, overwrite: "auto" });
          gsap.to(fill, { scaleY: 1, duration: 0.6, ease: "surreal", overwrite: "auto" });
          gsap.to(rule, { scaleX: 1, transformOrigin: "0% 50%", duration: 0.5, ease: "surreal", overwrite: "auto" });
        };
        const leave = () => {
          gsap.to(facet, { drawSVG: "0% 0%", duration: 0.4, ease: "power2.inOut", overwrite: "auto" });
          gsap.to(fill, { scaleY: 0, duration: 0.5, ease: "power2.inOut", overwrite: "auto" });
          gsap.to(rule, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.4, ease: "power2.inOut", overwrite: "auto" });
        };
        item.addEventListener("pointerenter", enter);
        item.addEventListener("pointerleave", leave);
        item.addEventListener("focus", enter);
        item.addEventListener("blur", leave);
        return () => {
          item.removeEventListener("pointerenter", enter);
          item.removeEventListener("pointerleave", leave);
          item.removeEventListener("focus", enter);
          item.removeEventListener("blur", leave);
        };
      });
      return () => handlers.forEach((off) => off());
    },
    { scope: rootRef },
  );

  return (
    <ul
      ref={rootRef}
      className={`m-0 flex list-none gap-2 overflow-x-auto px-[var(--gutter)] py-4 md:grid md:grid-cols-6 md:gap-[var(--col-gap)] md:overflow-visible md:py-5 ${className}`}
      aria-label="Shop diamonds by shape"
      style={{ scrollbarWidth: "none" }}
    >
      {SHAPES.map((shape, i) => {
        const clipId = `${uid}-clip-${i}`;
        return (
          <li key={shape.name} className="shrink-0 md:shrink">
            <Link
              href={`/diamonds?shape=${shape.name.toLowerCase()}`}
              data-shape={shape.name}
              data-cursor="link"
              className="group flex w-[88px] flex-col items-center gap-2 outline-none md:w-auto md:flex-row md:justify-center md:gap-4 focus-visible:[&>svg]:outline focus-visible:[&>svg]:outline-2 focus-visible:[&>svg]:outline-offset-4 focus-visible:[&>svg]:outline-[var(--accent-strong)]"
              aria-label={`${shape.name} diamonds`}
            >
              <svg viewBox="0 0 72 72" width="72" height="72" className="h-[56px] w-[56px] shrink-0 md:h-[72px] md:w-[72px]" aria-hidden focusable="false">
                <defs>
                  <clipPath id={clipId}>
                    <path d={shape.outline} />
                  </clipPath>
                </defs>
                <rect data-fill x="0" y="0" width="72" height="72" fill="var(--mist)" clipPath={`url(#${clipId})`} />
                <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  {shape.facets.map((d, j) => (
                    <path key={j} d={d} data-facet strokeOpacity="0.7" vectorEffect="non-scaling-stroke" />
                  ))}
                  <path d={shape.outline} data-outline vectorEffect="non-scaling-stroke" />
                </g>
              </svg>
              <span data-label className="t-caption relative inline-block pb-1 uppercase text-[var(--fg)] md:text-left">
                {shape.name}
                <span data-rule aria-hidden className="absolute bottom-0 left-0 block h-px w-full bg-[var(--line)]" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
