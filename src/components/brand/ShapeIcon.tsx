import type { StoneShape } from "@/content/diamonds";

/**
 * Plan-view outlines of the ten diamond shapes, each with its table and a few
 * facet lines, drawn in currentColor on a 40 by 40 grid. "detail" adds the
 * facet lines (for large Quick View drawings); the small filter and row icons
 * keep the outline and table only.
 */

export const OUTLINE: Record<StoneShape, string> = {
  round: "M20 4a16 16 0 1 0 0 32a16 16 0 1 0 0-32Z",
  oval: "M20 3c7 0 11 7.6 11 17s-4 17-11 17S9 29.4 9 20 13 3 20 3Z",
  pear: "M20 3c6 6 11.5 13 11.5 20a11.5 11.5 0 0 1-23 0C8.5 16 14 9 20 3Z",
  emerald: "M14 4h12l5 5v22l-5 5H14l-5-5V9Z",
  princess: "M7 7h26v26H7Z",
  radiant: "M13 4h14l4 4v24l-4 4H13l-4-4V8Z",
  cushion: "M13 5h14c4 0 7 3 7 7v16c0 4-3 7-7 7H13c-4 0-7-3-7-7V12c0-4 3-7 7-7Z",
  marquise: "M20 2c6.5 5 10 11 10 18s-3.5 13-10 18c-6.5-5-10-11-10-18S13.5 7 20 2Z",
  asscher: "M13 6h14l7 7v14l-7 7H13l-7-7V13Z",
  heart: "M20 35C10 27 5 21 5 14.5A7.5 7.5 0 0 1 20 11a7.5 7.5 0 0 1 15 3.5C35 21 30 27 20 35Z",
};

export const TABLE: Record<StoneShape, string> = {
  round: "M20 11a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z",
  oval: "M20 10c4 0 6.2 4.5 6.2 10S24 30 20 30s-6.2-4.5-6.2-10S16 10 20 10Z",
  pear: "M20 11c3.5 3.8 6.5 8 6.5 12a6.5 6.5 0 0 1-13 0c0-4 3-8.2 6.5-12Z",
  emerald: "M16 10h8l3 3v14l-3 3h-8l-3-3V13Z",
  princess: "M13 13h14v14H13Z",
  radiant: "M15.5 10h9l2.5 2.5v15L24.5 30h-9L13 27.5v-15Z",
  cushion: "M15.5 11h9c2.5 0 4.5 2 4.5 4.5v9c0 2.5-2 4.5-4.5 4.5h-9c-2.5 0-4.5-2-4.5-4.5v-9c0-2.5 2-4.5 4.5-4.5Z",
  marquise: "M20 10c3.3 3 5 6.4 5 10s-1.7 7-5 10c-3.3-3-5-6.4-5-10s1.7-7 5-10Z",
  asscher: "M16 12h8l4 4v8l-4 4h-8l-4-4v-8Z",
  heart: "M20 28c-5-4-7.5-7.2-7.5-10.5a3.8 3.8 0 0 1 7.5-1.7 3.8 3.8 0 0 1 7.5 1.7C27.5 20.8 25 24 20 28Z",
};

export const FACETS: Partial<Record<StoneShape, string>> = {
  round: "M20 4v7M20 29v7M4 20h7M29 20h7M8.7 8.7l5 5M26.3 26.3l5 5M31.3 8.7l-5 5M13.7 26.3l-5 5",
  oval: "M20 3v7M20 30v7M9 20h4.8M26.2 20H31M12 8l3.2 4.5M28 8l-3.2 4.5M12 32l3.2-4.5M28 32l-3.2-4.5",
  pear: "M20 3v8M8.5 23h5M26.5 23H31.5M11 31l4.4-3.6M29 31l-4.4-3.6M20 34.5v-5",
  emerald: "M14 4l2 6M26 4l-2 6M31 9l-4 4M9 9l4 4M31 31l-4-4M9 31l4-4M14 36l2-6M26 36l-2-6",
  princess: "M7 7l6 6M33 7l-6 6M7 33l6-6M33 33l-6-6M20 7v6M20 27v6M7 20h6M27 20h6",
  radiant: "M13 4l2.5 6M27 4l-2.5 6M31 8l-4 4.5M9 8l4 4.5M31 32l-4-4.5M9 32l4-4.5M13 36l2.5-6M27 36l-2.5-6",
  cushion: "M8 8l7.5 7.5M32 8l-7.5 7.5M8 32l7.5-7.5M32 32l-7.5-7.5M20 5v6M20 29v6M6 20h5M29 20h5",
  marquise: "M20 2v8M20 30v8M10 20h5M25 20h5M13.5 10l3.5 4M26.5 10l-3.5 4M13.5 30l3.5-4M26.5 30l-3.5-4",
  asscher: "M13 6l3 6M27 6l-3 6M34 13l-6 3M6 13l6 3M34 27l-6-3M6 27l6-3M13 34l3-6M27 34l-3-6",
  heart: "M20 11v4.8M5 14.5h7.5M27.5 17.5H35M20 35v-7M10 26l5.3-3.5M30 26l-5.3-3.5",
};

export default function ShapeIcon({ shape, detail = false, className = "", title }: { shape: StoneShape; detail?: boolean; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={detail ? 0.6 : 1.1}
      strokeLinejoin="round"
      strokeLinecap="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={OUTLINE[shape]} />
      <path d={TABLE[shape]} opacity={detail ? 1 : 0.55} />
      {detail && FACETS[shape] && <path d={FACETS[shape]} opacity={0.8} />}
    </svg>
  );
}
