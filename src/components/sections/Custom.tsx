"use client";

/**
 * 09. From a sketch to a setting (custom)
 *
 * The light porcelain sheet that rises over the legacy chapter's sticky hold
 * (position relative, z-index 3). Left, a 3:4 frame stays sticky through
 * 140vh of travel while a scrubbed timeline runs the craft story: the traced
 * hairlines draw over empty paper (Sketch), the illustration fades in beneath
 * them with a faint grid around the frame (CAD), then the finished pendant
 * render wipes in from the left over the drawing (Bench). Right, the program
 * copy, the primary pill and the three stage labels on a hairline rail.
 *
 * The trace lives in customTrace.ts. Hover on the frame sends a highlight
 * along each drawn line in sequence. Reduced motion shows the three states
 * side by side with no scrub.
 *
 * Place after the legacy chapter; the legacy section is expected to end with
 * a sticky hold (margin-bottom -100vh), which this section's opaque ground and
 * z-index cover as it scrolls up.
 */

import Image from "next/image";
import { useRef, type CSSProperties, type MouseEvent } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/motion/Reveal";
import SplitReveal from "@/components/motion/SplitReveal";
import { registerGsap, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useReducedMotion, prefersReducedMotion, isTouchDevice } from "@/hooks/useMedia";
import { scrollToTarget } from "@/lib/scroll";
import { CUSTOM_TRACE, STAGE_CROP, TRACE_SIZE, WORDMARK_PATCHES, patchGeometry, stageVars } from "./customTrace";
import styles from "./Custom.module.css";

const SKETCH_SRC = "/media/banners/social-8.webp";
const RENDER_SRC = "/media/renders/branding-images8028.webp";
const SKETCH_ALT = "Hand-drawn fashion illustration of a woman in profile wearing drop earrings and a necklace";
const RENDER_ALT = "Teardrop pave pendant in white gold";
const SKETCH_SIZES = "(max-width: 767px) 125vw, 56vw";
const RENDER_SIZES = "(max-width: 767px) 100vw, 42vw";

const HAIRLINE_PX = 1.15;
const SHIMMER_PX = 1.8;
const MOBILE = "(max-width: 767px)";

/* Timeline landmarks, as fractions of the scrubbed travel */
const DRAW_END = 0.45;
const RASTER_START = 0.35;
const RASTER_END = 0.6;
const WIPE_START = 0.6;

const STAGES = [
  { key: "sketch", label: "Sketch" },
  { key: "cad", label: "CAD" },
  { key: "bench", label: "Bench" },
] as const;
type StageKey = (typeof STAGES)[number]["key"];

const stageFor = (progress: number): StageKey =>
  progress < RASTER_START ? "sketch" : progress < WIPE_START ? "cad" : "bench";

export interface CustomProps {
  /** id of the following section, used by the skip link. */
  nextId?: string;
  className?: string;
}

/* Both crops travel as custom properties; Custom.module.css picks one per breakpoint. */
const CROP_VARS = {
  ...stageVars(STAGE_CROP.desktop, "desktop"),
  ...stageVars(STAGE_CROP.mobile, "mobile"),
} as CSSProperties;

/** One frame: paper, the drawing, the traced lines and the render on top. */
function Frame({ state, shimmer = false }: { state: "live" | StageKey; shimmer?: boolean }) {
  return (
    <div className={styles.frame} data-state={state} data-frame data-cursor="view" style={CROP_VARS}>
      {state === "cad" && <div className={styles.gridBg} aria-hidden />}
      <div className={styles.shadow} data-layer="shadow" />
      <div className={styles.paper}>
        <div className={styles.stage} data-stage-box>
          <div className={styles.raster} data-layer="raster">
            <Image src={SKETCH_SRC} alt={SKETCH_ALT} fill sizes={SKETCH_SIZES} />
            {WORDMARK_PATCHES.map((tile, i) => {
              const geo = patchGeometry(tile);
              return (
                <div key={i} className={styles.patch} style={geo.outer} aria-hidden>
                  <div className={styles.patchInner} style={geo.inner}>
                    <Image src={SKETCH_SRC} alt="" fill sizes={SKETCH_SIZES} />
                  </div>
                </div>
              );
            })}
          </div>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${TRACE_SIZE} ${TRACE_SIZE}`}
            preserveAspectRatio="none"
            aria-hidden
            data-trace-svg
          >
            <g className={styles.lines} data-lines fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={HAIRLINE_PX}>
              {CUSTOM_TRACE.map((p, i) => (
                <path key={p.id} d={p.d} data-trace={i} data-group={p.group} />
              ))}
            </g>
            {shimmer && (
              <g className={styles.shimmer} data-shimmer-group fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={SHIMMER_PX}>
                {CUSTOM_TRACE.map((p, i) => (
                  <path key={p.id} d={p.d} data-shimmer={i} />
                ))}
              </g>
            )}
          </svg>
        </div>
        <div className={styles.render} data-layer="render">
          <Image src={RENDER_SRC} alt={RENDER_ALT} fill sizes={RENDER_SIZES} />
        </div>
      </div>
    </div>
  );
}

export default function Custom({ nextId = "education", className = "" }: CustomProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const frameColRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      const grid = gridRef.current;
      const col = frameColRef.current;
      const rail = railRef.current;
      if (!root || !grid || !col || !rail || prefersReducedMotion()) return;

      const frame = col.querySelector<HTMLElement>("[data-frame]");
      const svg = col.querySelector<SVGSVGElement>("svg[data-trace-svg]");
      const gridBg = col.querySelector<HTMLElement>("[data-grid-bg]");
      const raster = col.querySelector<HTMLElement>('[data-layer="raster"]');
      const render = col.querySelector<HTMLElement>('[data-layer="render"]');
      const shadow = col.querySelector<HTMLElement>('[data-layer="shadow"]');
      const linesGroup = svg?.querySelector<SVGGElement>("[data-lines]");
      const shimmerGroup = svg?.querySelector<SVGGElement>("[data-shimmer-group]");
      if (!frame || !svg || !gridBg || !raster || !render || !shadow || !linesGroup) return;

      const paths = Array.from(linesGroup.querySelectorAll<SVGPathElement>("path[data-trace]"));
      const shimmers = shimmerGroup ? Array.from(shimmerGroup.querySelectorAll<SVGPathElement>("path[data-shimmer]")) : [];
      const labels = Array.from(rail.querySelectorAll<HTMLElement>("[data-stage]"));
      const marker = rail.querySelector<HTMLElement>("[data-marker]");

      /* Mobile: the frame is in flow (not sticky), so it drives the scrub itself. */
      const mobile = window.matchMedia(MOBILE).matches;

      /* Hairlines stay one pixel whatever size the stage renders at. */
      const fitStroke = () => {
        const scale = svg.clientWidth / TRACE_SIZE || 1;
        linesGroup.setAttribute("stroke-width", (HAIRLINE_PX / scale).toFixed(3));
        shimmerGroup?.setAttribute("stroke-width", (SHIMMER_PX / scale).toFixed(3));
      };
      fitStroke();
      const ro = new ResizeObserver(fitStroke);
      ro.observe(svg);

      /* Eyebrow rule and label, as the copy enters */
      const eyebrowRule = root.querySelector<HTMLElement>(".eyebrow-rule");
      const eyebrowLabel = eyebrowRule?.nextElementSibling as HTMLElement | null;
      if (eyebrowRule && eyebrowLabel) {
        const trigger = { trigger: textRef.current ?? root, start: "top 85%", once: true };
        gsap.fromTo(eyebrowRule, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 1, ease: "surreal", scrollTrigger: trigger });
        gsap.fromTo(eyebrowLabel, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 1, delay: 0.15, ease: "surreal", scrollTrigger: trigger });
      }

      /* Initial states */
      gsap.set(paths, { drawSVG: "0%", autoAlpha: 1 });
      if (shimmerGroup) gsap.set(shimmerGroup, { autoAlpha: 0 });
      gsap.set(raster, { autoAlpha: 0 });
      gsap.set(gridBg, { autoAlpha: 0 });
      gsap.set(render, { clipPath: "inset(0 100% 0 0)" });
      gsap.set(shadow, { autoAlpha: 0 });

      /* Where each line sits across the frame, so it fades as the wipe passes it. */
      const frameRect = frame.getBoundingClientRect();
      const across = paths.map((p) => {
        const r = p.getBoundingClientRect();
        const f = (r.left + r.width / 2 - frameRect.left) / (frameRect.width || 1);
        return Math.min(1, Math.max(0, f));
      });

      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      tl.to(paths, { drawSVG: "100%", duration: 0.12, stagger: { amount: DRAW_END - 0.12 } }, 0);
      tl.to(raster, { autoAlpha: 1, duration: RASTER_END - RASTER_START }, RASTER_START);
      tl.to(gridBg, { autoAlpha: 1, duration: 0.1 }, RASTER_START).to(gridBg, { autoAlpha: 0, duration: 0.1 }, RASTER_END - 0.1);
      tl.to(render, { clipPath: "inset(0 0% 0 0)", duration: 1 - WIPE_START }, WIPE_START);
      tl.to(shadow, { autoAlpha: 1, duration: 0.3 }, WIPE_START + 0.05);
      paths.forEach((p, i) => {
        const at = WIPE_START + (1 - WIPE_START) * across[i];
        tl.to(p, { autoAlpha: 0, duration: 0.05 }, Math.max(WIPE_START, at - 0.03));
      });

      /* Stage rail: the marker is a fixed-width hairline moved and scaled by transform only. */
      let active: StageKey | null = null;
      const placeMarker = (immediate = false) => {
        const label = labels.find((l) => l.dataset.stage === active) ?? labels[0];
        if (!marker || !label) return;
        const base = marker.offsetWidth || 1;
        gsap.to(marker, {
          x: label.offsetLeft,
          scaleX: label.offsetWidth / base,
          transformOrigin: "0% 50%",
          duration: immediate ? 0 : 0.6,
          ease: "surreal",
          overwrite: true,
        });
      };
      const setStage = (progress: number) => {
        const next = stageFor(progress);
        if (next === active) return;
        active = next;
        for (const l of labels) l.dataset.active = String(l.dataset.stage === next);
        placeMarker();
      };
      setStage(0);
      placeMarker(true);

      const trigger = ScrollTrigger.create({
        trigger: mobile ? frame : grid,
        start: mobile ? "top 80%" : "top 62%",
        end: mobile ? "bottom 25%" : "bottom bottom",
        scrub: 1,
        animation: tl,
        onUpdate: (self) => setStage(self.progress),
        onToggle: (self) => {
          render.style.willChange = self.isActive ? "clip-path" : "";
        },
        onRefresh: () => placeMarker(true),
      });

      /* Hover: a highlight runs along each drawn line in sequence, 1.2s.
         Visibility is toggled on the group (GSAP writes visibility inherit,
         so a hidden parent would keep the paths hidden). */
      let shimmering = false;
      const shimmer = () => {
        const p = tl.progress();
        if (shimmering || !shimmerGroup || shimmers.length === 0 || p < DRAW_END - 0.05 || p > WIPE_START + 0.25) return;
        shimmering = true;
        const lengths = shimmers.map((s) => s.getTotalLength());
        const dashes = lengths.map((l) => Math.max(60, l * 0.28));
        shimmers.forEach((s, i) => {
          s.style.strokeDasharray = `${dashes[i]} ${lengths[i] + dashes[i]}`;
        });
        gsap
          .timeline({
            onComplete: () => {
              shimmering = false;
              gsap.set(shimmerGroup, { autoAlpha: 0 });
            },
          })
          .set(shimmerGroup, { autoAlpha: 0.9 })
          .fromTo(
            shimmers,
            { strokeDashoffset: (i: number) => dashes[i] },
            { strokeDashoffset: (i: number) => -lengths[i], duration: 0.5, ease: "power1.inOut", stagger: { amount: 0.7 } },
            0,
          );
      };
      const fine = !isTouchDevice();
      if (fine) frame.addEventListener("pointerenter", shimmer);

      return () => {
        ro.disconnect();
        trigger.kill();
        if (fine) frame.removeEventListener("pointerenter", shimmer);
        render.style.willChange = "";
      };
    },
    { scope: rootRef, dependencies: [reduced], revertOnUpdate: true },
  );

  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(nextId);
    if (!target) return;
    event.preventDefault();
    scrollToTarget(target);
  };

  return (
    <Section id="custom" theme="light" label="Custom jewelry" className={`${styles.section} ${className}`}>
      <a href={`#${nextId}`} className={`t-nav ${styles.skip}`} onClick={skip}>
        Skip the custom stage
      </a>
      <div ref={rootRef} className={styles.root} data-reduced={reduced ? "true" : undefined}>
        <div ref={gridRef} className={`container grid-12 ${styles.grid}`}>
          <div ref={frameColRef} className={styles.frameCol}>
            {reduced ? (
              <div className={styles.states}>
                {STAGES.map((s) => (
                  <div key={s.key}>
                    <Frame state={s.key} />
                    <p className={`t-caption ${styles.stateLabel}`}>{s.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className={styles.gridBg} data-grid-bg aria-hidden />
                <Frame state="live" shimmer />
              </>
            )}
          </div>

          <div ref={textRef} className={styles.textCol}>
            <div className={styles.eyebrow}>
              <Eyebrow>Custom jewelry</Eyebrow>
            </div>
            <SplitReveal as="h2" className={`t-headline ${styles.headline}`} stagger={0.04}>
              From a sketch to <em>a setting</em>.
            </SplitReveal>
            <Reveal as="p" effect="fade-up" delay={0.15} className={`t-body ${styles.body}`}>
              Bring us a drawing, a photograph or an idea. Our state of the art CAD department turns it into a
              precise model, our craftspeople turn the model into the piece, and a diamond we grew completes it.
            </Reveal>
            <Reveal effect="fade-up" delay={0.3} className={styles.cta}>
              <Button href="/custom" variant="primary" arrow>
                Begin a custom piece
              </Button>
            </Reveal>
            <Reveal effect="fade-up" delay={0.45}>
              <div ref={railRef} className={styles.rail} role="list" aria-label="Stages of a custom piece">
                <span className={styles.marker} data-marker aria-hidden />
                {STAGES.map((s, i) => (
                  <span
                    key={s.key}
                    role="listitem"
                    className={`t-caption ${styles.railLabel}`}
                    data-stage={s.key}
                    data-active={reduced ? undefined : String(i === 0)}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}
