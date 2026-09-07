"use client";

/**
 * 01. The New Forever (hero). See DESIGN.md.
 *
 * A held 100vh stage: the photographed halo ring on the beam floor, the
 * wordmark set large on the left, and the copy at the foot. The opening stone
 * (OpeningStone.tsx) hovers half off the right edge in its own fixed layer.
 * There is no pin: the stage is sticky inside a taller section, so the time
 * chapter rises over it while the wordmark spreads and the copy fades. The
 * entrance starts on the "surreal:reveal" window event (or at once when the
 * document already carries data-revealed="true").
 *
 *   <Hero />
 */

import { getImageProps } from "next/image";
import { useRef, type MouseEvent } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import { registerGsap, gsap, SplitText, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import { scrollToTarget } from "@/lib/scroll";
import styles from "./Hero.module.css";

const NEXT_SECTION = "#time";
const REVEAL_EVENT = "surreal:reveal";
const REVEAL_FALLBACK_MS = 6000;
const PHOTO_ALT = "A halo engagement ring on a studio floor lit by a single beam of light";

/**
 * The 21:9 crop above 768px, the 4:5 crop beneath it, both eager. The crops are
 * already small webp files, so they are served as is: the img then requests the
 * same URL the preloader decodes, and the image is in cache when the beam passes.
 */
function heroPicture() {
  const shared = { alt: PHOTO_ALT, sizes: "100vw", loading: "eager", fetchPriority: "high", unoptimized: true } as const;
  const { props: wide } = getImageProps({ ...shared, src: "/media/photos/hero-3984-wide.webp", width: 2400, height: 1028 });
  const { props: tall } = getImageProps({ ...shared, src: "/media/photos/hero-3984-tall.webp", width: 1400, height: 1750 });
  return { wide, tall };
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { wide, tall } = heroPicture();

  useGSAP(
    (_context, contextSafe) => {
      const stage = stageRef.current;
      if (!stage || !contextSafe) return;
      registerGsap();
      const reduced = prefersReducedMotion();
      const q = gsap.utils.selector(stage);
      const photo = q<HTMLElement>("[data-hero=photo]")[0];
      const photoImg = q<HTMLElement>("[data-hero=photo-img]")[0];
      const overlay = q<HTMLElement>("[data-hero=overlay]")[0];
      const wordmark = q<HTMLElement>("[data-hero=wordmark]")[0];
      const rule = q<HTMLElement>("[data-eyebrow] .eyebrow-rule")[0];
      const eyebrowLabel = q<HTMLElement>("[data-eyebrow] > span:last-child")[0];
      const body = q<HTMLElement>("[data-hero=body]")[0];
      const ctas = q<HTMLElement>("[data-hero=ctas] > *");
      const scrollHint = q<HTMLElement>("[data-hero=scroll]")[0];
      const scrollParts = q<HTMLElement>("[data-hero=scroll] > *");
      const beam = q<HTMLElement>("[data-hero=beam]")[0];
      // The entrance animates the inner elements; the scrubbed exit animates
      // their wrappers, so the two never record start values from each other.
      const entranceCopy = [rule, eyebrowLabel, body, ...ctas].filter(Boolean);
      const exitWraps = q<HTMLElement>("[data-hero=eyebrow], [data-hero=copy]");

      let chars: HTMLElement[] = [];
      let split: SplitText | undefined;
      let revealed = document.documentElement.dataset.revealed === "true";
      let fontsReady = false;
      let entranceStarted = false;

      /* Reduced motion: the static composite, one short fade, no scrub. */
      if (reduced) {
        gsap.set([photoImg, overlay, wordmark, ...entranceCopy, ...exitWraps, scrollHint, ...scrollParts], { clearProps: "all" });
        gsap.set(overlay, { opacity: 0 });
        const fade = contextSafe(() => gsap.fromTo(stage, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }));
        if (revealed) fade();
        else window.addEventListener(REVEAL_EVENT, fade, { once: true });
        return () => window.removeEventListener(REVEAL_EVENT, fade);
      }

      /* Initial states, set here so nothing stays hidden if an effect fails. */
      gsap.set(photoImg, { scale: 1.06 });
      gsap.set(overlay, { opacity: 0 });
      gsap.set(rule, { scaleX: 0 });
      gsap.set([eyebrowLabel, body, ...ctas, ...scrollParts], { opacity: 0, y: 24 });
      // Hidden only until the display face has loaded and the characters are masked.
      gsap.set(wordmark, { opacity: 0 });

      /* Ambient loop on the scroll indicator. */
      gsap.fromTo(beam, { yPercent: -100 }, { yPercent: 400, duration: 2.4, repeat: -1, ease: "power1.inOut" });

      /* Entrance, in the wake of the preloader beam. */
      const playEntrance = () => {
        if (entranceStarted) return;
        entranceStarted = true;
        const tl = gsap.timeline({ defaults: { ease: "surreal" } });
        tl.to(photoImg, { scale: 1, duration: 2.4, ease: "power2.out" }, 0);
        if (chars.length) tl.to(chars, { yPercent: 0, duration: 1.2, stagger: { each: 0.04, from: "start" } }, 0.2);
        tl.to(rule, { scaleX: 1, duration: 0.8 }, 0.9);
        tl.to(eyebrowLabel, { opacity: 1, y: 0, duration: 1 }, 1.0);
        tl.to(body, { opacity: 1, y: 0, duration: 1.2 }, 1.2);
        tl.to(ctas, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, 1.35);
        tl.to(scrollParts, { opacity: 1, y: 0, duration: 1.2, stagger: 0.06 }, 1.6);
      };
      const tryStart = () => {
        if (revealed && fontsReady) playEntrance();
      };

      const onReveal = contextSafe(() => {
        revealed = true;
        tryStart();
      });
      if (!revealed) window.addEventListener(REVEAL_EVENT, onReveal, { once: true });
      const fallback = window.setTimeout(onReveal, REVEAL_FALLBACK_MS);

      /* Scrubbed exit while the time chapter rises over the held stage. Durations are absolute within one unit. */
      const spreadPx = () => parseFloat(getComputedStyle(wordmark).fontSize) * 0.22;
      const scrub = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => "+=" + window.innerHeight * 1.3,
          scrub: 1,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            gsap.set([photo, overlay, wordmark], { willChange: self.isActive ? "transform, opacity" : "auto" });
          },
        },
      });
      scrub.to(photo, { yPercent: -6, duration: 1 }, 0);
      scrub.to(overlay, { opacity: 0.55, duration: 0.8 }, 0.2);
      scrub.to(exitWraps, { opacity: 0, y: -16, duration: 0.35 }, 0.2);
      scrub.to(scrollHint, { opacity: 0, duration: 0.2 }, 0.05);

      /* The wordmark splits once the display face has loaded. */
      document.fonts.ready.then(
        contextSafe(() => {
          if (!stage.isConnected) return;
          try {
            split = SplitText.create(wordmark, { type: "chars", mask: "chars", charsClass: "char" });
            chars = split.chars as HTMLElement[];
            gsap.set(chars, { yPercent: 100 });
            // The spread moves the masks, not the chars, so nothing is clipped on the way out.
            const masks = split.masks as HTMLElement[];
            scrub.to(masks, { x: (i: number) => i * spreadPx(), opacity: 0, duration: 0.6 }, 0.2);
          } catch {
            // Without a split the wordmark simply shows and fades as one piece.
            chars = [];
            scrub.to(wordmark, { opacity: 0, duration: 0.6 }, 0.2);
          }
          gsap.set(wordmark, { opacity: 1 });
          fontsReady = true;
          tryStart();
        }),
      );

      return () => {
        window.removeEventListener(REVEAL_EVENT, onReveal);
        window.clearTimeout(fallback);
        split?.revert();
      };
    },
    { scope: stageRef },
  );

  const goToCollections = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    scrollToTarget("#collections");
  };
  const skipAhead = (e: MouseEvent<HTMLElement>) => {
    if (!document.querySelector(NEXT_SECTION)) return;
    e.preventDefault();
    scrollToTarget(NEXT_SECTION);
  };

  return (
    <Section id="hero" theme="dark" label="The New Forever" className={styles.hero}>
      <div ref={sectionRef as never} className={styles.hold}>
        <div ref={stageRef} className={styles.stage} data-hero="stage">
          <a href={NEXT_SECTION} onClick={skipAhead} className={`${styles.skip} t-nav`} data-cursor="link">
            Skip the introduction
          </a>

          <div className={styles.photo} data-hero="photo">
            <picture>
              <source media="(max-width: 767px)" srcSet={tall.srcSet ?? tall.src} sizes={tall.sizes} />
              <img {...wide} alt="" className={styles.photoImg} data-hero="photo-img" />
            </picture>
          </div>
          <div className={styles.overlay} data-hero="overlay" aria-hidden />
          <div className={styles.scrim} aria-hidden />

          <div className={styles.eyebrow} data-hero="eyebrow">
            <Eyebrow>Largest lab diamond grower in the world</Eyebrow>
          </div>

          <h1 className={`${styles.wordmark} t-display`} data-hero="wordmark">
            SURREAL
          </h1>

          <div className={`${styles.bottom} container`}>
            <div className="grid-12">
              <div className={styles.copy} data-hero="copy">
                <p className="t-body" data-hero="body">
                  The New Forever. Perfected, premium lab grown diamonds, grown by us and handcrafted by the finest
                  craftspeople, without the premium price tag.
                </p>
                <div className={styles.ctas} data-hero="ctas">
                  <Button href="/jewelry/engagement" variant="primary">
                    Shop engagement rings
                  </Button>
                  <Button href="#collections" variant="secondary" onClick={goToCollections}>
                    Explore the collection
                  </Button>
                </div>
              </div>
              <div className={styles.scrollHint} data-hero="scroll" aria-hidden>
                <span className={`${styles.scrollLabel} t-caption`}>Scroll</span>
                <span className={styles.scrollLine}>
                  <span className={styles.scrollBeam} data-hero="beam" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
