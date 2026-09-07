/**
 * Hand trace of the custom chapter illustration (the fashion drawing in
 * public/media/banners/social-8.webp): fifteen hairline paths in a 1000 by
 * 1000 viewBox that follow the drawing's main lines. The array is in drawing
 * order, face and hair first, then the shoulders, then the necklace and
 * earring last, so DrawSVG can run straight down the list.
 *
 * The frame that shows the drawing is portrait (3:4 on desktop, 4:5 on
 * mobile) while the artwork is square, so STAGE_CROP records how the square
 * artwork sits inside the frame and WORDMARK_PATCH the region of the artwork
 * (the printed wordmark beside the neck) that the frame covers with a patch of
 * blank paper sampled from the same drawing.
 */

export const TRACE_SIZE = 1000;

export type TraceGroup = "face" | "hair" | "shoulders" | "jewelry";

export interface TracePath {
  id: string;
  group: TraceGroup;
  d: string;
}

export const CUSTOM_TRACE: readonly TracePath[] = [
  {
    id: "face",
    group: "face",
    d: "M 722 128 C 746 165 760 210 762 258 C 763 292 750 300 754 322 C 758 348 768 372 794 404 C 804 418 794 432 770 436 C 748 440 742 450 754 464 C 768 478 766 496 748 510 C 738 518 740 530 752 538 C 760 554 742 576 708 588 C 668 602 610 606 566 602",
  },
  { id: "eye", group: "face", d: "M 604 286 C 640 260 700 258 742 266 M 632 322 C 660 306 690 306 712 326" },
  {
    id: "hair-top",
    group: "hair",
    d: "M 724 126 C 700 86 620 36 520 20 C 420 8 320 45 255 105 C 215 145 185 195 168 245",
  },
  {
    id: "hairline",
    group: "hair",
    d: "M 700 138 C 672 194 636 252 600 300 C 572 334 522 350 470 332 C 450 324 428 318 412 312",
  },
  { id: "strand", group: "hair", d: "M 640 150 C 560 140 470 180 390 240 C 340 276 300 300 262 320" },
  {
    id: "bun-outer",
    group: "hair",
    d: "M 170 248 C 110 270 55 330 46 420 C 44 500 90 575 160 598 C 225 618 300 590 320 540",
  },
  {
    id: "bun-inner",
    group: "hair",
    d: "M 168 252 C 200 300 215 370 232 440 C 248 500 285 545 320 560 M 296 302 C 200 302 112 360 102 450 C 94 518 140 578 208 588",
  },
  { id: "ear", group: "face", d: "M 444 322 C 424 302 384 304 368 336 C 354 368 360 406 380 428 C 398 444 426 440 444 424" },
  { id: "neck-back", group: "shoulders", d: "M 302 592 C 294 662 258 742 196 792 C 146 832 76 872 16 912" },
  { id: "neck-line", group: "shoulders", d: "M 402 538 C 420 620 450 720 486 810 C 504 860 514 900 496 942" },
  {
    id: "shoulder",
    group: "shoulders",
    d: "M 566 602 C 540 640 524 700 530 750 C 542 780 600 786 700 790 C 800 796 866 836 896 900 C 906 940 890 980 870 1000",
  },
  {
    id: "collar",
    group: "shoulders",
    d: "M 88 889 C 140 881 200 875 248 873 M 328 873 C 400 876 480 874 560 866 M 598 878 C 630 858 660 830 684 802",
  },
  { id: "dress", group: "shoulders", d: "M 240 944 C 268 964 298 984 320 1000 M 590 936 C 632 960 680 984 720 1000" },
  {
    id: "earring",
    group: "jewelry",
    d: "M 402 578 C 400 540 402 490 404 452 C 406 430 428 418 442 428 C 456 440 456 444 456 470 C 456 490 456 512 456 532",
  },
  { id: "necklace", group: "jewelry", d: "M 218 764 C 240 820 320 866 420 874 C 510 880 570 830 578 764" },
];

/**
 * How the square artwork sits in the portrait frame, in artwork units.
 * `left` is the first artwork column visible at the frame's left edge and
 * `width` the number of artwork units across the frame, so the frame shows
 * columns left to left + width and the full artwork height.
 */
export const STAGE_CROP = {
  desktop: { left: 70, width: 750 },
  mobile: { left: 30, width: 800 },
} as const;

/**
 * The printed wordmark sits beside the neck at roughly x 650 to 980 and y 640
 * to 760. The blank paper to the right of the profile is only about 200 units
 * wide, so the frame covers the wordmark with two overlapping tiles of it,
 * each feathered so the paper texture blends.
 */
export interface PatchTile {
  x: number;
  y: number;
  width: number;
  height: number;
  sourceX: number;
  sourceY: number;
}

export const WORDMARK_PATCHES: readonly PatchTile[] = [
  { x: 600, y: 604, width: 200, height: 178, sourceX: 800, sourceY: 130 },
  { x: 760, y: 604, width: 200, height: 178, sourceX: 800, sourceY: 130 },
];

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;

/**
 * Inline custom property that places the square artwork in the frame. The
 * suffix names the breakpoint (--stage-left-desktop, --stage-left-mobile);
 * Custom.module.css maps the right one onto --stage-left per breakpoint.
 */
export function stageVars(crop: { left: number; width: number }, suffix: "desktop" | "mobile"): Record<string, string> {
  return { [`--stage-left-${suffix}`]: pct(-crop.left, crop.width) };
}

/** Percent geometry for one patch tile: the tile within the stage, the artwork within the tile. */
export function patchGeometry(tile: PatchTile) {
  return {
    outer: {
      left: pct(tile.x, TRACE_SIZE),
      top: pct(tile.y, TRACE_SIZE),
      width: pct(tile.width, TRACE_SIZE),
      height: pct(tile.height, TRACE_SIZE),
    },
    inner: {
      left: pct(-tile.sourceX, tile.width),
      top: pct(-tile.sourceY, tile.height),
      width: pct(TRACE_SIZE, tile.width),
      height: pct(TRACE_SIZE, tile.height),
    },
  };
}
