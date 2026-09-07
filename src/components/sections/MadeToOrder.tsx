"use client";

/**
 * 05. Grown for you (made-to-order)
 *
 * A full-bleed paper panel with hairline rules. Left, a 560px SVG stage that
 * stays sticky through the section's 120vh of travel: thirty-five hairline
 * strokes in the mark's own colors draw in as a square seed, spread into
 * growth layers and settle into the side profile of a round brilliant as the
 * visitor scrolls. Right, the program copy with its two calls to action.
 *
 * The three stroke states are generated in madeToOrderStates.ts with identical
 * point counts, so the scrub lerps coordinates and rewrites each path's d
 * attribute per frame. Line blue strokes trail the ink strokes slightly. Once
 * drawn and settled, a masked porcelain gradient sweeps the facets every 6s.
 * Reduced motion: the brilliant state, static; text fades only.
 */

import { useId, useMemo, useRef, type CSSProperties, type MouseEvent } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/motion/Reveal";
import SplitReveal from "@/components/motion/SplitReveal";
import { registerGsap, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import { scrollToTarget } from "@/lib/scroll";
import {
  createStrokeBuffer,
  getMadeToOrderStates,
  morphStroke,
  pathFromPoints,
  STAGE_SIZE,
  STROKE_COUNT,
  type Point,
} from "./madeToOrderStates";
import styles from "./MadeToOrder.module.css";

const HAIRLINE_PX = 1.2;
const SHIMMER_EVERY = 6;
const SHIMMER_SWEEP = 1.2;
const MOBILE = "(max-width: 767px)";

export interface MadeToOrderProps {
  /** id of the following section, used by the skip link. */
  nextId?: string;
  className?: string;
}

export default function MadeToOrder({ nextId = "lookbook", className = "" }: MadeToOrderProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const strokesRef = useRef<SVGGElement>(null);
  const shimmerRef = useRef<SVGRectElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const maskId = `mto-mask-${uid}`;
  const gradId = `mto-grad-${uid}`;
  const strokesId = `mto-strokes-${uid}`;

  // The server renders the finished brilliant so the stone is always visible.
  const initial = useMemo(() => getMadeToOrderStates().brilliant.map((pts) => pathFromPoints(pts)), []);

  useGSAP(
    (_context, contextSafe) => {
      registerGsap();
      const root = rootRef.current;
      const svg = svgRef.current;
      const group = strokesRef.current;
      const shimmer = shimmerRef.current;
      if (!root || !svg || !group || !shimmer) return;
      // Tweens started later from ScrollTrigger and onComplete callbacks are
      // wrapped so the context still reverts them on unmount.
      const safe = <T extends (...args: never[]) => void>(fn: T): T => (contextSafe ? (contextSafe(fn) as T) : fn);

      const paths = Array.from(group.querySelectorAll<SVGPathElement>("path[data-stroke]"));
      if (paths.length !== STROKE_COUNT) return;
      const states = getMadeToOrderStates();
      const buffers: Point[][] = paths.map(() => createStrokeBuffer());

      const render = (progress: number) => {
        for (let i = 0; i < paths.length; i++) {
          morphStroke(states, i, progress, buffers[i]);
          paths[i].setAttribute("d", pathFromPoints(buffers[i]));
        }
      };

      // Hairlines stay hairlines whatever size the stage renders at.
      const fitStroke = () => {
        const scale = svg.getBoundingClientRect().width / STAGE_SIZE || 1;
        group.setAttribute("stroke-width", (HAIRLINE_PX / scale).toFixed(3));
      };
      fitStroke();
      const ro = new ResizeObserver(fitStroke);
      ro.observe(svg);

      const reduced = prefersReducedMotion();
      const eyebrowRule = root.querySelector<HTMLElement>(".eyebrow-rule");
      const eyebrowLabel = eyebrowRule?.nextElementSibling as HTMLElement | null;

      if (reduced) {
        render(1);
        gsap.set(shimmer, { autoAlpha: 0 });
        return () => ro.disconnect();
      }

      if (eyebrowRule && eyebrowLabel) {
        gsap.fromTo(
          eyebrowRule,
          { scaleX: 0, transformOrigin: "0% 50%" },
          { scaleX: 1, duration: 1, ease: "surreal", scrollTrigger: { trigger: textRef.current ?? root, start: "top 85%", once: true } },
        );
        gsap.fromTo(
          eyebrowLabel,
          { autoAlpha: 0, x: -8 },
          { autoAlpha: 1, x: 0, duration: 1, delay: 0.15, ease: "surreal", scrollTrigger: { trigger: textRef.current ?? root, start: "top 85%", once: true } },
        );
      }

      /* ----- morph state ----- */
      const scrub = { p: 0 };
      // Holds the strokes in the seed while they draw, then releases the scrub.
      const gate = { v: 0 };
      let drawing = false;
      let settled = false;
      let onScreen = false;
      let shimmering = false;
      let shimmerTl: gsap.core.Timeline | null = null;

      const syncShimmer = () => {
        const want = settled && onScreen && scrub.p * gate.v >= 0.97;
        if (want === shimmering) return;
        shimmering = want;
        if (!shimmerTl) return;
        if (want) shimmerTl.restart(true);
        else {
          shimmerTl.pause(0);
          gsap.set(shimmer, { autoAlpha: 0 });
        }
      };

      const paint = () => {
        render(scrub.p * gate.v);
        syncShimmer();
      };

      render(0);
      gsap.set(shimmer, { autoAlpha: 0, x: 0 });
      gsap.set(paths, { drawSVG: "0%" });

      const release = safe(() => {
        // Lengths change as the strokes morph, so drop the dash values
        // rather than leaving them pinned to the seed's length.
        for (const p of paths) {
          p.style.strokeDasharray = "";
          p.style.strokeDashoffset = "";
        }
        shimmerTl = gsap
          .timeline({ paused: true, repeat: -1, repeatDelay: SHIMMER_EVERY - SHIMMER_SWEEP })
          .set(shimmer, { autoAlpha: 1, x: 0 })
          .to(shimmer, { x: STAGE_SIZE * 2, duration: SHIMMER_SWEEP, ease: "power1.inOut" })
          .set(shimmer, { autoAlpha: 0 });
        gsap.to(gate, {
          v: 1,
          duration: 0.9,
          ease: "surreal",
          onUpdate: paint,
          onComplete: () => {
            settled = true;
            paint();
          },
        });
      });

      const startDraw = safe(() => {
        if (drawing) return;
        drawing = true;
        gsap.to(paths, {
          drawSVG: "100%",
          duration: 1.2,
          ease: "surreal",
          stagger: 0.02,
          onComplete: release,
        });
      });

      /* ----- draw in at 30 percent in view ----- */
      ScrollTrigger.create({
        trigger: root,
        start: "top 70%",
        once: true,
        onEnter: startDraw,
      });

      /* ----- scrubbed morph across the travel ----- */
      const mobile = window.matchMedia(MOBILE).matches;
      gsap.to(scrub, {
        p: 1,
        ease: "none",
        onUpdate: () => {
          // A page that opens past the section never crosses the draw
          // trigger, so the scrub starts the draw itself.
          if (scrub.p > 0) startDraw();
          paint();
        },
        scrollTrigger: mobile
          ? { trigger: stageRef.current ?? root, start: "top 90%", end: "bottom 20%", scrub: 1 }
          : { trigger: root, start: "top 55%", end: "bottom 75%", scrub: 1 },
      });

      ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          onScreen = self.isActive;
          syncShimmer();
        },
      });

      return () => ro.disconnect();
    },
    { scope: rootRef },
  );

  const skip = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(nextId);
    if (!target) return;
    e.preventDefault();
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    scrollToTarget(target);
  };

  const maskVars = { "--mto-ink": "#fff", "--mto-sky": "#fff" } as CSSProperties;

  return (
    <Section id="made-to-order" theme="light" label="Made to Order" className={`${styles.section} ${className}`}>
      <a href={`#${nextId}`} className={styles.skip} onClick={skip} data-cursor="link">
        Skip the made to order stage
      </a>
      <div className={styles.panel}>
        <div className={`container grid-12 ${styles.grid}`}>
          <div className={styles.stageCol}>
            <div ref={stageRef} className={styles.stage}>
              <svg
                ref={svgRef}
                className={styles.svg}
                viewBox={`0 0 ${STAGE_SIZE} ${STAGE_SIZE}`}
                width={STAGE_SIZE}
                height={STAGE_SIZE}
                role="img"
                aria-label="Thirty-five hairline strokes forming a seed, growth layers and a round brilliant seen from the side"
              >
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0" gradientTransform="rotate(18 0.5 0.5)">
                    <stop offset="0" stopColor="#F2F4F6" stopOpacity="0" />
                    <stop offset="0.4" stopColor="#F2F4F6" stopOpacity="0.85" />
                    <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="1" />
                    <stop offset="0.6" stopColor="#F2F4F6" stopOpacity="0.85" />
                    <stop offset="1" stopColor="#F2F4F6" stopOpacity="0" />
                  </linearGradient>
                  <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={STAGE_SIZE} height={STAGE_SIZE}>
                    <use href={`#${strokesId}`} style={maskVars} />
                  </mask>
                </defs>
                <g
                  id={strokesId}
                  ref={strokesRef}
                  className={styles.strokes}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={HAIRLINE_PX}
                >
                  {initial.map((d, i) => (
                    <path
                      key={i}
                      d={d}
                      data-stroke={i}
                      data-layer={i % 2 === 0 ? "ink" : "sky"}
                      className={i % 2 === 0 ? styles.ink : styles.sky}
                    />
                  ))}
                </g>
                <g mask={`url(#${maskId})`}>
                  <rect
                    ref={shimmerRef}
                    className={styles.shimmer}
                    x={-STAGE_SIZE}
                    y={-STAGE_SIZE * 0.25}
                    width={STAGE_SIZE}
                    height={STAGE_SIZE * 1.5}
                    fill={`url(#${gradId})`}
                  />
                </g>
              </svg>
            </div>
          </div>

          <div ref={textRef} className={styles.textCol}>
            <div className={styles.eyebrow}>
              <Eyebrow>Made to Order</Eyebrow>
            </div>
            <SplitReveal as="h2" className={`t-headline-sm ${styles.headline}`} stagger={0.04}>
              Create your very own diamond, grown specifically <em>for you</em>.
            </SplitReveal>
            <Reveal as="p" effect="fade-up" delay={0.15} className={`t-body ${styles.body}`}>
              Tell us the shape, the size and the color. We grow the stone to your specification, follow it from
              inception to final inspection, then set it for you or send it to you loose.
            </Reveal>
            <Reveal effect="fade-up" delay={0.3} className={styles.cta}>
              <Button href="/made-to-order" variant="primary" arrow>
                Start a made to order diamond
              </Button>
              <Button href="/contact" variant="secondary">
                Speak with us
              </Button>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}
