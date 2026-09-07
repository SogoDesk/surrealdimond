export type DiamondQuality = "high" | "low";

/**
 * Picks a render tier for the hero stone. Kept free of three.js imports so it can be used
 * before the WebGL bundle loads. Call it on the client only.
 */
export function detectDiamondQuality(): DiamondQuality {
  if (typeof window === "undefined") return "high";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const fewCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;
  return coarse || small || fewCores || lowMemory ? "low" : "high";
}
