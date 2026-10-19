"use client";

/**
 * Nine ways to begin, restored from the 9e31102 homepage in place of the
 * programs cards. A header row (eyebrow and headline on the left, the body
 * and Shop all on the right, sharing a baseline) above a slow, continuous
 * carousel of the nine category cards and two lifestyle interludes. The
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
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useMedia";
import { footerColumns } from "@/content/site";
import { CategoryCard, Interlude, LooseDiamondsCard } from "./NineWaysPanels";
import s from "./NineWays.module.css";

const SHOP_ALL = "/jewelry";
const jewelryHref = (label: string, fallback: string) => footerColumns[0].links.find((l) => l.label === label)?.href ?? fallback;

type Panel =
  | { kind: "card"; number: number; label: string; href: string; image: string; alt: string }
  | { kind: "interlude"; src: string; width: number; height: number; caption: string; alt: string }
  | { kind: "loose"; number: number; label: string; href: string };

const PANELS: Panel[] = [
  { kind: "card", number: 1, label: "Engagement Rings", href: jewelryHref("Engagement Rings", "/jewelry/engagement"), image: "le2004w442-11741", alt: "Oval halo engagement ring" },
  { kind: "card", number: 2, label: "Wedding Bands", href: jewelryHref("Wedding Bands", "/jewelry/wedding-bands"), image: "lgbrdl2658-eng-wg-lgbrdl2658-band-wg", alt: "Engagement ring with its matching wedding band" },
  { kind: "card", number: 3, label: "Earrings", href: jewelryHref("Earrings", "/jewelry/earrings"), image: "in-and-out-hoops-yg", alt: "Inside out diamond hoop earrings in yellow gold" },
  { kind: "card", number: 4, label: "Necklaces", href: jewelryHref("Necklaces", "/jewelry/necklaces"), image: "nkov18w440wg", alt: "Oval diamond tennis necklace" },
  { kind: "interlude", src: "/media/photos/sb-3605.webp", width: 1708, height: 2020, caption: "Worn every day", alt: "Diamond jewelry worn in the studio" },
  { kind: "card", number: 5, label: "Pendants", href: jewelryHref("Pendants", "/jewelry/pendants"), image: "branding-images8028", alt: "Teardrop pave pendant" },
  { kind: "card", number: 6, label: "Rings", href: jewelryHref("Rings", "/jewelry/rings"), image: "branding-images8022", alt: "Bypass pave ring" },
  { kind: "card", number: 7, label: "Bracelets", href: jewelryHref("Bracelets", "/jewelry/bracelets"), image: "ca24mr0083-2725", alt: "Diamond tennis bracelet with an oval center" },
  { kind: "card", number: 8, label: "Sterling Silver", href: jewelryHref("Sterling Silver", "/jewelry/sterling-silver"), image: "jbii247sil-2638", alt: "Oval bezel pendant in sterling silver" },
  { kind: "interlude", src: "/media/photos/sb-3730.webp", width: 2399, height: 2400, caption: "Gold, stacked", alt: "Stacked gold and diamond jewelry" },
  { kind: "loose", number: 9, label: "Loose Diamonds", href: "/diamonds" },
];

export default function NineWays() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  useRevealIn(ref, { handoff: true });

  useGSAP(
    () => {
      registerGsap();
      const rail = ref.current?.querySelector<HTMLElement>("[data-rail]");
      if (!rail || prefersReducedMotion()) return;
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
      {PANELS.map((panel, i) => {
        if (panel.kind === "interlude") return <Interlude key={i} {...panel} />;
        if (panel.kind === "loose") return <LooseDiamondsCard key={i} {...panel} />;
        return <CategoryCard key={i} {...panel} />;
      })}
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
              Engagement rings, wedding bands, earrings, necklaces, pendants, rings, bracelets, sterling silver, and loose diamonds by the stone.
              Every piece set with a diamond we grew.
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
            <div className={s.viewport} data-lenis-prevent="">
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
