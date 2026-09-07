"use client";

/**
 * 04. Nine ways to begin (collections). See DESIGN.md.
 *
 * A header row (eyebrow, headline, body, Shop all) above a slow, continuous
 * carousel of the nine category cards and two lifestyle interludes. The track
 * drifts left at a walking pace, pauses while the pointer rests on it, and
 * loops seamlessly. Reduced motion, or no pointer, falls back to a native
 * horizontal scroll with snap points.
 */

import { useRef } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/motion/Reveal";
import { useSplitLines } from "@/components/motion/SplitReveal";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useMedia";
import { categories } from "@/content/catalog";
import { footerColumns } from "@/content/site";
import Marquee from "@/components/motion/Marquee";
import { CategoryCard, Interlude, LooseDiamondsCard } from "./CollectionsPanels";
import s from "./Collections.module.css";

const SHOP_ALL = "/jewelry";
const LOOSE = "/diamonds";

const jewelry = (id: string) => `/jewelry/${id}`;
const categoryHref = (id: (typeof categories)[number]["id"]) => jewelry(categories.find((c) => c.id === id)?.id ?? id);
const sterlingHref = footerColumns[0].links.find((l) => l.label === "Sterling Silver")?.href ?? jewelry("sterling-silver");

type Panel =
  | { kind: "card"; number: number; label: string; href: string; image: string; alt: string }
  | { kind: "interlude"; src: string; width: number; height: number; caption: string; alt: string }
  | { kind: "loose"; number: number; label: string; href: string };

const PANELS: Panel[] = [
  { kind: "card", number: 1, label: "Engagement Rings", href: categoryHref("engagement"), image: "le2004w442-11741", alt: "Oval halo engagement ring" },
  { kind: "card", number: 2, label: "Wedding Bands", href: categoryHref("wedding-bands"), image: "lgbrdl2658-eng-wg-lgbrdl2658-band-wg", alt: "Engagement ring with its matching wedding band" },
  { kind: "card", number: 3, label: "Earrings", href: categoryHref("earrings"), image: "in-and-out-hoops-yg", alt: "Inside out diamond hoop earrings in yellow gold" },
  { kind: "card", number: 4, label: "Necklaces", href: categoryHref("necklaces"), image: "nkov18w440wg", alt: "Oval diamond tennis necklace" },
  { kind: "interlude", src: "/media/photos/sb-3605.webp", width: 1708, height: 2020, caption: "Worn every day", alt: "Diamond jewelry worn in the studio" },
  { kind: "card", number: 5, label: "Pendants", href: categoryHref("pendants"), image: "branding-images8028", alt: "Teardrop pave pendant" },
  { kind: "card", number: 6, label: "Rings", href: categoryHref("rings"), image: "branding-images8022", alt: "Bypass pave ring" },
  { kind: "card", number: 7, label: "Bracelets", href: categoryHref("bracelets"), image: "ca24mr0083-2725", alt: "Diamond tennis bracelet with an oval center" },
  { kind: "card", number: 8, label: "Sterling Silver", href: sterlingHref, image: "jbii247sil-2638", alt: "Oval bezel pendant in sterling silver" },
  { kind: "interlude", src: "/media/photos/sb-3730.webp", width: 2399, height: 2400, caption: "Gold, stacked", alt: "Stacked gold and diamond jewelry" },
  { kind: "loose", number: 9, label: "Loose Diamonds", href: LOOSE },
];

export default function Collections() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();

  /* Headline lines rise out of their masks; the eyebrow rule draws in. */
  useSplitLines(
    headlineRef,
    (split) =>
      gsap.fromTo(
        split.lines,
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, ease: "surreal", stagger: 0.08, scrollTrigger: { trigger: headerRef.current, start: "top 85%", once: true } },
      ),
    { enabled: !reduced },
  );

  useGSAP(
    () => {
      registerGsap();
      const header = headerRef.current;
      if (!header || reduced) return;
      gsap.fromTo(
        header.querySelectorAll(".eyebrow-rule"),
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 1, ease: "surreal", scrollTrigger: { trigger: header, start: "top 85%", once: true } },
      );
    },
    { scope: headerRef, dependencies: [reduced], revertOnUpdate: true },
  );

  const panels = (
    <ul role="list" className={s.track} aria-label="Collection categories">
      {PANELS.map((panel, i) => {
        if (panel.kind === "interlude") {
          return <Interlude key={i} src={panel.src} width={panel.width} height={panel.height} caption={panel.caption} alt={panel.alt} />;
        }
        if (panel.kind === "loose") return <LooseDiamondsCard key={i} number={panel.number} label={panel.label} href={panel.href} />;
        return <CategoryCard key={i} number={panel.number} label={panel.label} href={panel.href} image={panel.image} alt={panel.alt} />;
      })}
    </ul>
  );

  return (
    <Section id="collections" theme="light" label="The collection" className={s.root}>
      <div className={s.stage}>
        <div ref={headerRef} className={`container ${s.header}`}>
          <div className={s.headingCol}>
            <Eyebrow>The collection</Eyebrow>
            <h2 ref={headlineRef} className={s.headline}>
              Nine ways to <em>begin</em>.
            </h2>
          </div>
          <div className={s.bodyCol}>
            <Reveal effect="fade-up" duration={1.2} delay={0.2}>
              <p className={`t-body ${s.body}`}>
                Earrings, engagement rings, wedding bands, necklaces, pendants, rings, bracelets, a sterling silver collection, and loose
                diamonds by the stone. Every piece set with a diamond we grew.
              </p>
            </Reveal>
            <Button variant="tertiary" href={SHOP_ALL} className={s.shopAllLink}>
              Shop all
            </Button>
          </div>
        </div>

        {reduced ? (
          <div className={s.viewport} data-lenis-prevent="">
            {panels}
          </div>
        ) : (
          <Marquee speed={34} gap={24} pauseOnHover className={s.carousel}>
            {panels}
          </Marquee>
        )}

        <div className={`container ${s.mobileCta}`}>
          <Button variant="secondary" href={SHOP_ALL} className={s.shopAllButton} arrow>
            Shop all
          </Button>
        </div>
      </div>
    </Section>
  );
}
