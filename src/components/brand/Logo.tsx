"use client";

/**
 * The full Surreal lockup: line mark on the left, SURREAL and its byline
 * nested into the mark's inner corner on the right, in the proportions of
 * the client's artwork (Banners/Social Media 5.jpg).
 *
 *   <Logo height={120} />                          light ground, artwork colours
 *   <Logo variant="dark" height={96} animate="draw" onComplete={...} />
 *   <Logo layout="row" height={28} withByline={false} />   nav lockup
 *
 * variant="dark" is for dark grounds: ink strokes and text turn ivory, the
 * sky strokes stay sky.
 */

import type { CSSProperties } from "react";
import LineMark from "./LineMark";
import Wordmark from "./Wordmark";
import { LINE_MARK_ASPECT, LINE_MARK_INK, LINE_MARK_SKY } from "./lineMarkPaths";

export type LogoVariant = "dark" | "light";

export interface LogoProps {
  variant?: LogoVariant;
  /** Height of the mark in px. The lockup scales from it. */
  height?: number;
  /** "lockup" nests the wordmark into the mark as in the artwork; "row" sets it beside the mark. */
  layout?: "lockup" | "row";
  withByline?: boolean;
  withTm?: boolean;
  animate?: "draw" | "none";
  onComplete?: () => void;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export const LOGO_IVORY = "#F4F1EA";

/*
 * Lockup geometry measured from the artwork, as fractions of the mark height:
 * the wordmark's left edge sits 0.482 in from the mark's left edge, its cap
 * top at 0.683 and its baseline at 0.808 (cap height 0.125), and the whole
 * lockup runs 1.142 wide to the trademark's right edge.
 */
const LOCKUP = {
  width: 1.142,
  wordLeft: 0.482,
  baseline: 0.808,
  capHeight: 0.125,
};
/* Display face metrics used to turn a cap height into a font size and a
 * baseline into a box top (line-height 1). Measured for Italiana: caps 0.70 em,
 * ascent 0.93 em, descent 0.25 em, so the baseline sits 0.84 em below the top
 * of a 1 em line box. */
const CAP_RATIO = 0.7;
const BASELINE_RATIO = 0.84;

export default function Logo({
  variant = "light",
  height = 96,
  layout = "lockup",
  withByline = true,
  withTm = true,
  animate = "none",
  onComplete,
  className,
  style,
  title = "Surreal by JB Bhanderi",
}: LogoProps) {
  const ink = variant === "dark" ? LOGO_IVORY : LINE_MARK_INK;
  const fontSize = (height * LOCKUP.capHeight) / CAP_RATIO;

  if (layout === "row") {
    const rowSize = height * 0.72;
    return (
      <span
        className={className}
        style={{ display: "inline-flex", alignItems: "center", gap: height * 0.36, color: ink, ...style }}
        role="img"
        aria-label={title}
        data-logo={variant}
      >
        <LineMark
          navy={ink}
          sky={LINE_MARK_SKY}
          animate={animate}
          onComplete={onComplete}
          style={{ height, width: height * LINE_MARK_ASPECT, display: "block" }}
        />
        <Wordmark size={rowSize} withByline={withByline} withTm={withTm} />
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        height,
        width: height * LOCKUP.width,
        color: ink,
        ...style,
      }}
      role="img"
      aria-label={title}
      data-logo={variant}
    >
      <LineMark
        navy={ink}
        sky={LINE_MARK_SKY}
        animate={animate}
        onComplete={onComplete}
        style={{ position: "absolute", left: 0, top: 0, height: "100%", width: height * LINE_MARK_ASPECT }}
      />
      <Wordmark
        size={fontSize}
        withByline={withByline}
        withTm={withTm}
        style={{
          position: "absolute",
          left: height * LOCKUP.wordLeft,
          top: height * LOCKUP.baseline - fontSize * BASELINE_RATIO,
        }}
      />
    </span>
  );
}
