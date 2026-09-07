"use client";

/**
 * 01. Masthead. Eyebrow, the headline in Cormorant 300 (the last word in
 * italic), the blurb and a live count in columns 1 to 5, then the category
 * rail. A decorative line mark at 70vh, ink at 6 percent, bleeds off the top
 * right and draws in on load. Headline lines mask-reveal, the blurb and count
 * fade up, the rail staggers in from the left.
 */

import { useRef } from "react";
import Eyebrow from "@/components/ui/Eyebrow";
import LineMark from "@/components/brand/LineMark";
import { LINE_MARK_ASPECT } from "@/components/brand/lineMarkPaths";
import { useSplitLines } from "@/components/motion/SplitReveal";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import type { Category } from "@/content/catalog";
import { categoryFor, splitLabel } from "./filters";
import CategoryRail from "./CategoryRail";
import s from "./shop.module.css";

const ALL_BLURB =
  "Earrings, engagement rings, wedding bands, necklaces, pendants, rings, bracelets and a sterling silver collection. Every piece set with a diamond we grew.";

export interface MastheadProps {
  category: Category | null;
  /** Pieces matching the current filters. */
  count: number;
}

export default function Masthead({ category, count }: MastheadProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const meta = categoryFor(category);
  const label = meta ? splitLabel(meta.label) : { head: "Nine ways to", tail: "begin" };
  const blurb = meta?.blurb ?? ALL_BLURB;

  useSplitLines(
    headlineRef,
    (split) => gsap.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "surreal", stagger: 0.08, delay: 0.1 }),
    { enabled: !prefersReducedMotion() },
  );

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      if (!root) return;
      const rule = root.querySelector<HTMLElement>(".eyebrow-rule");
      const eyebrow = root.querySelector<HTMLElement>("[data-eyebrow]");
      const fades = gsap.utils.toArray<HTMLElement>("[data-fade]", root);
      if (prefersReducedMotion()) {
        gsap.fromTo([eyebrow, ...fades].filter(Boolean), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "none" });
        return;
      }
      if (rule) gsap.fromTo(rule, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 1.1, ease: "surreal" });
      if (eyebrow) gsap.fromTo(eyebrow, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: "surreal" });
      gsap.fromTo(fades, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "surreal", stagger: 0.1, delay: 0.35 });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className={s.masthead}>
      <div className={s.mark} aria-hidden style={{ width: `calc(70vh * ${LINE_MARK_ASPECT.toFixed(4)})` }}>
        <LineMark monochrome animate="draw" duration={2} strokeScale={1.6} style={{ height: "100%", width: "100%" }} />
      </div>

      <div className={s.head}>
        <div className={s.headingCol}>
          <Eyebrow>The collection</Eyebrow>
          <h1 ref={headlineRef} className={s.headline}>
            {label.head ? `${label.head} ` : ""}
            <em>{label.tail}</em>.
          </h1>
        </div>
        <div className={s.lede}>
          <p className="t-body" data-fade>
            {blurb}
          </p>
          <p className={s.count} data-fade aria-live="polite">
            {count} {count === 1 ? "piece" : "pieces"}
          </p>
        </div>
      </div>

      <CategoryRail active={category} />
    </div>
  );
}
