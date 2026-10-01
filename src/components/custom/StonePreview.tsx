"use client";

/**
 * The live preview on the custom request (BRD R-23, a demo for approval, A5).
 * The piece redraws as the dealer chooses: the item type sets the scene (a
 * ring across a finger, a pendant on its chain, a pair of studs, a bangle, or
 * the stone alone), the metal and gold color paint the setting (two tone
 * pairs a yellow shank with a white head), and the stone takes its shape,
 * its face-up size from the carat weight, and a faint tint from its color
 * grade. Sizes are drawn to one scale, shown by the 5 mm bar, so a 3 ct stone
 * reads larger than a 1 ct one; they are approximate, and the CAD is the true
 * preview. Matching bands add a band under the ring.
 */

import { useId } from "react";
import { FACETS, OUTLINE, TABLE } from "@/components/brand/ShapeIcon";
import s from "./custom.module.css";

export const CUSTOM_SHAPES = ["round", "princess", "oval", "pear", "cushion", "emerald", "asscher"] as const;
export type CustomShape = (typeof CUSTOM_SHAPES)[number];
export type ItemType = "ring" | "pendant" | "earring" | "bracelet" | "other";
export type MetalKind = "14k" | "18k" | "platinum";
export type GoldColor = "yellow" | "white" | "rose" | "two-tone";
export type StoneColor = "D" | "E" | "F";

/** Face-up length against a round of the same weight, the usual length to width ratio, and the outline's height on the 40 unit grid. */
const SPEC: Record<CustomShape, { len: number; ratio: number; box: number }> = {
  round: { len: 1, ratio: 1, box: 32 },
  princess: { len: 0.87, ratio: 1, box: 26 },
  oval: { len: 1.22, ratio: 1.4, box: 34 },
  pear: { len: 1.28, ratio: 1.6, box: 31.5 },
  cushion: { len: 0.95, ratio: 1.1, box: 30 },
  emerald: { len: 1.18, ratio: 1.4, box: 32 },
  asscher: { len: 0.86, ratio: 1, box: 28 },
};

/** Prong positions on the 40 unit grid. */
const PRONGS: Record<CustomShape, [number, number][]> = {
  round: [[8.7, 8.7], [31.3, 8.7], [8.7, 31.3], [31.3, 31.3]],
  princess: [[7, 7], [33, 7], [7, 33], [33, 33]],
  oval: [[12.2, 8], [27.8, 8], [12.2, 32], [27.8, 32]],
  pear: [[20, 3.4], [9.6, 28], [30.4, 28]],
  cushion: [[8.6, 7.6], [31.4, 7.6], [8.6, 32.4], [31.4, 32.4]],
  emerald: [[10.6, 7.6], [29.4, 7.6], [10.6, 32.4], [29.4, 32.4]],
  asscher: [[9.6, 9.6], [30.4, 9.6], [9.6, 30.4], [30.4, 30.4]],
};

const METAL: Record<"yellow" | "white" | "rose" | "platinum", [string, string, string]> = {
  yellow: ["#f8e7b2", "#d9b45e", "#a07a2c"],
  white: ["#fafbfc", "#d0d6dd", "#97a1ab"],
  rose: ["#f8dccf", "#dca187", "#a5654e"],
  platinum: ["#f3f5f7", "#c6ccd3", "#88929b"],
};

const STONE: Record<StoneColor, { hi: string; lo: string; line: string }> = {
  D: { hi: "#ffffff", lo: "#edf6fa", line: "#9db4bf" },
  E: { hi: "#ffffff", lo: "#f0f3f4", line: "#a4b0b6" },
  F: { hi: "#fffefb", lo: "#f4f1e8", line: "#b1afa2" },
};

/** Pixels per millimetre in the drawing. */
const K = 12;
const CX = 210;
const CY = 200;

/** A round diamond of this weight is about this wide, in millimetres. */
const roundMm = (ct: number) => 6.5 * Math.cbrt(Math.max(ct, 0.05));

export function stoneSize(shape: CustomShape, carat: number) {
  const length = roundMm(carat) * SPEC[shape].len;
  return { length, width: length / SPEC[shape].ratio };
}

export interface StonePreviewProps {
  item: ItemType | "";
  metal: MetalKind | "";
  gold: GoldColor | "";
  shape: CustomShape;
  carat: number;
  color: StoneColor;
  matching: boolean;
  fingerSize?: string;
}

export default function StonePreview({ item, metal, gold, shape, carat, color, matching, fingerSize }: StonePreviewProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ct = Math.min(Math.max(carat || 1, 0.1), 10);
  const { length } = stoneSize(shape, ct);
  const scale = (length * K) / SPEC[shape].box;
  const half = (length * K) / 2;
  const shank = metal === "platinum" ? "platinum" : gold === "white" ? "white" : gold === "rose" ? "rose" : "yellow";
  const head = metal === "platinum" ? "platinum" : gold === "two-tone" || gold === "white" ? "white" : shank;
  const tone = STONE[color];
  const scene = item || "other";
  const earGap = scene === "earring" ? (length / SPEC[shape].ratio) * K * 0.5 + 26 : 0;
  const centres: number[] = scene === "earring" ? [CX - earGap, CX + earGap] : [CX];

  const grad = (id: string, [a, b, c]: [string, string, string], vertical = true) => (
    <linearGradient id={`${id}-${uid}`} x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "0"}>
      <stop offset="0%" stopColor={c} />
      <stop offset="30%" stopColor={a} />
      <stop offset="55%" stopColor={b} />
      <stop offset="100%" stopColor={c} />
    </linearGradient>
  );

  const stone = (x: number, key: string) => (
    <g key={key} className={s.pvStone} style={{ transform: `translate(${x}px, ${CY}px) scale(${scale})` }}>
      <g transform="translate(-20 -20)">
        <path d={OUTLINE[shape]} transform="translate(0 1.6)" fill="rgba(11,31,42,0.22)" filter={`url(#soft-${uid})`} />
        <g key={shape} className={s.pvShape}>
          <path d={OUTLINE[shape]} fill={`url(#stone-${uid})`} stroke={tone.line} strokeWidth={0.35} strokeLinejoin="round" />
          <path d={TABLE[shape]} fill={`url(#table-${uid})`} stroke={tone.line} strokeWidth={0.3} strokeLinejoin="round" />
          {FACETS[shape] && <path d={FACETS[shape]} fill="none" stroke={tone.line} strokeWidth={0.25} strokeLinecap="round" opacity={0.75} />}
          <path d={TABLE[shape]} fill={`url(#glint-${uid})`} opacity={0.9} />
        </g>
        {PRONGS[shape].map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r={Math.max(1.05, 1.5 - ct * 0.04)} fill={`url(#head-${uid})`} stroke="rgba(11,31,42,0.25)" strokeWidth={0.15} />
        ))}
      </g>
    </g>
  );

  return (
    <svg viewBox="0 0 420 400" className={s.pvSvg} role="img" aria-label={`Preview: ${ct.toFixed(2)} carat ${shape} stone, ${color} color, as a ${scene === "other" ? "loose stone" : scene}`}>
      <defs>
        {grad("shank", METAL[shank])}
        {grad("shankH", METAL[shank], false)}
        <radialGradient id={`head-${uid}`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" stopColor={METAL[head][0]} />
          <stop offset="60%" stopColor={METAL[head][1]} />
          <stop offset="100%" stopColor={METAL[head][2]} />
        </radialGradient>
        <radialGradient id={`stone-${uid}`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0%" stopColor={tone.hi} />
          <stop offset="70%" stopColor={tone.lo} />
          <stop offset="100%" stopColor={tone.line} stopOpacity={0.3} />
        </radialGradient>
        <linearGradient id={`table-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={tone.lo} />
        </linearGradient>
        <linearGradient id={`glint-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="62%" stopColor="#86dfff" stopOpacity="0.18" />
          <stop offset="78%" stopColor="#b02078" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`ground-${uid}`} cx="0.5" cy="0.48" r="0.6">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#eef7fb" />
          <stop offset="100%" stopColor="#dceff7" />
        </radialGradient>
        <filter id={`soft-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id={`drop-${uid}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <rect width="420" height="400" fill={`url(#ground-${uid})`} />

      {scene === "ring" && (
        <g>
          <rect x={CX - 102} y={-30} width={204} height={460} rx={102} fill="#f6f8fa" stroke="#dce1e6" />
          <text x={CX} y={386} textAnchor="middle" className={s.pvLabel}>
            {fingerSize ? `Finger, size ${fingerSize}` : "Finger"}
          </text>
          <rect x={CX - 104} y={CY - 13} width={208} height={26} rx={6} fill="rgba(11,31,42,0.14)" filter={`url(#drop-${uid})`} />
          <rect x={CX - 104} y={CY - 12} width={208} height={24} rx={5} fill={`url(#shankH-${uid})`} />
          <rect x={CX - 104} y={CY - 12} width={208} height={24} rx={5} fill={`url(#shank-${uid})`} opacity={0.55} />
          {matching && (
            <g className={s.pvFade}>
              <rect x={CX - 104} y={CY + half + 20} width={208} height={18} rx={4} fill={`url(#shankH-${uid})`} />
              {Array.from({ length: 11 }, (_, i) => (
                <circle key={i} cx={CX - 80 + i * 16} cy={CY + half + 29} r={4.2} fill="#ffffff" stroke={tone.line} strokeWidth={0.8} />
              ))}
            </g>
          )}
        </g>
      )}

      {scene === "pendant" && (
        <g>
          <path d={`M40 -10 C 90 120, 170 ${CY - half - 60}, ${CX - 3} ${CY - half - 22}`} fill="none" stroke={`url(#shankH-${uid})`} strokeWidth={3} strokeDasharray="7 3" strokeLinecap="round" />
          <path d={`M380 -10 C 330 120, 250 ${CY - half - 60}, ${CX + 3} ${CY - half - 22}`} fill="none" stroke={`url(#shankH-${uid})`} strokeWidth={3} strokeDasharray="7 3" strokeLinecap="round" />
          <rect x={CX - 7} y={CY - half - 30} width={14} height={26} rx={7} fill="none" stroke={`url(#head-${uid})`} strokeWidth={4} />
        </g>
      )}

      {scene === "bracelet" && (
        <g>
          <rect x={-10} y={CY - 16} width={440} height={32} rx={6} fill="rgba(11,31,42,0.14)" filter={`url(#drop-${uid})`} />
          <rect x={-10} y={CY - 15} width={440} height={30} fill={`url(#shank-${uid})`} />
        </g>
      )}

      {scene === "other" && <ellipse cx={CX} cy={CY + half + 22} rx={half * 0.9} ry={8} fill="rgba(11,31,42,0.12)" filter={`url(#drop-${uid})`} />}

      {centres.map((x, i) => stone(x, `st-${i}`))}

      <g className={s.pvSparkles} aria-hidden>
        {[
          [CX + half * 0.55, CY - half * 0.6, 0],
          [CX - half * 0.5, CY + half * 0.2, 1],
          [CX + half * 0.1, CY + half * 0.62, 2],
        ].map(([x, y, i]) => (
          <path key={i} d={`M${x} ${y - 7}L${x + 1.6} ${y - 1.6}L${x + 7} ${y}L${x + 1.6} ${y + 1.6}L${x} ${y + 7}L${x - 1.6} ${y + 1.6}L${x - 7} ${y}L${x - 1.6} ${y - 1.6}Z`} fill="#ffffff" style={{ animationDelay: `${i * 0.9}s` }} />
        ))}
      </g>

      <g transform={`translate(${400 - 5 * K} 372)`}>
        <text x={5 * K / 2} y={-6} className={s.pvLabel} textAnchor="middle">
          5 mm
        </text>
        <path d={`M0 0v6M0 3h${5 * K}M${5 * K} 0v6`} stroke="#636e78" strokeWidth={1} fill="none" />
      </g>
    </svg>
  );
}
