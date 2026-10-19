"use client";

/**
 * 11. See them in the light (visit). The brand's sky blue arrives as a circle
 * opening from the bottom center of the viewport, scrubbed over the last 40
 * percent of the section's approach with power2.in, the same gesture as the
 * engagement aperture. The section is a sky chapter throughout (its own ground
 * stays porcelain under the sky layer), so the header and cursor switch to sky
 * as the section's top crosses the bar, by which point the circle has passed
 * it. Left: eyebrow, headline, body, the office address block (set in by
 * character) and the two calls to action, both of which open the contact
 * drawer. Right: a white card holding the studio portrait behind a 1px ink
 * frame that widens while Book a visit is hovered, tilting toward the pointer.
 * Mobile: the circle becomes a 0.8s fade and the panel stacks. Reduced motion:
 * solid sky, short fades.
 */

import Image from "next/image";
import { useRef } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Parallax from "@/components/motion/Parallax";
import { useSplitLines } from "@/components/motion/SplitReveal";
import { registerGsap, gsap, SplitText, useGSAP } from "@/lib/gsap";
import { isTouchDevice, prefersReducedMotion } from "@/hooks/useMedia";
import { brand } from "@/content/site";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import styles from "./Visit.module.css";

const PHOTO = "/media/photos/sb-3502.webp";
/* The circle opens over the last 40 percent of the approach (progress 0.6 to 1). */
const CIRCLE_FROM = 0.6;
const RADIUS_VMAX = 150;
const TILT_DEG = 3;
const MOBILE = "(max-width: 767px)";

export interface VisitProps {
  className?: string;
}

export default function Visit({ className = "" }: VisitProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const addressRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const { office, social } = brand;

  // Headline lines rise out of their masks at 80 percent of the viewport.
  useSplitLines(
    headRef,
    (split) =>
      gsap.fromTo(
        split.lines,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.1,
          ease: "surreal",
          stagger: 0.08,
          scrollTrigger: { trigger: headRef.current, start: "top 80%", once: true },
        },
      ),
    { enabled: !prefersReducedMotion() },
  );

  const { contextSafe: safe } = useGSAP(
    (_context, contextSafe) => {
      registerGsap();
      const root = rootRef.current;
      const sky = skyRef.current;
      const copy = copyRef.current;
      const address = addressRef.current;
      const card = cardRef.current;
      const cardWrap = cardWrapRef.current;
      if (!root || !sky || !copy || !address || !card || !cardWrap) return;
      const section = root.closest<HTMLElement>("[data-chapter]");
      const reduce = prefersReducedMotion();
      const mobile = window.matchMedia(MOBILE).matches;

      const rule = copy.querySelector<HTMLElement>(".eyebrow-rule");
      const eyebrowLabel = copy.querySelector<HTMLElement>("[data-eyebrow] > span:last-child");
      const body = copy.querySelector<HTMLElement>("[data-body]");
      const rows = Array.from(address.querySelectorAll<HTMLElement>("[data-row]"));
      const rules = Array.from(address.querySelectorAll<HTMLElement>("[data-rule]"));
      const ctas = Array.from(copy.querySelectorAll<HTMLElement>("[data-ctas] > *"));
      const socialLink = root.querySelector<HTMLElement>("[data-social]");
      const img = card.querySelector<HTMLElement>("img");

      /* Reduced motion: solid sky at rest, 0.3s fades only. */
      if (reduce) {
        sky.dataset.open = "";
        const items = [rule, eyebrowLabel, body, ...rows, ...ctas, cardWrap, socialLink].filter(Boolean) as HTMLElement[];
        gsap.fromTo(
          items,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.3, stagger: 0.04, ease: "power1.out", scrollTrigger: { trigger: root, start: "top 80%", once: true } },
        );
        return;
      }

      /* The sky arrival. Mobile: a 0.8s fade. Desktop: the circle scrubbed over the approach. */
      if (mobile) {
        sky.dataset.open = "";
        gsap.fromTo(sky, { autoAlpha: 0 }, {
          autoAlpha: 1,
          duration: 0.8,
          ease: "power1.out",
          scrollTrigger: { trigger: root, start: "top 70%", once: true },
        });
      } else {
        /*
          Progress runs from the section's top at the viewport bottom (0) to the
          top of the viewport (1). The center sits at innerHeight * p in section
          pixels, which is always the bottom center of the viewport, and the
          radius only starts growing over the last 40 percent of the approach.
        */
        const clip = { p: 0 };
        const easeIn = gsap.parseEase("power2.in");
        const apply = () => {
          const p = gsap.utils.clamp(0, 1, clip.p);
          if (p >= 1) {
            sky.style.clipPath = "none";
            return;
          }
          const q = gsap.utils.clamp(0, 1, (p - CIRCLE_FROM) / (1 - CIRCLE_FROM));
          const r = RADIUS_VMAX * easeIn(q);
          const cy = Math.round(window.innerHeight * p);
          sky.style.clipPath = `circle(${r.toFixed(2)}vmax at 50% ${cy}px)`;
        };
        gsap.to(clip, {
          p: 1,
          ease: "none",
          onUpdate: apply,
          scrollTrigger: {
            trigger: section ?? root,
            start: "top bottom",
            end: "top top",
            scrub: 0.8,
            invalidateOnRefresh: true,
            onRefresh: apply,
            onToggle: (self) => {
              if (self.isActive) gsap.set(sky, { willChange: "clip-path" });
              else gsap.set(sky, { clearProps: "willChange" });
            },
          },
        });
        apply();
      }

      /* Copy stack: eyebrow rule, label, body, address rows typed in by character, CTAs, the social link. */
      gsap.set(rows, { autoAlpha: 0 });
      const buildCopy = () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: copy, start: "top 78%", once: true } });
        if (rule) tl.fromTo(rule, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.8, ease: "surreal" }, 0);
        if (eyebrowLabel) tl.fromTo(eyebrowLabel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.2);
        if (body) tl.fromTo(body, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "surreal" }, 0.5);
        tl.fromTo(rules, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.9, ease: "surreal", stagger: 0.06 }, 0.8);
        rows.forEach((row, i) => {
          let chars: Element[] = [];
          try {
            chars = SplitText.create(row, { type: "words,chars", charsClass: styles.char }).chars;
          } catch {
            chars = [];
          }
          const at = 0.9 + i * 0.06;
          tl.set(row, { autoAlpha: 1 }, at);
          if (chars.length) tl.fromTo(chars, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: "none", stagger: 0.01 }, at);
          else tl.fromTo(row, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, at);
        });
        tl.fromTo(ctas, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, ease: "surreal", stagger: 0.1 }, 1.2);
        if (socialLink) tl.fromTo(socialLink, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "surreal" }, 1.4);
      };
      const fonts = typeof document !== "undefined" ? document.fonts : undefined;
      (fonts ? fonts.ready : Promise.resolve()).then(contextSafe ? (contextSafe(buildCopy) as () => void) : buildCopy);

      /* Portrait card: clip-path reveal from the right while the photograph settles from 1.12 to 1. */
      gsap.fromTo(
        cardWrap,
        { clipPath: "inset(0 0 0 100%)" },
        {
          clipPath: "inset(0 0 0 0%)",
          duration: 1.3,
          ease: "surreal",
          scrollTrigger: { trigger: cardWrap, start: "top 80%", once: true },
          onComplete: () => gsap.set(cardWrap, { clearProps: "clipPath" }),
        },
      );
      if (img) {
        gsap.fromTo(img, { scale: 1.12, transformOrigin: "50% 50%" }, {
          scale: 1,
          duration: 1.3,
          ease: "surreal",
          scrollTrigger: { trigger: cardWrap, start: "top 80%", once: true },
          onComplete: () => gsap.set(img, { clearProps: "transform" }),
        });
      }

      /* Pointer tilt, fine pointers only. */
      if (isTouchDevice() || !window.matchMedia("(pointer: fine)").matches) return;
      gsap.set(cardWrap, { transformPerspective: 1000 });
      const rxTo = gsap.quickTo(cardWrap, "rotationX", { duration: 0.7, ease: "power3" });
      const ryTo = gsap.quickTo(cardWrap, "rotationY", { duration: 0.7, ease: "power3" });
      const move = (e: PointerEvent) => {
        const r = cardWrap.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rxTo(-py * TILT_DEG * 2);
        ryTo(px * TILT_DEG * 2);
      };
      const leave = () => {
        rxTo(0);
        ryTo(0);
      };
      cardWrap.addEventListener("pointermove", move);
      cardWrap.addEventListener("pointerleave", leave);
      return () => {
        cardWrap.removeEventListener("pointermove", move);
        cardWrap.removeEventListener("pointerleave", leave);
      };
    },
    { scope: rootRef },
  );

  /* Book a visit hover: the button lifts and the card's frame offset grows from 12px to 18px. Called through contextSafe so the tween is owned by the section's context. */
  const lift = (on: boolean) => {
    const card = cardRef.current;
    if (card) {
      if (on) card.dataset.lift = "";
      else delete card.dataset.lift;
    }
    const book = bookRef.current;
    if (book && !prefersReducedMotion()) {
      registerGsap();
      // "auto" so a reveal still fading this wrapper in keeps its opacity tween.
      gsap.to(book, { y: on ? -3 : 0, duration: 0.45, ease: "surreal", overwrite: "auto" });
    }
  };

  return (
    <Section id="visit" theme="sky" label="Visit New York" className={`${styles.section} ${className}`}>
      <div ref={skyRef} className={styles.sky} aria-hidden />
      <div ref={rootRef} className={`container ${styles.inner}`}>
        <div className={`grid-12 ${styles.grid}`}>
          <div ref={copyRef} className={styles.copy}>
            <Eyebrow>Visit New York</Eyebrow>
            <h2 ref={headRef} className={`t-headline ${styles.headline}`}>
              See them in <em>the light</em>.
            </h2>
            <p className={`t-body ${styles.body}`} data-body>
              Our North American office is at 551 Fifth Ave, Suite 2601, New York, NY 10176. Monday to Friday, 9:30am to 6pm EST.
              Call (844) 999-7262, or write to us and we will find a time.
            </p>

            <address ref={addressRef} className={styles.address}>
              <span className={styles.rule} data-rule aria-hidden />
              <a href={office.mapHref} target="_blank" rel="noreferrer" className={styles.row} data-row data-cursor="link">
                {office.address1}, {office.address2}
              </a>
              <span className={styles.rule} data-rule aria-hidden />
              <a href={office.phoneHref} className={styles.row} data-row data-cursor="link">
                {office.phone}
              </a>
              <span className={styles.rule} data-rule aria-hidden />
              <span className={styles.row} data-row>
                {office.hours}
              </span>
              <span className={styles.rule} data-rule aria-hidden />
            </address>

            <div className={styles.ctas} data-ctas>
              <div ref={bookRef} className={styles.ctaWrap} onPointerEnter={() => safe(lift)(true)} onPointerLeave={() => safe(lift)(false)}>
                <Button onClick={() => openContactDrawer("other", "visit")} className={styles.cta}>
                  Book a visit
                </Button>
              </div>
              <div className={styles.ctaWrap}>
                <Button variant="secondary" onClick={() => openContactDrawer("other", "contact")} className={styles.cta}>
                  Contact us
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.cardCol}>
            <div ref={cardWrapRef} className={styles.cardWrap}>
              <div ref={cardRef} className={styles.card} data-cursor="view">
                <span className={styles.frame} aria-hidden />
                <div className={`reveal-frame ${styles.photo}`}>
                  <Parallax speed={-0.1} scale={1.2} className={styles.parallax}>
                    <Image
                      src={PHOTO}
                      alt="A woman touching her collar, wearing layered silver jewelry"
                      fill
                      sizes="(max-width: 767px) 100vw, (max-width: 1279px) 42vw, 40vw"
                      className={styles.img}
                      decoding="async"
                      loading="lazy"
                    />
                  </Parallax>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a href={social.instagram} target="_blank" rel="noreferrer" className={`t-caption ${styles.social}`} data-social data-cursor="link">
          <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
            <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" />
            <circle cx="8" cy="8" r="3" />
            <circle cx="11.9" cy="4.1" r="0.5" fill="currentColor" stroke="none" />
          </svg>
          <span>Instagram</span>
        </a>
      </div>
    </Section>
  );
}
