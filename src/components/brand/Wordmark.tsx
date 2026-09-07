/**
 * SURREAL wordmark in the display face, with an optional "by JB BHANDERI"
 * line beneath it in the UI face (right aligned, as in the artwork).
 *
 *   <Wordmark size={20} />
 *   <Wordmark size={96} withByline withTm />
 *
 * `size` is the font size of SURREAL in px. The byline scales with it.
 */

import type { CSSProperties } from "react";

export interface WordmarkProps {
  size?: number;
  withByline?: boolean;
  withTm?: boolean;
  className?: string;
  style?: CSSProperties;
  as?: "span" | "div" | "p";
}

export const WORDMARK_TEXT = "SURREAL";
export const WORDMARK_BYLINE = "by JB BHANDERI";

/**
 * Byline font size relative to the wordmark size (the artwork's byline caps
 * are about a third of the SURREAL caps).
 */
export const WORDMARK_BYLINE_RATIO = 0.32;

/*
 * Placement below assumes the faces' metrics with line-height 1: Italiana
 * caps 0.70 em, baseline 0.84 em below the line box top; Jost caps 0.70 em,
 * baseline 0.84 em. The trademark sits on the cap line right after the L and
 * the byline hangs 0.14 em (of the wordmark size) under the baseline, right
 * aligned to the trademark, as in the artwork.
 */

export default function Wordmark({ size = 40, withByline = false, withTm = false, className, style, as = "span" }: WordmarkProps) {
  const Tag = as;
  return (
    <Tag
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-end",
        fontSize: size,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...style,
      }}
      data-wordmark
    >
      <span
        style={{
          position: "relative",
          fontFamily: 'var(--font-display), "Italiana", serif',
          fontWeight: 400,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          // cancel the trailing letter-space so the box ends at the L (or the TM)
          marginRight: "-0.18em",
          paddingRight: withTm ? "0.19em" : 0,
        }}
        data-wordmark-text
      >
        {WORDMARK_TEXT}
        {withTm ? (
          <span
            aria-hidden
            style={{
              position: "absolute",
              right: 0,
              top: "0.12em",
              fontFamily: 'var(--font-ui), "Jost", sans-serif',
              fontWeight: 400,
              fontSize: "0.125em",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            TM
          </span>
        ) : null}
      </span>
      {withByline ? (
        <span
          style={{
            fontFamily: 'var(--font-ui), "Jost", sans-serif',
            fontWeight: 400,
            fontSize: `${WORDMARK_BYLINE_RATIO}em`,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            marginTop: "-0.16em",
            marginRight: "-0.28em",
          }}
          data-wordmark-byline
        >
          {WORDMARK_BYLINE}
        </span>
      ) : null}
    </Tag>
  );
}
