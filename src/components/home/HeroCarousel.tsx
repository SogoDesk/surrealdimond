"use client";

/**
 * 1. Hero banner carousel (docs/CONTEXT.md, "Homepage plan").
 *
 * The client's web banners (3:1, logo in the artwork) on desktop and square
 * social artwork on phones, through one <picture> per slide. The active slide
 * sits centred with rounded corners and its neighbours peek in at both edges,
 * a little smaller and veiled. Slides loop without clones: each one is placed
 * by its wrapped offset from the active slide (useLoop), and a slide wrapping
 * around the back moves without a transition.
 *
 * Timing lives in CSS: the active pagination pill fills over the autoplay
 * interval and its animationend advances the carousel, so pausing (hover,
 * keyboard focus, a hidden tab) is just animation-play-state. Swipe and drag
 * move one slide; a drag suppresses the click. On the homepage it follows the
 * programs: the track grows out of a smaller, lowered frame as it scrolls in,
 * and sinks under Hot this week as it leaves (useRevealIn hand-off). Reduced
 * motion: no autoplay, no slide transition and no scroll motion.
 */

import Link from "next/link";
import { getImageProps } from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { HeroSlide } from "@/content/home";
import { useBanners } from "@/lib/merch";
import { useReducedMotion, prefersReducedMotion } from "@/hooks/useMedia";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { useLoop } from "./useLoop";
import { useRevealIn } from "./useRevealIn";
import s from "./HeroCarousel.module.css";

const INTERVAL = 6.5;

function SlidePicture({ slide, priority }: { slide: HeroSlide; priority: boolean }) {
  const common = { alt: slide.label, priority, quality: 82 };
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, src: slide.desktop, width: 1920, height: 640, sizes: "(min-width: 1600px) 1440px, 90vw" });
  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({ ...common, src: slide.mobile, width: 1200, height: 1200, quality: 75, sizes: "88vw" });
  return (
    <picture className={s.picture}>
      <source media="(min-width: 768px)" srcSet={desktop} />
      <img {...rest} srcSet={mobile} alt={slide.label} className={s.image} draggable={false} />
    </picture>
  );
}

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      {dir === "next" ? <path d="M4 10h12M11 5l5 5-5 5" /> : <path d="M16 10H4M9 5l-5 5 5 5" />}
    </svg>
  );
}

/** The banners come from the admin console (lib/merch.ts); a changed set remounts the carousel at its first slide. */
export default function HeroCarousel() {
  const slides = useBanners();
  return <Carousel key={slides.map((b) => b.id).join("|")} slides={slides} />;
}

function Carousel({ slides }: { slides: HeroSlide[] }) {
  const n = slides.length;
  const { index, rel, jumped, go, next, prev } = useLoop(n);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  useRevealIn(sectionRef, { handoff: true });

  useGSAP(
    () => {
      registerGsap();
      const track = sectionRef.current?.querySelector<HTMLElement>(`.${s.track}`);
      if (!track || prefersReducedMotion()) return;
      gsap.fromTo(
        track,
        { scale: 0.86, y: 80 },
        { scale: 1, y: 0, ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "top 25%", scrub: 0.6 } },
      );
    },
    { scope: sectionRef },
  );

  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.x) > 8 && Math.abs(e.clientX - d.x) > Math.abs(e.clientY - d.y)) d.moved = true;
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 0);
    const dx = e.clientX - d.x;
    if (Math.abs(dx) < 48) return;
    if (dx < 0) next();
    else prev();
  };

  const running = !reduced && !paused && !hidden;

  return (
    <section ref={sectionRef} className={s.hero} aria-roledescription="carousel" aria-label="Featured jewelry" data-chapter="banners">
      <div
        className={s.viewport}
        onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
        onPointerLeave={() => {
          setPaused(false);
          drag.current = null;
        }}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <ul className={s.track} aria-live={running ? "off" : "polite"}>
          {slides.map((slide, i) => {
            const r = rel(i);
            const active = r === 0;
            return (
              <li
                key={slide.id}
                className={s.slide}
                style={{ "--rel": r } as CSSProperties}
                data-active={active ? "true" : undefined}
                data-jump={jumped(i) || reduced ? "true" : undefined}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}: ${slide.label}`}
                aria-hidden={!active}
              >
                <Link href={slide.href} className={s.link} tabIndex={active ? 0 : -1} draggable={false}>
                  <SlidePicture slide={slide} priority={i === 0} />
                  <span className={s.veil} aria-hidden />
                </Link>
                {!active && Math.abs(r) === 1 && (
                  <button type="button" className={s.peek} aria-label={r < 0 ? "Previous slide" : "Next slide"} tabIndex={-1} onClick={() => (r < 0 ? prev() : next())} />
                )}
              </li>
            );
          })}
        </ul>

        <button type="button" className={`${s.arrow} ${s.arrowPrev}`} onClick={prev} aria-label="Previous slide">
          <Arrow dir="prev" />
        </button>
        <button type="button" className={`${s.arrow} ${s.arrowNext}`} onClick={next} aria-label="Next slide">
          <Arrow dir="next" />
        </button>

        <div className={s.controls}>
          <div className={s.dots} role="tablist" aria-label="Choose a slide">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}: ${slide.label}`}
                className={s.dot}
                onClick={() => go(i)}
              >
                {i === index && (
                  <span
                    key={`fill-${index}`}
                    className={s.fill}
                    style={{ animationDuration: `${INTERVAL}s`, animationPlayState: running ? "running" : "paused" }}
                    data-static={reduced ? "true" : undefined}
                    onAnimationEnd={next}
                  />
                )}
              </button>
            ))}
          </div>
          <span className={`t-index ${s.counter}`} aria-hidden>
            {String(index + 1).padStart(2, "0")} <span className={s.counterRule} /> {String(n).padStart(2, "0")}
          </span>
        </div>
      </div>

    </section>
  );
}
