"use client";

/**
 * 07. Foreveryone (foreveryone). DESIGN.md, section 07.
 *
 * The page's first color. A dark studio chapter in normal flow that rises
 * over the lookbook's sticky hold (position relative, z-index 2). Centered
 * copy sits above a three-column parallax collage of the flower still lifes:
 * each photograph reveals through a clip while scaling down inside it, its
 * caption follows 200ms later, and the three frames drift at their own ratios
 * relative to the section (0.85, 0.92 and 1.25, so the hoops card floats over
 * the others). Once the headline has risen out of its mask it winks once from
 * porcelain to the dahlia's magenta and back. Reduced motion: short fades,
 * no parallax, no wink.
 */

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/motion/Reveal";
import { useSplitLines } from "@/components/motion/SplitReveal";
import { registerGsap, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useBreakpoint, useReducedMotion } from "@/hooks/useMedia";
import { footerColumns } from "@/content/site";
import s from "./Foreveryone.module.css";

const SHOP_ALL = "/jewelry";
const shopHref = (label: string, fallback: string) =>
  footerColumns[0].links.find((l) => l.label === label)?.href ?? fallback;

interface CollageFigure {
  key: "dahlia" | "veronica" | "hoops";
  src: string;
  alt: string;
  caption: string;
  href: string;
  /** Scroll ratio: below 1 lags the page, above 1 runs ahead of it. */
  ratio: number;
  sizes: string;
}

const FIGURES: CollageFigure[] = [
  {
    key: "dahlia",
    src: "/media/photos/sb-4091.webp",
    alt: "Oval solitaire engagement ring resting on a magenta dahlia",
    caption: "Engagement rings",
    href: shopHref("Engagement Rings", "/jewelry/engagement"),
    ratio: 0.85,
    sizes: "(max-width: 767px) 100vw, 58vw",
  },
  {
    key: "veronica",
    src: "/media/photos/sb-4083.webp",
    alt: "Bezel set oval pendant hanging from a purple veronica",
    caption: "Pendants",
    href: shopHref("Pendants", "/jewelry/pendants"),
    ratio: 0.92,
    sizes: "(max-width: 767px) 44vw, 40vw",
  },
  {
    key: "hoops",
    src: "/media/photos/sb-4074.webp",
    alt: "Pave diamond hoop earrings beside a dahlia on light gray",
    caption: "Earrings",
    href: shopHref("Earrings", "/jewelry/earrings"),
    ratio: 1.25,
    sizes: "(max-width: 767px) 44vw, 22vw",
  },
];

const readToken = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
};

export default function Foreveryone() {
  const rootRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const winked = useRef(false);
  const reduced = useReducedMotion();
  const desktop = useBreakpoint("md");

  /* Headline rises out of its mask, then winks once from porcelain to the dahlia magenta and back. */
  useSplitLines(
    headlineRef,
    (split) => {
      const el = headlineRef.current;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: copyRef.current ?? el, start: "top 80%", once: true },
      });
      tl.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "surreal", stagger: 0.08 });
      if (el && !winked.current) {
        const magenta = readToken("--magenta", "#b02078");
        const porcelain = readToken("--porcelain", "#f2f4f6");
        tl.to(
          el,
          {
            color: magenta,
            duration: 1.6,
            ease: "power2.inOut",
            onStart: () => {
              winked.current = true;
            },
          },
          "-=0.4",
        ).to(el, { color: porcelain, duration: 1.6, ease: "power2.inOut", clearProps: "color" }, "+=2");
      }
      return tl;
    },
    { enabled: !reduced },
  );

  /* Eyebrow rule, image reveals, captions and the three parallax ratios. */
  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      if (!root) return;
      const figures = gsap.utils.toArray<HTMLElement>("[data-figure]", root);

      if (reduced) {
        gsap.fromTo(
          figures,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.3, ease: "none", stagger: 0.1, scrollTrigger: { trigger: root, start: "top 80%", once: true } },
        );
        return;
      }

      gsap.fromTo(
        root.querySelectorAll(".eyebrow-rule"),
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 1, ease: "surreal", scrollTrigger: { trigger: copyRef.current ?? root, start: "top 80%", once: true } },
      );

      const spread = desktop ? 1.2 : 0.6;
      figures.forEach((fig) => {
        const frame = fig.querySelector<HTMLElement>("[data-frame]");
        const zoom = fig.querySelector<HTMLElement>("[data-zoom]");
        const caption = fig.querySelector<HTMLElement>("[data-caption]");
        const ratio = Number(fig.dataset.ratio ?? 1);

        const reveal = gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 80%", once: true } });
        if (frame) reveal.fromTo(frame, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.3, ease: "surreal" }, 0);
        if (zoom) reveal.fromTo(zoom, { scale: 1.15 }, { scale: 1, duration: 1.3, ease: "surreal", clearProps: "transform" }, 0);
        if (caption) reveal.fromTo(caption, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "surreal" }, 0.2);

        // Half the travel each way, measured against the viewport on every refresh.
        const travel = () => ((1 - ratio) * window.innerHeight * spread) / 2;
        gsap.fromTo(
          fig,
          { y: () => -travel() },
          {
            y: () => travel(),
            ease: "none",
            scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
          },
        );
      });

      ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          figures.forEach((fig) => {
            fig.style.willChange = self.isActive ? "transform" : "";
          });
        },
      });
    },
    { scope: rootRef, dependencies: [reduced, desktop], revertOnUpdate: true },
  );

  return (
    <Section id="foreveryone" theme="dark" label="Fine jewelry" className={s.root}>
      <div ref={rootRef} className={`container ${s.inner}`}>
        <div className="grid-12">
          <div ref={copyRef} className={s.copy}>
            <Eyebrow>Fine jewelry</Eyebrow>
            <h2 ref={headlineRef} className={s.headline}>
              <em>Foreveryone.</em>
            </h2>
            <Reveal effect="fade-up" duration={1.2} delay={0.2}>
              <p className={`t-body ${s.body}`}>
                Our word, and our promise: perfected, premium lab grown diamonds without the premium price tag, for a compassionate,
                sustainable, inclusive jewelry industry that gives up nothing in quality or beauty.
              </p>
            </Reveal>
            <Reveal effect="fade-up" duration={1.2} delay={0.35} className={s.cta}>
              <Button href={SHOP_ALL} variant="primary">
                Shop all jewelry
              </Button>
            </Reveal>
          </div>
        </div>

        <div className={`grid-12 ${s.collage}`}>
          {FIGURES.map((f) => (
            <figure key={f.key} data-figure data-ratio={f.ratio} className={`${s.figure} ${s[f.key]}`}>
              <Link href={f.href} className={s.frame} data-frame data-cursor="view" aria-label={`${f.caption}: ${f.alt}`}>
                <div className={s.zoom} data-zoom>
                  <Image src={f.src} alt={f.alt} fill sizes={f.sizes} className={s.img} loading="lazy" decoding="async" quality={82} />
                </div>
              </Link>
              <figcaption data-caption>
                <Link href={f.href} className={s.caption} data-cursor="link">
                  {f.caption}
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Section>
  );
}
