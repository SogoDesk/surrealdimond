"use client";

/**
 * Nine ways to begin, restored from the 9e31102 homepage in place of the
 * programs cards, and since merged with Shop by category. A header row
 * (eyebrow and headline on the left, the body and Shop all on the right,
 * sharing a baseline) above a slow, continuous carousel: the nine jewelry
 * types, each with its one campaign photograph (BRD R-04) giving way on hover
 * to its render on the story ground, then loose diamonds and all divisions. The
 * cards are half the original width, so five sit in view on a laptop and
 * two on a phone; the track drifts left at a walking pace, pauses under the pointer
 * and loops seamlessly.
 *
 * Motion: the headline rises line by line, the body follows, and the
 * carousel slides in from the right as the section arrives (useRevealIn plus
 * one entrance tween). It hands off to the banners like its neighbours.
 * Reduced motion: a native horizontal scroll with snap points, nothing moves.
 */

import { useRef } from "react";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Marquee from "@/components/motion/Marquee";
import { useRevealIn } from "@/components/home/useRevealIn";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useMedia";
import { calmChapters } from "@/lib/motion";
import { divisions, divisionTypes } from "@/content/divisions";
import type { Category } from "@/content/catalog";
import { groundStyle } from "@/content/grounds";
import { AllDivisionsCard, CategoryCard, LooseDiamondsCard } from "./NineWaysPanels";
import s from "./NineWays.module.css";

const SHOP_ALL = "/jewelry";

/** Each type's story ground, by the catalog category it draws from. */
const GROUND: Record<string, Category> = {
  engagement: "engagement",
  "wedding-bands": "wedding-bands",
  rings: "rings",
  "stud-earrings": "earrings",
  earrings: "earrings",
  bracelets: "bracelets",
  "flexi-bangles": "bracelets",
  pendants: "pendants",
  necklaces: "necklaces",
};

export default function NineWays() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  useRevealIn(ref, { handoff: true });

  useGSAP(
    () => {
      registerGsap();
      const rail = ref.current?.querySelector<HTMLElement>("[data-rail]");
      if (!rail || calmChapters()) return;
      gsap.fromTo(
        rail,
        { x: () => innerWidth * 0.3, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 1.6, ease: "surreal", clearProps: "transform", scrollTrigger: { trigger: rail, start: "top 90%", once: true } },
      );
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  const panels = (
    <ul role="list" className={s.track} aria-label="Shop by category">
      {divisionTypes.map((d, i) =>
        d.photo ? (
          <CategoryCard key={d.id} number={i + 1} label={d.label} href={d.href} photo={d.photo} render={d.image} ground={groundStyle(GROUND[d.id] ?? "engagement")} />
        ) : null,
      )}
      <LooseDiamondsCard number={divisionTypes.length + 1} label="Loose Diamonds" href="/diamonds" />
      <AllDivisionsCard count={divisions.length} href={SHOP_ALL} />
    </ul>
  );

  return (
    <section ref={ref} id="ways" data-theme="light" data-chapter="ways" aria-labelledby="ways-title" className={s.root}>
      <div className={s.stage}>
        <header className={`container grid-12 ${s.header}`}>
          <div className={s.headingCol}>
            <span data-rise>
              <Eyebrow>The collection</Eyebrow>
            </span>
            <h2 id="ways-title" className={s.headline} data-split>
              Nine ways to <em>begin</em>.
            </h2>
          </div>
          <div className={s.bodyCol}>
            <p className={`t-body ${s.body}`} data-rise>
              Engagement rings, wedding bands, rings, studs, earrings, bracelets, flexi bangles, pendants and necklaces, every piece set with a
              diamond we grew.
            </p>
            <span data-rise>
              <Button variant="tertiary" href={SHOP_ALL} arrow>
                Shop all
              </Button>
            </span>
          </div>
        </header>

        <div data-rail className={s.rail}>
          {reduced ? (
            <div className={s.viewport}>
              {panels}
            </div>
          ) : (
            <Marquee speed={34} gap={20} pauseOnHover fade className={s.carousel}>
              {panels}
            </Marquee>
          )}
        </div>
      </div>
    </section>
  );
}
