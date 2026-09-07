"use client";

import dynamic from "next/dynamic";
import type { DiamondSceneProps } from "./DiamondScene";

export type { DiamondSceneProps } from "./DiamondScene";
export { detectDiamondQuality, type DiamondQuality } from "./diamondQuality";

/**
 * Client-only entry point for the hero stone. three.js, drei and the BVH shader stay out of the
 * initial bundle and nothing is rendered on the server.
 */
export const DiamondSceneLazy = dynamic<DiamondSceneProps>(() => import("./DiamondScene"), {
  ssr: false,
  loading: () => <div aria-hidden />,
});

export default DiamondSceneLazy;
