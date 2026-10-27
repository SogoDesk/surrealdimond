"use client";

/**
 * 01. The New Forever (hero), after the client's feedback of 27 October 2026
 * (F-A1): a full-width carousel of campaign photographs moving behind the
 * headline, which stays fixed with its buttons: the eyebrow, the SURREAL
 * wordmark, the trade line and the dealer's two doors (log in or apply;
 * signed in, the diamond search and the Retailer Dashboard).
 *
 * The photographs crossfade, each settling from a slight zoom while it is
 * on. The slides come from the console (Banners, lib/merch.ts), in order.
 * Timing lives in CSS: the active progress bar fills over the interval and
 * its animationend advances the carousel, so pausing (the pause button,
 * keyboard focus inside, a hidden tab) is animation-play-state. Hovering
 * does not pause it, nor does clicking prev or next.
 * Prev and next, the bars, the arrow keys and a swipe move it by hand; the
 * caption names the photograph and leads to its category. Only the slide on
 * screen and the next one load their images. Reduced motion: no autoplay
 * and no zoom; the slides still change by hand.
 */

import Link from "next/link";
import { getImageProps } from "next/image";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { account } from "@/content/site";
import type { HeroSlide } from "@/content/home";
import { useDealer } from "@/lib/dealer";
import { useBanners } from "@/lib/merch";
import { useReducedMotion } from "@/hooks/useMedia";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import styles from "./Hero.module.css";

/** Seconds each photograph holds. */
const INTERVAL = 6.5;

function SlidePicture({ slide, eager }: { slide: HeroSlide; eager: boolean }) {
  const shared = { alt: "", quality: 82, loading: eager ? "eager" : "lazy", fetchPriority: eager ? "high" : "auto" } as const;
  const { props: wide } = getImageProps({ ...shared, src: slide.desktop, width: 2400, height: 1600, sizes: "100vw" });
  const { props: tall } = getImageProps({ ...shared, src: slide.mobile, width: 1400, height: 1750, sizes: "100vw" });
  const style = { "--focus": slide.focus ?? "50% 50%", "--focus-m": slide.focusMobile ?? slide.focus ?? "50% 50%", "--zoom": slide.zoom ?? 1 } as CSSProperties;
  return (
    <picture className={styles.picture} style={style}>
      <source media="(max-width: 767px)" srcSet={tall.srcSet} sizes={tall.sizes} />
      <img {...wide} alt="" className={styles.photo} draggable={false} />
    </picture>
  );
}

/** The carousel resets to its first slide when the console's set changes (keyed by the slide ids). */
export default function Hero() {
  const slides = useBanners();
  return <Carousel key={slides.map((s) => s.id).join("|")} slides={slides} />;
}

function Carousel({ slides }: { slides: HeroSlide[] }) {
  const dealer = useDealer();
  const reduced = useReducedMotion();
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0, 1 % count]));
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const go = (to: number) => {
    const next = ((to % count) + count) % count;
    setIndex(next);
    setSeen((prev) => (prev.has(next) && prev.has((next + 1) % count) ? prev : new Set([...prev, next, (next + 1) % count])));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") go(index + 1);
    else if (e.key === "ArrowLeft") go(index - 1);
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(e.clientY - start.y)) go(index + (dx < 0 ? 1 : -1));
  };

  const auto = count > 1 && !reduced;
  const running = auto && !paused && !held;
  const current = slides[index];

  return (
    <Section id="hero" theme="dark" label="The New Forever" className={styles.hero}>
      <div
        className={styles.stage}
        role="region"
        aria-roledescription="carousel"
        aria-label="Surreal photography"
        onKeyDown={onKeyDown}
        onFocus={(e) => setHeld(e.target.matches(":focus-visible"))}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
        }}
      >
        <div className={styles.slides} onPointerDown={onPointerDown} onPointerUp={onPointerUp} aria-live={running ? "off" : "polite"}>
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={styles.slide}
              data-active={i === index ? "" : undefined}
              data-motion={reduced ? undefined : ""}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${slide.label}`}
              aria-hidden={i !== index}
              style={{ "--hold": `${INTERVAL + 1.2}s` } as CSSProperties}
            >
              {seen.has(i) && <SlidePicture slide={slide} eager={i === 0} />}
            </div>
          ))}
        </div>
        <div className={styles.scrim} aria-hidden />

        <div className={styles.content}>
          <div className={styles.eyebrow}>
            <Eyebrow>Largest lab diamond grower in the world</Eyebrow>
          </div>
          <h1 className={`${styles.wordmark} t-display`}>SURREAL</h1>
          <div className={styles.copy}>
            <p className="t-body">
              The New Forever, for your counter. DEF color, VVS clarity lab grown diamonds and handcrafted jewelry, direct from the grower. Trade only, always.
            </p>
            <div className={styles.ctas}>
              <Button href={dealer ? "/diamonds" : account.login} variant="primary">
                {dealer ? "Search diamonds" : "Dealer log in"}
              </Button>
              <Button href={dealer ? account.dashboard : account.apply} variant="secondary">
                {dealer ? "Retailer Dashboard" : "Become a dealer"}
              </Button>
            </div>
          </div>
        </div>

        {count > 1 && (
          <div className={styles.controls}>
            <Link href={current.href} className={styles.caption}>
              <span className={`${styles.counter} tabular`}>
                {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
              <span className={styles.captionText}>{current.label}</span>
              <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <div className={styles.bars} role="group" aria-label="Choose a photograph">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  className={styles.bar}
                  aria-label={`Photograph ${i + 1}: ${slide.label}`}
                  aria-current={i === index ? "true" : undefined}
                  data-done={i < index ? "" : undefined}
                  onClick={() => go(i)}
                >
                  {i === index && (
                    <span
                      key={index}
                      className={styles.fill}
                      data-auto={auto ? "" : undefined}
                      style={{ animationDuration: `${INTERVAL}s`, animationPlayState: running ? "running" : "paused" }}
                      onAnimationEnd={() => go(index + 1)}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className={styles.buttons}>
              <button type="button" className={styles.iconBtn} onClick={() => go(index - 1)} aria-label="Previous photograph">
                <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 10H4M9 5l-5 5 5 5" />
                </svg>
              </button>
              {auto && (
                <button type="button" className={styles.iconBtn} onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play the photographs" : "Pause the photographs"} aria-pressed={paused}>
                  <svg aria-hidden viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                    {paused ? <path d="M6 4.5v11l9-5.5Z" /> : <path d="M6 4h3v12H6ZM11 4h3v12h-3Z" />}
                  </svg>
                </button>
              )}
              <button type="button" className={styles.iconBtn} onClick={() => go(index + 1)} aria-label="Next photograph">
                <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
