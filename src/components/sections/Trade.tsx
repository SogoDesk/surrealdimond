"use client";

/**
 * 12. For the trade (trade)
 *
 * Sky panel continuing from Visit. The line mark stands 90vh tall in ink and
 * line blue, bleeding off the left edge so only its sweeping right half shows.
 * As the section reaches 30 percent in view the strands draw with DrawSVG and
 * the copy reveals 0.3s later. Once drawn the strands breathe (2 percent scale
 * over 6s) and brighten to full ink within 120px of the pointer through a small
 * pointer-distance loop. The white portrait card on the right parallaxes at
 * 1.1 and tilts 3 degrees toward the pointer. A straight hairline at the bottom
 * marks the seam where the footer's navy begins.
 *
 * "Talk to us" opens the contact drawer through openContactDrawer, which
 * raises the "surreal:contact" window event with the topic preset to Trade.
 *
 * Reduced motion: the mark stands fully drawn, the copy and card fade in over
 * 0.3s, no breathing, tilt, proximity or parallax.
 */

import Image from "next/image";
import { useRef } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import LineMark from "@/components/brand/LineMark";
import { getLineMarkPaths, sampleLineMarkCurve } from "@/components/brand/lineMarkPaths";
import { useSplitLines } from "@/components/motion/SplitReveal";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { isTouchDevice, prefersReducedMotion } from "@/hooks/useMedia";
import styles from "./Trade.module.css";

/** Window event the contact drawer listens on; re-exported so callers can share one name. */
export { CONTACT_EVENT } from "@/components/chrome/ContactDrawer";

const DRAW_DURATION = 1.1;
const DRAW_STAGGER = 0.018;
const DRAW_LEAD = 0.06;
const BREATH_SCALE = 1.02;
const BREATH_LEG = 3;
const PROXIMITY_PX = 120;
const TILT_DEG = 3;
/** Resting stroke opacities on sky; strands rise to 1 near the pointer. */
const INK_REST = 0.62;
const LINE_REST = 0.8;

export interface TradeProps {
  className?: string;
}

export default function Trade({ className = "" }: TradeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const headlineTween = useRef<gsap.core.Tween | null>(null);
  const copyStarted = useRef(false);

  // Headline lines rise out of their masks; the main timeline releases the tween 0.3s after the draw starts.
  useSplitLines(
    headlineRef,
    (split) => {
      const tween = gsap.fromTo(
        split.lines,
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, ease: "surreal", stagger: 0.08, paused: true },
      );
      headlineTween.current = tween;
      if (copyStarted.current) tween.play();
      return tween;
    },
    { enabled: !prefersReducedMotion() },
  );

  useGSAP(
    (_context, contextSafe) => {
      registerGsap();
      const root = rootRef.current;
      const mark = markRef.current;
      const copy = copyRef.current;
      const card = cardRef.current;
      const frame = frameRef.current;
      const parallax = parallaxRef.current;
      const image = imageRef.current;
      if (!root || !mark || !copy || !card || !frame || !parallax || !image) return;
      const svg = mark.querySelector<SVGSVGElement>("svg[data-line-mark]");
      if (!svg) return;

      const inkPaths = Array.from(svg.querySelectorAll<SVGPathElement>('[data-layer="ink"] path'));
      const linePaths = Array.from(svg.querySelectorAll<SVGPathElement>('[data-layer="sky"] path'));
      const eyebrowRule = copy.querySelector<HTMLElement>(".eyebrow-rule");
      const eyebrowLabel = (eyebrowRule?.nextElementSibling as HTMLElement | null) ?? null;
      const body = copy.querySelector<HTMLElement>("[data-body]");
      const ctas = copy.querySelector<HTMLElement>("[data-ctas]");
      const caption = card.querySelector<HTMLElement>("[data-caption]");
      const reduced = prefersReducedMotion();

      gsap.set(inkPaths, { opacity: INK_REST });
      gsap.set(linePaths, { opacity: LINE_REST });

      if (reduced) {
        copyStarted.current = true;
        gsap.fromTo(
          [copy, card],
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.3, ease: "none", scrollTrigger: { trigger: root, start: "top 70%", once: true } },
        );
        return;
      }

      /* ----- start states ----- */
      gsap.set([...inkPaths, ...linePaths], { drawSVG: "0%" });
      if (eyebrowRule) gsap.set(eyebrowRule, { scaleX: 0, transformOrigin: "0% 50%" });
      if (eyebrowLabel) gsap.set(eyebrowLabel, { autoAlpha: 0, x: -8 });
      if (body) gsap.set(body, { autoAlpha: 0, y: 40 });
      if (ctas) gsap.set(ctas, { autoAlpha: 0, y: 24 });
      gsap.set(frame, { clipPath: "inset(0 0 100% 0)" });
      gsap.set(image, { scale: 1.12, transformOrigin: "50% 50%" });
      if (caption) gsap.set(caption, { autoAlpha: 0, y: 12 });
      gsap.set(parallax, { scale: 1.1, transformOrigin: "50% 50%" });
      gsap.set(card, { transformPerspective: 1000, transformOrigin: "50% 50%" });

      /* ----- draw, then the copy and the card ----- */
      const safe = contextSafe ?? (<T extends (...args: never[]) => unknown>(fn: T) => fn);
      const startBreath = safe(() => {
        gsap.to(svg, {
          scale: BREATH_SCALE,
          duration: BREATH_LEG,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "0% 100%",
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 70%", once: true },
        onComplete: startBreath,
      });
      // Line blue leads its ink partner slightly so the mark seems lit from one side.
      linePaths.forEach((p, i) => tl.to(p, { drawSVG: "100%", duration: DRAW_DURATION, ease: "power2.out" }, i * DRAW_STAGGER));
      inkPaths.forEach((p, i) =>
        tl.to(p, { drawSVG: "100%", duration: DRAW_DURATION, ease: "power2.out" }, i * DRAW_STAGGER + DRAW_LEAD),
      );
      tl.add(() => {
        copyStarted.current = true;
        headlineTween.current?.play();
      }, 0.3);
      if (eyebrowRule) tl.to(eyebrowRule, { scaleX: 1, duration: 1, ease: "surreal" }, 0.3);
      if (eyebrowLabel) tl.to(eyebrowLabel, { autoAlpha: 1, x: 0, duration: 1, ease: "surreal" }, 0.45);
      if (body) tl.to(body, { autoAlpha: 1, y: 0, duration: 1.2, ease: "surreal" }, 0.7);
      if (ctas) tl.to(ctas, { autoAlpha: 1, y: 0, duration: 1.1, ease: "surreal" }, 0.9);
      tl.to(frame, { clipPath: "inset(0 0 0% 0)", duration: 1.3, ease: "surreal" }, 0.5);
      tl.to(image, { scale: 1, duration: 1.3, ease: "surreal" }, 0.5);
      if (caption) tl.to(caption, { autoAlpha: 1, y: 0, duration: 1, ease: "surreal" }, 1.4);

      /* ----- card parallax at 1.1 ----- */
      gsap.fromTo(
        parallax,
        { yPercent: -4 },
        {
          yPercent: 4,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
        },
      );

      if (isTouchDevice()) return;

      /* ----- pointer: strand proximity and card tilt ----- */
      const count = inkPaths.length;
      const curves = getLineMarkPaths(count).map((p) => sampleLineMarkCurve(p.t, 8));
      const current = new Float32Array(count);
      const target = new Float32Array(count);
      const radius2 = PROXIMITY_PX * PROXIMITY_PX;
      let pointerX = 0;
      let pointerY = 0;
      let inside = false;
      let dirty = false;
      let raf = 0;

      const paint = (i: number, v: number) => {
        inkPaths[i].style.opacity = String(INK_REST + (1 - INK_REST) * v);
        const partner = linePaths[i];
        if (partner) partner.style.opacity = String(LINE_REST + (1 - LINE_REST) * v);
      };
      const retarget = () => {
        if (!inside) {
          target.fill(0);
          return;
        }
        const m = svg.getScreenCTM();
        if (!m) return;
        for (let i = 0; i < count; i++) {
          let best = Infinity;
          const pts = curves[i];
          for (let j = 0; j < pts.length; j++) {
            const [x, y] = pts[j];
            const sx = m.a * x + m.c * y + m.e - pointerX;
            const sy = m.b * x + m.d * y + m.f - pointerY;
            const d2 = sx * sx + sy * sy;
            if (d2 < best) best = d2;
          }
          target[i] = best < radius2 ? 1 - best / radius2 : 0;
        }
      };
      const tick = () => {
        if (dirty) {
          retarget();
          dirty = false;
        }
        let settled = true;
        for (let i = 0; i < count; i++) {
          const delta = target[i] - current[i];
          if (Math.abs(delta) > 0.003) {
            current[i] += delta * 0.18;
            settled = false;
            paint(i, current[i]);
          } else if (current[i] !== target[i]) {
            current[i] = target[i];
            paint(i, current[i]);
          }
        }
        raf = settled && !dirty ? 0 : requestAnimationFrame(tick);
      };
      const wake = () => {
        dirty = true;
        if (!raf) raf = requestAnimationFrame(tick);
      };

      const rotateX = gsap.quickTo(card, "rotationX", { duration: 0.8, ease: "power3.out" });
      const rotateY = gsap.quickTo(card, "rotationY", { duration: 0.8, ease: "power3.out" });
      const tilt = (x: number, y: number) => {
        const r = card.getBoundingClientRect();
        const span = root.getBoundingClientRect().width / 2 || 1;
        const nx = gsap.utils.clamp(-1, 1, (x - (r.left + r.width / 2)) / span);
        const ny = gsap.utils.clamp(-1, 1, (y - (r.top + r.height / 2)) / span);
        rotateY(-nx * TILT_DEG);
        rotateX(ny * TILT_DEG);
      };

      const onMove = (e: PointerEvent) => {
        inside = true;
        pointerX = e.clientX;
        pointerY = e.clientY;
        wake();
        tilt(e.clientX, e.clientY);
      };
      const onLeave = () => {
        inside = false;
        wake();
        rotateX(0);
        rotateY(0);
      };
      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerleave", onLeave);
      return () => {
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerleave", onLeave);
        if (raf) cancelAnimationFrame(raf);
      };
    },
    { scope: rootRef },
  );

  const openContact = () => openContactDrawer("trade", "contact");

  return (
    <Section id="trade" theme="sky" label="For the trade" className={`${styles.section} ${className}`}>
      {/* Section forwards no ref, so this wrapper is the scope, pointer surface and positioning context. */}
      <div ref={rootRef} className={styles.inner}>
        <div ref={markRef} className={styles.mark} aria-hidden>
          <LineMark navy="var(--mark-a)" sky="var(--mark-b)" className={styles.markSvg} />
        </div>

        <div className={`container grid-12 ${styles.grid}`}>
          <div ref={copyRef} className={styles.copy}>
            <Eyebrow className={styles.eyebrow}>For the trade</Eyebrow>
            <h2 ref={headlineRef} className={`t-headline-sm ${styles.headline}`}>
              At the top of the food chain. Buy <em>directly</em> from the grower.
            </h2>
            <p data-body className={`t-body ${styles.body}`}>
              Retailers and designers work with us as the grower, not a reseller: loose diamonds and finished jewelry, one
              relationship, through the Retailer Dashboard.
            </p>
            <div data-ctas className={styles.ctas}>
              <Button href="/dashboard" variant="primary" arrow>
                Retailer Dashboard
              </Button>
              <Button variant="tertiary" onClick={openContact}>
                Talk to us
              </Button>
            </div>
          </div>

          <div className={styles.cardCol}>
            <div ref={cardRef} className={styles.card} data-cursor="view">
              <div ref={frameRef} className={styles.frame}>
                <div ref={parallaxRef} className={styles.parallax}>
                  <div ref={imageRef} className={styles.image}>
                    <Image
                      src="/media/photos/sb-3171.webp"
                      alt="Hands raised, wearing silver rings and bracelets"
                      width={2360}
                      height={2400}
                      sizes="(min-width: 768px) 24vw, 100vw"
                      className={styles.img}
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
              <p data-caption className={`t-caption ${styles.caption}`}>
                Finished jewelry and loose goods, direct from the grower.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.seam} aria-hidden />
      </div>
    </Section>
  );
}
