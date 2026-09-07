"use client";

/**
 * The Surreal line mark as a live SVG.
 *
 *   <LineMark className="h-7" />                       static, brand colours
 *   <LineMark animate="draw" onComplete={...} />       draws in over 1.6 s
 *   <LineMark monochrome className="text-porcelain" /> every stroke in currentColor
 *   <LineMark navy="var(--mark-a)" sky="var(--mark-b)" />  follows the chapter theme
 *
 * The geometry comes from lineMarkPaths.ts: 23 curves, each rendered as an
 * ink stroke and a sky stroke offset slightly to the right, exactly as the
 * artwork is built. strokeCount changes how many curves span the family.
 * `alternating` draws each curve once, alternating ink and sky, which reads
 * better below about 40 px.
 *
 * animate="draw" hides the mark until GSAP has set every stroke to 0%, then
 * sweeps each one from the base to its tip with a stagger from the outermost
 * stroke inward (the sky stroke of a pair leads its ink partner slightly).
 * Reduced motion shows the finished mark at once.
 */

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import {
  getLineMarkPaths,
  LINE_MARK_CURVES,
  LINE_MARK_INK,
  LINE_MARK_SKY,
  LINE_MARK_SKY_OFFSET,
  LINE_MARK_VIEWBOX_STRING,
} from "./lineMarkPaths";

export interface LineMarkProps {
  /** Colour of the ink strokes. */
  navy?: string;
  /** Colour of the sky strokes. */
  sky?: string;
  /** Multiplies every stroke width (1 = as drawn in the artwork). */
  strokeScale?: number;
  className?: string;
  style?: CSSProperties;
  /** Number of curves spread across the family. */
  strokeCount?: number;
  /** Render every stroke in currentColor. */
  monochrome?: boolean;
  /** Draw each curve once, alternating ink and sky, instead of the paired layers. */
  alternating?: boolean;
  animate?: "draw" | "none";
  /** Total length of the draw in seconds. */
  duration?: number;
  /** Seconds to wait before the draw starts. */
  delay?: number;
  onComplete?: () => void;
  /** Accessible name. Without one the mark is decorative (aria-hidden). */
  title?: string;
  id?: string;
}

export default function LineMark({
  navy = LINE_MARK_INK,
  sky = LINE_MARK_SKY,
  strokeScale = 1,
  className,
  style,
  strokeCount = LINE_MARK_CURVES,
  monochrome = false,
  alternating = false,
  animate = "none",
  duration = 1.6,
  delay = 0,
  onComplete,
  title,
  id,
}: LineMarkProps) {
  const ref = useRef<SVGSVGElement>(null);
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const paths = useMemo(() => getLineMarkPaths(strokeCount), [strokeCount]);
  const inkColor = monochrome ? "currentColor" : navy;
  const skyColor = monochrome ? "currentColor" : sky;
  const drawing = animate === "draw";

  useGSAP(
    () => {
      registerGsap();
      const svg = ref.current;
      if (!svg || !drawing) return;
      const ink = Array.from(svg.querySelectorAll<SVGPathElement>('[data-layer="ink"] path'));
      const skyPaths = Array.from(svg.querySelectorAll<SVGPathElement>('[data-layer="sky"] path'));
      // outermost first; within a pair the sky stroke leads its ink partner
      const targets: SVGPathElement[] = [];
      const n = Math.max(ink.length, skyPaths.length);
      for (let i = 0; i < n; i++) {
        if (skyPaths[i]) targets.push(skyPaths[i]);
        if (ink[i]) targets.push(ink[i]);
      }
      if (targets.length === 0) return;
      if (prefersReducedMotion()) {
        gsap.set(svg, { visibility: "visible" });
        completeRef.current?.();
        return;
      }
      const sweep = Math.min(0.6, duration * 0.4);
      gsap.set(targets, { drawSVG: "0%" });
      gsap.set(svg, { visibility: "visible" });
      gsap.to(targets, {
        drawSVG: "100%",
        duration: Math.max(0.2, duration - sweep),
        ease: "surreal",
        stagger: { amount: sweep },
        delay,
        onComplete: () => completeRef.current?.(),
      });
    },
    { scope: ref, dependencies: [drawing, strokeCount, duration, delay, alternating], revertOnUpdate: true },
  );

  const renderLayer = (layer: "ink" | "sky", color: string, transform?: string) => (
    <g data-layer={layer} transform={transform} stroke={color}>
      {paths.map((p, i) => {
        if (alternating && (layer === "sky") !== (i % 2 === 1)) return null;
        return (
          <path
            key={p.index}
            d={p.d}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={p.width * strokeScale}
            data-stroke={p.index}
          />
        );
      })}
    </g>
  );

  return (
    <svg
      ref={ref}
      id={id}
      viewBox={LINE_MARK_VIEWBOX_STRING}
      className={className}
      style={drawing ? { visibility: "hidden", ...style } : style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      data-line-mark
    >
      {title ? <title>{title}</title> : null}
      {renderLayer("sky", skyColor, alternating ? undefined : `translate(${LINE_MARK_SKY_OFFSET.x} ${LINE_MARK_SKY_OFFSET.y})`)}
      {renderLayer("ink", inkColor)}
    </svg>
  );
}
