"use client";

/**
 * 08. One seed line, every generation (legacy). DESIGN.md, section 08.
 *
 * The studio chapter continues. The bud photograph fills the right half with
 * a heavy vignette into studio black; the copy sits left with an 80vh seed
 * line behind it, built from the mark's own strand geometry: one authored
 * root stroke at the bottom left runs into the base of the fan and the 23
 * curve pairs (46 strands, sky leading porcelain) grow out of it. The root
 * draws first, the strands draw in a scroll scrub between 15 and 70 percent of
 * the section, five nodes pop as their strokes complete (the first, at the
 * seed, labelled Origin), a beam highlight travels along one strand every 3s,
 * strands near the pointer brighten, and the hands card reveals from the left
 * over the photograph's edge.
 *
 * The section's last 100vh is a CSS sticky hold so the light custom sheet can
 * rise over it: see Legacy.module.css for the wrapper notes.
 */

import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import Section from "@/components/ui/Section";
import { scrollToTarget } from "@/lib/scroll";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/motion/Reveal";
import { useSplitLines } from "@/components/motion/SplitReveal";
import { registerGsap, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useBreakpoint, useIsTouch, useReducedMotion } from "@/hooks/useMedia";
import {
  getLineMarkPaths,
  lineMarkCurve,
  sampleLineMarkCurve,
  LINE_MARK_SKY_OFFSET,
  LINE_MARK_VIEWBOX,
} from "@/components/brand/lineMarkPaths";
import s from "./Legacy.module.css";

const LEGACY_HREF = "/legacy";
/** id of the following section, used by the skip link past the hold. */
const NEXT_SECTION_ID = "custom";
const HIGHLIGHT_PERIOD = 3;
const HIGHLIGHT_TRAVEL = 1.7;
const GLOW_RADIUS_PX = 120;
const SKY_BASE = 0.62;
const INK_BASE = 0.42;

/* Seed line geometry: the mark's 23 curves plus one root stroke that feeds their bases. */
const STRANDS = getLineMarkPaths();
const SAMPLES = STRANDS.map((p) => sampleLineMarkCurve(p.t, 6));
const OUTER_BASE = lineMarkCurve(STRANDS[0].t)[2][3];
const INNER_BASE = lineMarkCurve(STRANDS[STRANDS.length - 1].t)[2][3];
const ORIGIN: readonly [number, number] = [OUTER_BASE[0] - 100, OUTER_BASE[1] + 250];
const NODE_STRANDS = [4, 10, 16, 22].filter((i) => i < STRANDS.length);

const fmt = (v: number) => v.toFixed(1).replace(/\.0$/, "");

const ROOT_D = (() => {
  const [ox, oy] = ORIGIN;
  const [bx, by] = OUTER_BASE;
  const [ix, iy] = INNER_BASE;
  const len = Math.hypot(ix - bx, iy - by) || 1;
  const ux = (ix - bx) / len;
  const uy = (iy - by) / len;
  // Rise out of the origin, hook into the outermost base heading along the base line, then run beneath every base.
  const c1: [number, number] = [ox + 4, oy - 130];
  const c2: [number, number] = [bx - 70 * ux, by - 70 * uy];
  return `M${fmt(ox)} ${fmt(oy)}C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(bx)} ${fmt(by)}L${fmt(ix)} ${fmt(iy)}`;
})();

const VIEWBOX = {
  x: LINE_MARK_VIEWBOX.x - 110,
  y: LINE_MARK_VIEWBOX.y,
  width: LINE_MARK_VIEWBOX.width + 130,
  height: ORIGIN[1] + 30 - LINE_MARK_VIEWBOX.y,
} as const;
const VIEWBOX_STRING = `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.width} ${VIEWBOX.height}`;
const SEED_ASPECT = VIEWBOX.width / VIEWBOX.height;
const SKY_TRANSFORM = `translate(${LINE_MARK_SKY_OFFSET.x} ${LINE_MARK_SKY_OFFSET.y})`;

const NODES = NODE_STRANDS.map((index) => {
  const tip = lineMarkCurve(STRANDS[index].t)[0][0];
  return { index, x: tip[0], y: tip[1] };
});
const ORIGIN_LABEL_STYLE: CSSProperties = {
  left: `${((ORIGIN[0] - VIEWBOX.x) / VIEWBOX.width) * 100}%`,
  top: `${((ORIGIN[1] - VIEWBOX.y) / VIEWBOX.height) * 100}%`,
};

interface Strand {
  el: SVGPathElement;
  index: number;
  sky: boolean;
  width: number;
  base: number;
  points: [number, number][];
}

export default function Legacy() {
  const stageRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const seedRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();
  const desktop = useBreakpoint("md");
  const touch = useIsTouch();

  /* The sticky hold: the stage sticks once its last 100vh fills the viewport. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const h = stage.offsetHeight;
      // A stage shorter than the viewport simply sticks at the top while the next sheet rises.
      stage.style.top = h > window.innerHeight ? `calc(100vh - ${h}px)` : "0px";
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => {
      observer.disconnect();
      stage.style.top = "";
    };
  }, []);

  /* Headline lines rise out of their masks at 20 percent in view. */
  useSplitLines(
    headlineRef,
    (split) =>
      gsap.fromTo(
        split.lines,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.1,
          ease: "surreal",
          stagger: 0.08,
          scrollTrigger: { trigger: copyRef.current ?? headlineRef.current, start: "top 80%", once: true },
        },
      ),
    { enabled: !reduced },
  );

  useGSAP(
    () => {
      registerGsap();
      const stage = stageRef.current;
      const svg = svgRef.current;
      const seed = seedRef.current;
      if (!stage || !svg || !seed) return;
      // Triggers key on the section box, not the sticky stage: ScrollTrigger measures
      // elements where they sit at refresh, and a stuck stage would report a shifted top.
      const section = (stage.parentElement ?? stage) as HTMLElement;
      // The hold begins once the stage's own height has scrolled past the entry point.
      const holdStart = () => `+=${stage.offsetHeight}`;

      const photoZoom = stage.querySelector<HTMLElement>("[data-photo-zoom]");
      const vignette = stage.querySelector<HTMLElement>("[data-vignette]");
      const hands = stage.querySelector<HTMLElement>("[data-hands]");
      const handsFrame = stage.querySelector<HTMLElement>("[data-hands-frame]");
      const root = svg.querySelector<SVGPathElement>("[data-root]");
      const highlight = svg.querySelector<SVGPathElement>("[data-highlight]");
      const originNode = svg.querySelector<SVGGElement>('[data-node="origin"]');
      const originLabel = seed.querySelector<HTMLElement>("[data-origin-label]");

      /* The Origin label is HTML, so it is placed from the SVG's rendered geometry (letterboxing included). */
      const placeLabel = () => {
        const ctm = svg.getScreenCTM();
        if (!ctm || !originLabel) return;
        const p = new DOMPoint(ORIGIN[0], ORIGIN[1]).matrixTransform(ctm);
        const r = seed.getBoundingClientRect();
        originLabel.style.left = `${p.x - r.left}px`;
        originLabel.style.top = `${p.y - r.top}px`;
      };
      placeLabel();
      const labelObserver = new ResizeObserver(placeLabel);
      labelObserver.observe(seed);

      const strandEls = Array.from(svg.querySelectorAll<SVGPathElement>("[data-strand]"));
      const strands: Strand[] = strandEls.map((el) => {
        const index = Number(el.dataset.strand);
        const sky = el.hasAttribute("data-sky");
        const off = sky ? LINE_MARK_SKY_OFFSET : { x: 0, y: 0 };
        return {
          el,
          index,
          sky,
          width: STRANDS[index]?.width ?? 2,
          base: sky ? SKY_BASE : INK_BASE,
          points: (SAMPLES[index] ?? []).map(([x, y]) => [x + off.x, y + off.y] as [number, number]),
        };
      });

      if (reduced) {
        // Final states are the DOM defaults; only a short fade marks the entry.
        gsap.fromTo(
          [copyRef.current, seed, hands].filter(Boolean),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.3, ease: "none", stagger: 0.1, scrollTrigger: { trigger: section, start: "top 80%", once: true } },
        );
        return () => labelObserver.disconnect();
      }

      gsap.fromTo(
        stage.querySelectorAll(".eyebrow-rule"),
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 1, ease: "surreal", scrollTrigger: { trigger: copyRef.current ?? stage, start: "top 80%", once: true } },
      );

      /* The bud photograph settles from 1.15 to 1 while its vignette edge sweeps 12vw left. */
      const travel = { trigger: section, start: "top bottom", end: holdStart, scrub: 0.8, invalidateOnRefresh: true } as const;
      if (photoZoom) gsap.fromTo(photoZoom, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { ...travel } });
      if (vignette && desktop) {
        gsap.fromTo(vignette, { x: 0 }, { x: () => -0.12 * window.innerWidth, ease: "none", scrollTrigger: { ...travel } });
      }

      /* Hands card: clip from the left at 20 percent in view, parallax at 0.9. */
      if (handsFrame) {
        gsap.fromTo(
          handsFrame,
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", duration: 1.3, ease: "surreal", scrollTrigger: { trigger: hands ?? handsFrame, start: "top 80%", once: true } },
        );
      }
      if (hands) {
        const drift = () => (0.1 * window.innerHeight * (desktop ? 1.2 : 0.6)) / 2;
        gsap.fromTo(
          hands,
          { y: () => -drift() },
          { y: () => drift(), ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: holdStart, scrub: 0.6, invalidateOnRefresh: true } },
        );
      }

      /* Seed line scrub: root from 2 to 15 percent, strands sweeping from 15 to 70 percent, sky leading porcelain by 3 percent. */
      const scrub = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top bottom", end: holdStart, scrub: 0.8, invalidateOnRefresh: true },
      });
      const pop = { scale: 1, duration: 0.05, ease: "back.out(2.5)", transformOrigin: "50% 50%" };
      if (root) scrub.fromTo(root, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.13, ease: "none" }, 0.02);
      if (originNode) scrub.fromTo(originNode, { scale: 0 }, pop, 0.15);
      if (originLabel) scrub.fromTo(originLabel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.15);
      const pairs = STRANDS.length;
      const sweep = 0.35;
      const lead = sweep * 0.03;
      STRANDS.forEach((_, i) => {
        const at = 0.15 + (i / Math.max(1, pairs - 1)) * (0.55 - sweep - lead);
        const sky = svg.querySelector<SVGPathElement>(`[data-strand="${i}"][data-sky]`);
        const ink = svg.querySelector<SVGPathElement>(`[data-strand="${i}"][data-ink]`);
        if (sky) scrub.fromTo(sky, { drawSVG: "0%" }, { drawSVG: "100%", duration: sweep, ease: "none" }, at);
        if (ink) scrub.fromTo(ink, { drawSVG: "0%" }, { drawSVG: "100%", duration: sweep, ease: "none" }, at + lead);
        const node = svg.querySelector<SVGCircleElement>(`[data-node="ring"][data-node-strand="${i}"]`);
        if (node) scrub.fromTo(node, { scale: 0 }, pop, at + lead + sweep);
      });
      scrub.set({}, {}, 1);

      /* A beam highlight travels along one random strand every 3s while the chapter is on screen. */
      let highlightTimer: gsap.core.Tween | null = null;
      let highlightTween: gsap.core.Timeline | null = null;
      const stopHighlight = () => {
        highlightTimer?.kill();
        highlightTween?.kill();
        highlightTimer = highlightTween = null;
        if (highlight) gsap.set(highlight, { autoAlpha: 0 });
      };
      const runHighlight = () => {
        if (!highlight || strands.length === 0) return;
        const pick = strands[Math.floor(Math.random() * strands.length)];
        highlight.setAttribute("d", pick.el.getAttribute("d") ?? "");
        if (pick.sky) highlight.setAttribute("transform", SKY_TRANSFORM);
        else highlight.removeAttribute("transform");
        highlight.setAttribute("stroke-width", String(pick.width + 1.5));
        highlightTween = gsap
          .timeline({
            onComplete: () => {
              highlightTimer = gsap.delayedCall(Math.max(0.2, HIGHLIGHT_PERIOD - HIGHLIGHT_TRAVEL), runHighlight);
            },
          })
          .fromTo(highlight, { drawSVG: "0% 5%" }, { drawSVG: "95% 100%", duration: HIGHLIGHT_TRAVEL, ease: "power1.inOut" }, 0)
          .fromTo(highlight, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "none" }, 0)
          .to(highlight, { autoAlpha: 0, duration: 0.4, ease: "none" }, HIGHLIGHT_TRAVEL - 0.4);
      };

      /* Pointer drift on the photograph, up to 12px, only while the chapter is on screen. */
      const finePointer = desktop && !touch;
      let active = false;
      const xTo = photoZoom ? gsap.quickTo(photoZoom, "x", { duration: 0.8, ease: "power3" }) : null;
      const yTo = photoZoom ? gsap.quickTo(photoZoom, "y", { duration: 0.8, ease: "power3" }) : null;
      const onDrift = (e: PointerEvent) => {
        if (!active || !xTo || !yTo) return;
        xTo((e.clientX / window.innerWidth - 0.5) * 24);
        yTo((e.clientY / window.innerHeight - 0.5) * 24);
      };
      if (finePointer) window.addEventListener("pointermove", onDrift, { passive: true });

      const visibility = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          active = self.isActive;
          const wc = self.isActive ? "transform" : "";
          if (photoZoom) photoZoom.style.willChange = wc;
          if (vignette) vignette.style.willChange = wc;
          if (hands) hands.style.willChange = wc;
          if (self.isActive) {
            if (!highlightTween && !highlightTimer) runHighlight();
          } else {
            stopHighlight();
          }
        },
      });

      /* Hover glow: strands within 120px of the pointer brighten, opacity lerped per path. */
      let cleanupGlow = () => {};
      if (finePointer && strands.length) {
        const current = strands.map((st) => st.base);
        const target = current.slice();
        let ticking = false;
        let over = false;
        const tick = () => {
          let settled = true;
          for (let i = 0; i < strands.length; i++) {
            const next = current[i] + (target[i] - current[i]) * 0.14;
            if (Math.abs(next - current[i]) > 0.0005) settled = false;
            current[i] = next;
            strands[i].el.style.opacity = next.toFixed(3);
          }
          if (settled && !over) {
            gsap.ticker.remove(tick);
            ticking = false;
          }
        };
        const ensureTicking = () => {
          if (ticking) return;
          ticking = true;
          gsap.ticker.add(tick);
        };
        const onMove = (e: PointerEvent) => {
          const ctm = svg.getScreenCTM();
          if (!ctm) return;
          const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
          const radius = GLOW_RADIUS_PX / (ctm.a || 1);
          for (let i = 0; i < strands.length; i++) {
            let min = Infinity;
            for (const [x, y] of strands[i].points) {
              const dx = x - p.x;
              const dy = y - p.y;
              const d = dx * dx + dy * dy;
              if (d < min) min = d;
            }
            const k = Math.max(0, 1 - Math.sqrt(min) / radius);
            const base = strands[i].base;
            target[i] = base + (1 - base) * k * k * (3 - 2 * k);
          }
          ensureTicking();
        };
        const onEnter = () => {
          over = true;
        };
        const onLeave = () => {
          over = false;
          for (let i = 0; i < strands.length; i++) target[i] = strands[i].base;
          ensureTicking();
        };
        seed.addEventListener("pointerenter", onEnter);
        seed.addEventListener("pointermove", onMove, { passive: true });
        seed.addEventListener("pointerleave", onLeave);
        cleanupGlow = () => {
          seed.removeEventListener("pointerenter", onEnter);
          seed.removeEventListener("pointermove", onMove);
          seed.removeEventListener("pointerleave", onLeave);
          gsap.ticker.remove(tick);
          strands.forEach((st) => {
            st.el.style.opacity = String(st.base);
          });
        };
      }

      return () => {
        labelObserver.disconnect();
        visibility.kill();
        stopHighlight();
        cleanupGlow();
        if (finePointer) window.removeEventListener("pointermove", onDrift);
        [photoZoom, vignette, hands].forEach((el) => {
          if (el) el.style.willChange = "";
        });
      };
    },
    { scope: stageRef, dependencies: [reduced, desktop, touch], revertOnUpdate: true },
  );

  const seedStyle = { "--seed-aspect": SEED_ASPECT.toFixed(4) } as CSSProperties;

  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(NEXT_SECTION_ID);
    if (!target) return;
    event.preventDefault();
    scrollToTarget(target);
  };

  return (
    <Section id="legacy" theme="dark" label="Diamond Legacy" className={s.root}>
      <a href={`#${NEXT_SECTION_ID}`} className={`t-nav ${s.skip}`} onClick={skip} data-cursor="link">
        Skip Diamond Legacy
      </a>
      <div ref={stageRef} className={s.stage}>
        <div className={s.photo}>
          <div className={s.photoZoom} data-photo-zoom>
            <Image
              src="/media/photos/sb-4117.webp"
              alt="Three stone emerald cut ring resting in a green bud"
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
              className={s.photoImg}
              loading="lazy"
              decoding="async"
              quality={82}
            />
          </div>
          <div className={s.vignette} data-vignette aria-hidden />
          <div className={s.photoFade} aria-hidden />
        </div>

        <div className={`container grid-12 ${s.layout}`}>
          <div ref={copyRef} className={s.copy}>
            <Eyebrow>Diamond Legacy</Eyebrow>
            <h2 ref={headlineRef} className={`t-headline ${s.headline}`}>
              One seed line. <em>Every generation.</em>
            </h2>
            <Reveal effect="fade-up" duration={1.2} delay={0.2}>
              <p className={`t-body ${s.body}`}>
                Diamond Legacy preserves what matters most through diamonds grown from the same seed line, so the stones a family wears
                across the years share one origin. The same beginning, different hands, one story kept in light.
              </p>
            </Reveal>
            <Reveal effect="fade-up" duration={1.2} delay={0.35} className={s.cta}>
              <Button href={LEGACY_HREF} variant="secondary">
                Discover Diamond Legacy
              </Button>
            </Reveal>
          </div>

          <div ref={seedRef} className={s.seed} style={seedStyle}>
            <svg
              ref={svgRef}
              viewBox={VIEWBOX_STRING}
              preserveAspectRatio={desktop ? "xMidYMid meet" : "xMidYMax meet"}
              className={s.svg}
              aria-hidden
              focusable="false"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <g transform={SKY_TRANSFORM} style={{ stroke: "var(--sky)" }}>
                {STRANDS.map((p) => (
                  <path key={p.index} d={p.d} strokeWidth={p.width} data-strand={p.index} data-sky="" style={{ opacity: SKY_BASE }} />
                ))}
              </g>
              <g style={{ stroke: "var(--porcelain)" }}>
                {STRANDS.map((p) => (
                  <path key={p.index} d={p.d} strokeWidth={p.width} data-strand={p.index} data-ink="" style={{ opacity: INK_BASE }} />
                ))}
              </g>
              <path d={ROOT_D} strokeWidth={5} data-root style={{ stroke: "var(--porcelain)", opacity: 0.9 }} />
              <path d={STRANDS[0].d} strokeWidth={4} data-highlight className={s.highlight} style={{ stroke: "var(--beam)" }} />
              <g data-node="origin">
                <circle cx={ORIGIN[0]} cy={ORIGIN[1]} r={6} style={{ fill: "var(--sky)" }} />
                <circle cx={ORIGIN[0]} cy={ORIGIN[1]} r={14} strokeWidth={1} vectorEffect="non-scaling-stroke" style={{ stroke: "var(--porcelain)", opacity: 0.7 }} />
              </g>
              {NODES.map((n) => (
                <circle
                  key={n.index}
                  cx={n.x}
                  cy={n.y}
                  r={9}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  data-node="ring"
                  data-node-strand={n.index}
                  style={{ stroke: "var(--porcelain)", opacity: 0.8 }}
                />
              ))}
            </svg>
            <span className={s.originLabel} data-origin-label style={ORIGIN_LABEL_STYLE} aria-hidden="true">
              Origin
            </span>
          </div>

          <figure className={s.hands} data-hands>
            <div className={s.handsFrame} data-hands-frame>
              <Image
                src="/media/photos/sb-3568-alt.webp"
                alt="Hands wearing diamond rings and bracelets, resting on a knee"
                fill
                sizes="(max-width: 767px) 60vw, 18vw"
                className={s.handsImg}
                loading="lazy"
                decoding="async"
                quality={82}
              />
            </div>
            <figcaption className={s.handsCaption}>Grown from one line</figcaption>
          </figure>
        </div>
      </div>
    </Section>
  );
}
