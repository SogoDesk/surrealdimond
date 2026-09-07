"use client";

/**
 * 01. The New Forever (hero). See DESIGN.md.
 *
 * A 100vh stage pinned for 160vh (120vh on mobile). The photographed halo ring
 * sits on the beam floor, one glass diamond hovers above it and settles into
 * the setting on scroll while the wordmark spreads and fades. The entrance
 * starts on the "surreal:reveal" window event (or at once when the document
 * already carries data-revealed="true").
 *
 *   <Hero />
 */

import { getImageProps } from "next/image";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import DiamondSceneLazy, { detectDiamondQuality, type DiamondQuality } from "@/components/three/DiamondSceneLazy";
import { registerGsap, gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
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
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const pastEndRef = useRef(false);
  const [quality] = useState<DiamondQuality>(detectDiamondQuality);
  const [stoneMounted, setStoneMounted] = useState(false);
  const { wide, tall } = heroPicture();

  // The canvas mounts on the client only, after the render tier is known.
  useEffect(() => {
    setStoneMounted(!pastEndRef.current);
  }, []);

  useGSAP(
    (_context, contextSafe) => {
      const stage = stageRef.current;
      if (!stage || !contextSafe) return;
      registerGsap();
      const reduced = prefersReducedMotion();
      const mobile = !window.matchMedia("(min-width: 768px)").matches;
      const q = gsap.utils.selector(stage);
      const photo = q<HTMLElement>("[data-hero=photo]")[0];
      const photoImg = q<HTMLElement>("[data-hero=photo-img]")[0];
      const overlay = q<HTMLElement>("[data-hero=overlay]")[0];
      const caustic = q<HTMLElement>("[data-hero=caustic]")[0];
      const flare = q<HTMLElement>("[data-hero=flare]")[0];
      const rays = q<HTMLElement>("[data-hero=rays]")[0];
      const raysInner = q<HTMLElement>("[data-hero=rays-inner]")[0];
      const causticDisc = q<HTMLElement>("[data-hero=caustic-disc]")[0];
      const stone = q<HTMLElement>("[data-hero=stone]")[0];
      const stoneIntro = q<HTMLElement>("[data-hero=stone-intro]")[0];
      const halo = q<HTMLElement>("[data-hero=halo]")[0];
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
      const section = stage.closest<HTMLElement>("[data-chapter=hero]") ?? stage;

      let chars: HTMLElement[] = [];
      let split: SplitText | undefined;
      let revealed = document.documentElement.dataset.revealed === "true";
      let fontsReady = false;
      let entranceStarted = false;
      let stoneShown = false;

      /* Reduced motion: the static composite, one short fade, no pin, no scrub. */
      if (reduced) {
        gsap.set([photoImg, stoneIntro, caustic, halo, overlay, wordmark, ...entranceCopy, ...exitWraps, scrollHint, ...scrollParts], {
          clearProps: "all",
        });
        gsap.set(halo, { opacity: 0 });
        const fade = contextSafe(() => gsap.fromTo(stage, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }));
        if (revealed) fade();
        else window.addEventListener(REVEAL_EVENT, fade, { once: true });
        return () => window.removeEventListener(REVEAL_EVENT, fade);
      }

      /* Initial states, set here so nothing stays hidden if an effect fails. */
      gsap.set(photoImg, { scale: 1.06 });
      gsap.set(stoneIntro, { scale: 0, opacity: 0 });
      gsap.set([caustic, halo, overlay], { opacity: 0 });
      gsap.set(rule, { scaleX: 0 });
      gsap.set([eyebrowLabel, body, ...ctas, ...scrollParts], { opacity: 0, y: 24 });
      // Hidden only until the display face has loaded and the characters are masked.
      gsap.set(wordmark, { opacity: 0 });

      /* Ambient loops. */
      gsap.to(causticDisc, { scale: 1.04, duration: 3, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.fromTo(beam, { yPercent: -100 }, { yPercent: 400, duration: 2.4, repeat: -1, ease: "power1.inOut" });

      /* The stone materialises once the canvas exists and the beam has passed. */
      const showStone = () => {
        if (stoneShown) return;
        stoneShown = true;
        gsap.killTweensOf(stoneIntro);
        gsap.fromTo(stoneIntro, { scale: 0, opacity: 0 }, { scale: 1, duration: 1.4, ease: "back.out(1.2)", overwrite: "auto" });
        gsap.to(stoneIntro, { opacity: 1, duration: 2, ease: "power2.out", overwrite: false });
      };
      const hasCanvas = () => stoneIntro.querySelector("canvas") !== null;
      const observer = new MutationObserver(() => {
        if (hasCanvas()) {
          if (entranceStarted) showStone();
        } else {
          stoneShown = false;
          gsap.set(stoneIntro, { scale: 0, opacity: 0 });
        }
      });
      observer.observe(stoneIntro, { childList: true, subtree: true });

      /* Entrance, in the wake of the preloader beam. */
      const playEntrance = () => {
        if (entranceStarted) return;
        entranceStarted = true;
        const tl = gsap.timeline({ defaults: { ease: "surreal" } });
        tl.to(photoImg, { scale: 1, duration: 2.4, ease: "power2.out" }, 0);
        tl.to(caustic, { opacity: 1, duration: 1.2, ease: "power2.out" }, 0.6);
        if (chars.length) tl.to(chars, { yPercent: 0, duration: 1.2, stagger: { each: 0.03, from: "center" } }, 0.2);
        tl.to(rule, { scaleX: 1, duration: 0.8 }, 0.9);
        tl.to(eyebrowLabel, { opacity: 1, y: 0, duration: 1 }, 1.0);
        tl.to(body, { opacity: 1, y: 0, duration: 1.2 }, 1.2);
        tl.to(ctas, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, 1.35);
        tl.to(scrollParts, { opacity: 1, y: 0, duration: 1.2, stagger: 0.06 }, 1.6);
        if (hasCanvas()) showStone();
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

      /* Scrubbed exit choreography over the pin. Durations are absolute within one unit. */
      const spreadPx = () => parseFloat(getComputedStyle(wordmark).fontSize) * 0.22;
      const descent = () => {
        const stoneCentre = stone.offsetTop + stone.offsetHeight / 2;
        const ringCentre = caustic.offsetTop + caustic.offsetHeight / 2;
        // The stone lands on the ring's crown, about 18 percent of the stage above the ring's centre.
        return ringCentre - stage.clientHeight * 0.18 - stoneCentre;
      };
      const scrub = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => "+=" + window.innerHeight * (mobile ? 1.2 : 1.6),
          pin: true,
          pinSpacing: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
          onToggle: (self) => {
            gsap.set([photo, overlay, stone, caustic, wordmark], { willChange: self.isActive ? "transform, opacity" : "auto" });
          },
        },
      });
      scrub.to(photo, { yPercent: -5, duration: 1 }, 0);
      scrub.to(overlay, { opacity: 0.38, duration: 1 }, 0);
      scrub.to(stone, { y: descent, scale: 0.55, duration: 1, ease: "power1.inOut" }, 0);
      scrub.to(caustic, { scale: 0.75, duration: 1, ease: "power1.inOut" }, 0);
      scrub.to(halo, { opacity: 1, duration: 0.4 }, 0.6);
      /* The landing: a tight bloom and a starburst flash as the stone reaches the crown, then settle into a glint. */
      if (flare) {
        scrub.fromTo(flare, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1.1, duration: 0.14, ease: "power3.out" }, 0.66);
        scrub.to(flare, { opacity: 0.7, scale: 0.9, duration: 0.2, ease: "power1.inOut" }, 0.8);
      }
      if (rays) {
        scrub.fromTo(rays, { opacity: 0, scale: 0.2, rotation: -12 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.18, ease: "power3.out" }, 0.66);
        scrub.to(rays, { opacity: 0.75, scale: 1.08, rotation: 6, duration: 0.16, ease: "power1.inOut" }, 0.84);
      }
      /* A slow twinkle on the rays keeps the settled stone alive between scroll moves. */
      if (raysInner) gsap.to(raysInner, { opacity: 0.55, duration: 1.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
      scrub.to(exitWraps, { opacity: 0, y: -16, duration: 0.4 }, 0);
      scrub.to(scrollHint, { opacity: 0, duration: 0.3 }, 0);

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
            const mid = (masks.length - 1) / 2;
            scrub.to(masks, { x: (i: number) => (i - mid) * spreadPx(), opacity: 0, duration: 0.7 }, 0);
          } catch {
            // Without a split the wordmark simply shows and spreads as one piece.
            chars = [];
            scrub.to(wordmark, { opacity: 0, duration: 0.7 }, 0);
          }
          gsap.set(wordmark, { opacity: 1 });
          fontsReady = true;
          tryStart();
        }),
      );

      /* Unmount the canvas once the pin is 100vh out of view; remount on the way back. */
      ScrollTrigger.create({
        trigger: section,
        start: "bottom -100%",
        onEnter: () => {
          pastEndRef.current = true;
          setStoneMounted(false);
        },
        onLeaveBack: () => {
          pastEndRef.current = false;
          setStoneMounted(true);
        },
      });

      return () => {
        window.removeEventListener(REVEAL_EVENT, onReveal);
        window.clearTimeout(fallback);
        observer.disconnect();
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
      <div ref={stageRef} className={styles.stage} data-pin="hero">
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

        <div className={styles.caustic} data-hero="caustic" aria-hidden>
          <div className={styles.causticDisc} data-hero="caustic-disc" />
        </div>
        <div className={styles.flare} data-hero="flare" aria-hidden />
        <div className={styles.rays} data-hero="rays" aria-hidden>
          <div data-hero="rays-inner">
            <svg viewBox="0 0 100 100" fill="none" stroke="#e8f6ff" strokeLinecap="round">
              <defs>
                <filter id="hero-ray-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.4" />
                </filter>
              </defs>
              <g filter="url(#hero-ray-glow)" strokeWidth="1.6" opacity="0.9">
                <line x1="50" y1="4" x2="50" y2="96" />
                <line x1="4" y1="50" x2="96" y2="50" />
                <line x1="20" y1="20" x2="80" y2="80" />
                <line x1="80" y1="20" x2="20" y2="80" />
              </g>
              <g strokeWidth="0.5" stroke="#ffffff">
                <line x1="50" y1="6" x2="50" y2="94" />
                <line x1="6" y1="50" x2="94" y2="50" />
                <line x1="22" y1="22" x2="78" y2="78" />
                <line x1="78" y1="22" x2="22" y2="78" />
              </g>
            </svg>
          </div>
        </div>

        <div className={styles.stone} data-hero="stone" aria-hidden>
          <div className={styles.halo} data-hero="halo" />
          <div className={styles.stoneIntro} data-hero="stone-intro">
            {stoneMounted && <DiamondSceneLazy className={styles.canvas} progressRef={progressRef} quality={quality} />}
          </div>
        </div>

        <div className={styles.scrim} aria-hidden />

        <h1 className={`${styles.wordmark} t-display`} data-hero="wordmark">
          SURREAL
        </h1>

        <div className={styles.eyebrow} data-hero="eyebrow">
          <Eyebrow>Largest lab diamond grower in the world</Eyebrow>
        </div>

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
    </Section>
  );
}
