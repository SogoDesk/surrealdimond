"use client";

/**
 * Cross-section of a round brilliant for the education chapter.
 *
 * The profile is built from the classic proportions (table 57 percent of the
 * diameter, crown angle 34.5 degrees, crown height about 15 percent, girdle 3
 * percent, pavilion angle 40.8 degrees, pavilion depth about 43 percent, small
 * culet). Ink hairlines draw the outline, line-blue hairlines suggest the
 * bezel, star, main and girdle facets of the near half, and five labels sit on
 * leader lines. A light ray is traced through the stone with Snell's law
 * (n = 2.42): it enters the table, reflects off both pavilion facets and exits
 * through the crown, looping every four seconds.
 *
 * Motion: the outline and facets draw with DrawSVG scrubbed between 10 and 50
 * percent of the section's travel (the trigger element is passed in), then the
 * leader lines draw and labels fade with a 0.08s stagger. The ray loop runs only
 * while the stage is on screen and the stone has drawn. Reduced motion renders
 * everything drawn with a static ray.
 *
 * The `ref` receives { highlight(focus) }: "history" pulses the whole stone,
 * "guide" glows the crown and pavilion labels, "faq" speeds up the ray, null
 * clears every state.
 */

import { useImperativeHandle, useMemo, useRef, type Ref, type RefObject } from "react";
import { registerGsap, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, useBreakpoint } from "@/hooks/useMedia";
import styles from "./Education.module.css";

export type DiagramFocus = "history" | "guide" | "faq";
export interface DiamondDiagramHandle {
  highlight(focus: DiagramFocus | null): void;
}

/* ----- geometry, in user units with the girdle centred on the origin ----- */

type Pt = [number, number];
const rad = (deg: number) => (deg * Math.PI) / 180;
const D = 400;
const R = D / 2;
const TABLE_HALF = 0.57 * R;
const CROWN_H = (R - TABLE_HALF) * Math.tan(rad(34.5));
const GIRDLE_H = 0.03 * D;
const CULET_HALF = 0.006 * D;
const PAVILION_D = (R - CULET_HALF) * Math.tan(rad(40.8));
const Y_TOP = -GIRDLE_H / 2 - CROWN_H;
const Y_G0 = -GIRDLE_H / 2;
const Y_G1 = GIRDLE_H / 2;
const Y_CULET = Y_G1 + PAVILION_D;
export const DIAGRAM_VIEWBOX = "-340 -178 680 424";

const f = (n: number) => n.toFixed(1);
const pt = (p: Pt) => `${f(p[0])} ${f(p[1])}`;
const poly = (pts: Pt[]) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${pt(p)}`).join(" ");

type Facet = { name: string; a: Pt; b: Pt };
const FACETS: Facet[] = [
  { name: "table", a: [-TABLE_HALF, Y_TOP], b: [TABLE_HALF, Y_TOP] },
  { name: "crownR", a: [TABLE_HALF, Y_TOP], b: [R, Y_G0] },
  { name: "girdleR", a: [R, Y_G0], b: [R, Y_G1] },
  { name: "pavR", a: [R, Y_G1], b: [CULET_HALF, Y_CULET] },
  { name: "culet", a: [CULET_HALF, Y_CULET], b: [-CULET_HALF, Y_CULET] },
  { name: "pavL", a: [-CULET_HALF, Y_CULET], b: [-R, Y_G1] },
  { name: "girdleL", a: [-R, Y_G1], b: [-R, Y_G0] },
  { name: "crownL", a: [-R, Y_G0], b: [-TABLE_HALF, Y_TOP] },
];
const OUTLINE_D = `${poly(FACETS.map((s) => s.a))} Z`;

/* Facet edges of the near half, projected onto the profile. */
function facetPaths(): string[] {
  const cos = (deg: number) => Math.cos(rad(deg));
  const fB = 0.5;
  const fP = 0.78;
  const rB = TABLE_HALF + (R - TABLE_HALF) * fB;
  const yB = Y_TOP + CROWN_H * fB;
  const rP = R - (R - CULET_HALF) * fP;
  const yP = Y_G1 + PAVILION_D * fP;
  const tc = (a: number): Pt => [TABLE_HALF * cos(a), Y_TOP];
  const gt = (a: number): Pt => [R * cos(a), Y_G0];
  const gb = (a: number): Pt => [R * cos(a), Y_G1];
  const bv = (a: number): Pt => [rB * cos(a), yB];
  const pv = (a: number): Pt => [rP * cos(a), yP];
  const culet: Pt = [0, Y_CULET];
  const out: string[] = [];
  for (let j = 0; j < 4; j++) {
    const phi = 22.5 + 45 * j;
    out.push(
      `${poly([tc(phi - 22.5), bv(phi), tc(phi + 22.5)])} ${poly([gt(phi - 22.5), bv(phi), gt(phi + 22.5)])} ${poly([bv(phi), gt(phi)])}`,
    );
  }
  for (let j = 0; j < 4; j++) {
    const phi = 22.5 + 45 * j;
    out.push(`${poly([gb(phi - 22.5), pv(phi), gb(phi + 22.5)])} ${poly([pv(phi), culet])} ${poly([pv(phi), gb(phi)])}`);
  }
  return out;
}

/* Ray trace: refraction at the table, total internal reflection, exit. */
const norm = (v: Pt): Pt => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};
const dot = (a: Pt, b: Pt) => a[0] * b[0] + a[1] * b[1];
function refract(d: Pt, n: Pt, n1: number, n2: number): Pt | null {
  const cosI = -dot(d, n);
  const eta = n1 / n2;
  const k = 1 - eta * eta * (1 - cosI * cosI);
  if (k < 0) return null;
  const s = eta * cosI - Math.sqrt(k);
  return norm([eta * d[0] + s * n[0], eta * d[1] + s * n[1]]);
}
function nearestHit(p: Pt, d: Pt, skip: string) {
  let best: { t: number; name: string; at: Pt; normal: Pt } | null = null;
  for (const { name, a, b } of FACETS) {
    if (name === skip) continue;
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const den = d[0] * ey - d[1] * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den;
    const u = ((a[0] - p[0]) * d[1] - (a[1] - p[1]) * d[0]) / den;
    if (t > 1e-6 && u >= 0 && u <= 1 && (!best || t < best.t)) {
      best = { t, name, at: [p[0] + d[0] * t, p[1] + d[1] * t], normal: norm([-ey, ex]) };
    }
  }
  return best;
}
function traceRay(x0: number, incidenceDeg: number, index = 2.42): Pt[] {
  const inc = rad(incidenceDeg);
  const dIn: Pt = [Math.sin(inc), Math.cos(inc)];
  const entry: Pt = [x0, Y_TOP];
  const pts: Pt[] = [[x0 - dIn[0] * 96, Y_TOP - dIn[1] * 96], entry];
  let d = refract(dIn, [0, -1], 1, index) ?? [0, 1];
  let p = entry;
  let skip = "table";
  for (let i = 0; i < 5; i++) {
    const hit = nearestHit(p, d, skip);
    if (!hit) break;
    let n = hit.normal;
    if (dot(n, d) > 0) n = [-n[0], -n[1]];
    pts.push(hit.at);
    const out = refract(d, n, index, 1);
    if (out) {
      pts.push([hit.at[0] + out[0] * 92, hit.at[1] + out[1] * 92]);
      break;
    }
    const k = 2 * dot(d, n);
    d = norm([d[0] - k * n[0], d[1] - k * n[1]]);
    p = hit.at;
    skip = hit.name;
  }
  return pts;
}

type Label = { key: string; text: string; leader: Pt[]; at: Pt; anchor: "start" | "end" };
function labels(): Label[] {
  const crownMid: Pt = [(TABLE_HALF + R) / 2, (Y_TOP + Y_G0) / 2];
  const pavMid: Pt = [-(R + CULET_HALF) / 2, (Y_G1 + Y_CULET) / 2];
  return [
    { key: "table", text: "Table", leader: [[36, Y_TOP], [36, -110], [72, -110]], at: [80, -106], anchor: "start" },
    { key: "crown", text: "Crown", leader: [crownMid, [250, crownMid[1]]], at: [258, crownMid[1] + 4], anchor: "start" },
    { key: "girdle", text: "Girdle", leader: [[-R, 0], [-250, 0]], at: [-258, 4], anchor: "end" },
    { key: "pavilion", text: "Pavilion", leader: [pavMid, [pavMid[0] - 30, pavMid[1] + 30], [-250, pavMid[1] + 30]], at: [-258, pavMid[1] + 34], anchor: "end" },
    { key: "culet", text: "Culet", leader: [[0, Y_CULET + 2], [0, 214], [36, 214]], at: [44, 218], anchor: "start" },
  ];
}

const RAY_DURATIONS = [0.35, 0.45, 0.45, 0.45, 0.35];
const RAY_PERIOD = 4;

export interface DiamondDiagramProps {
  /** Element whose travel drives the scrubbed outline draw (desktop). */
  triggerRef: RefObject<HTMLElement | null>;
  className?: string;
  ref?: Ref<DiamondDiagramHandle>;
}

export default function DiamondDiagram({ triggerRef, className = "", ref }: DiamondDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const apiRef = useRef<DiamondDiagramHandle | null>(null);
  const isDesktop = useBreakpoint("md");
  const geometry = useMemo(() => {
    const ray = traceRay(-72, 3);
    const segments: string[] = [];
    for (let i = 0; i < ray.length - 1; i++) segments.push(poly([ray[i], ray[i + 1]]));
    return { facets: facetPaths(), ray: segments, labels: labels() };
  }, []);

  useImperativeHandle(ref, () => ({ highlight: (focus) => apiRef.current?.highlight(focus) }), []);

  useGSAP(
    () => {
      registerGsap();
      const svg = svgRef.current;
      if (!svg) return;
      const stone = svg.querySelector<SVGGElement>("[data-stone]");
      const outline = svg.querySelector<SVGPathElement>("[data-outline]");
      const facets = Array.from(svg.querySelectorAll<SVGPathElement>("[data-facet]"));
      const leaders = Array.from(svg.querySelectorAll<SVGPathElement>("[data-leader]"));
      const texts = Array.from(svg.querySelectorAll<SVGGElement>("[data-label]"));
      const segments = Array.from(svg.querySelectorAll<SVGGElement>("[data-ray-seg]")).map((g) => Array.from(g.querySelectorAll("path")));
      const rayPaths = segments.flat();
      const halos = Array.from(svg.querySelectorAll<SVGTextElement>("[data-halo]"));
      const guideGroups = texts.filter((t) => t.dataset.label === "crown" || t.dataset.label === "pavilion");
      if (!stone || !outline) return;

      // Hairlines and 10px labels stay that size whatever the stage renders at.
      const vb = svg.viewBox.baseVal;
      const fit = () => {
        const scale = Math.min(svg.clientWidth / vb.width, svg.clientHeight / vb.height) || 1;
        svg.style.setProperty("--dd-px", (1 / scale).toFixed(4));
      };
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(svg);

      const reduced = prefersReducedMotion();
      let pulse: gsap.core.Tween | null = null;
      let rayTl: gsap.core.Timeline | null = null;

      const setGuide = (on: boolean) => {
        for (const g of guideGroups) g.dataset.glow = on ? "true" : "";
        const guideHalos = guideGroups.flatMap((g) => Array.from(g.querySelectorAll<SVGTextElement>("[data-halo]")));
        gsap.to(guideHalos, { autoAlpha: on ? 0.7 : 0, duration: 0.5, ease: "surreal", overwrite: "auto" });
      };

      apiRef.current = {
        highlight: (focus) => {
          svg.dataset.focus = focus ?? "";
          pulse?.kill();
          pulse = null;
          gsap.to(stone, { scale: 1, duration: 0.6, ease: "surreal", overwrite: "auto" });
          setGuide(focus === "guide");
          rayTl?.timeScale(focus === "faq" && !reduced ? 2.6 : 1);
          if (focus === "history" && !reduced) {
            pulse = gsap.to(stone, {
              scale: 1.025,
              transformOrigin: "50% 50%",
              duration: 0.9,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              overwrite: "auto",
            });
          }
        },
      };

      if (reduced) {
        gsap.set(halos, { autoAlpha: 0 });
        return () => ro.disconnect();
      }

      /* ----- initial state ----- */
      gsap.set([outline, ...facets, ...leaders], { drawSVG: "0%" });
      gsap.set(texts, { autoAlpha: 0, y: 6 });
      gsap.set(halos, { autoAlpha: 0 });
      gsap.set(rayPaths, { drawSVG: "0% 0%", autoAlpha: 0 });

      /* ----- outline and facets, scrubbed 10 to 50 percent ----- */
      const draw = gsap.timeline({ paused: true });
      draw.to(outline, { drawSVG: "100%", duration: 0.28, ease: "none" }, 0.1);
      draw.to(facets, { drawSVG: "100%", duration: 0.1, ease: "none", stagger: 0.008 }, 0.34);
      draw.to({}, { duration: 0 }, 1);

      const labelsTl = gsap
        .timeline({ paused: true })
        .to(leaders, { drawSVG: "100%", duration: 0.8, ease: "surreal", stagger: 0.08 })
        .to(texts, { autoAlpha: 1, y: 0, duration: 0.7, ease: "surreal", stagger: 0.08 }, 0.25);

      /* ----- the ray loop ----- */
      const loop = gsap.timeline({ paused: true, repeat: -1 });
      loop.set(rayPaths, { drawSVG: "0% 0%", autoAlpha: 1 });
      segments.forEach((paths, i) => {
        loop.to(paths, { drawSVG: "0% 100%", duration: RAY_DURATIONS[i] ?? 0.4, ease: "none" });
      });
      loop.addLabel("retract", "-=0.1");
      segments.forEach((paths, i) => {
        loop.to(paths, { drawSVG: "100% 100%", duration: 0.32, ease: "power1.in" }, `retract+=${(i * 0.08).toFixed(2)}`);
      });
      loop.set(rayPaths, { autoAlpha: 0 });
      loop.repeatDelay(Math.max(0.6, RAY_PERIOD - loop.duration()));
      rayTl = loop;

      let drawn = false;
      let onScreen = false;
      let raying = false;
      let labelsPlayed = false;
      const syncRay = () => {
        const want = drawn && onScreen;
        if (want === raying) return;
        raying = want;
        if (want) rayTl?.play(0);
        else {
          rayTl?.pause(0);
          gsap.set(rayPaths, { autoAlpha: 0 });
        }
      };

      // Desktop: the section's travel drives the draw while the stage holds
      // sticky. Mobile: the diagram sits in flow at 70vw, so its own travel
      // drives the draw and finishes while it is still in view.
      const host = triggerRef.current;
      const useHost = isDesktop && !!host;
      ScrollTrigger.create({
        animation: draw,
        trigger: useHost ? host : svg,
        start: useHost ? "top bottom" : "top 88%",
        end: useHost ? "bottom top" : "bottom 28%",
        scrub: 0.8,
        onUpdate: (self) => {
          drawn = self.progress >= 0.42;
          if (self.progress >= 0.5 && !labelsPlayed) {
            labelsPlayed = true;
            labelsTl.play();
          }
          syncRay();
        },
      });
      ScrollTrigger.create({
        trigger: svg,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          onScreen = self.isActive;
          syncRay();
        },
      });

      return () => {
        ro.disconnect();
        pulse?.kill();
        apiRef.current = null;
      };
    },
    { scope: svgRef, dependencies: [isDesktop], revertOnUpdate: true },
  );

  return (
    <svg
      ref={svgRef}
      className={`${styles.svg} ${className}`}
      viewBox={DIAGRAM_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Cross-section of a round brilliant diamond showing the table, crown, girdle, pavilion and culet, with a ray of light entering the table, reflecting inside the stone and leaving through the crown"
    >
      <g data-stone fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g className={styles.facets}>
          {geometry.facets.map((d, i) => (
            <path key={i} d={d} data-facet={i} />
          ))}
        </g>
        <path d={OUTLINE_D} data-outline className={styles.outline} />
      </g>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {geometry.ray.map((d, i) => (
          <g key={i} data-ray-seg={i}>
            <path d={d} className={styles.rayGlow} />
            <path d={d} className={styles.rayCore} />
          </g>
        ))}
      </g>
      <g fill="none" aria-hidden>
        {geometry.labels.map((l) => (
          <path key={l.key} d={poly(l.leader)} data-leader={l.key} className={styles.leader} />
        ))}
      </g>
      <g className={styles.labels}>
        {geometry.labels.map((l) => (
          <g key={l.key} data-label={l.key}>
            <text x={l.at[0]} y={l.at[1]} textAnchor={l.anchor} className={styles.labelHalo} data-halo aria-hidden>
              {l.text}
            </text>
            <text x={l.at[0]} y={l.at[1]} textAnchor={l.anchor} className={styles.labelText}>
              {l.text}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
