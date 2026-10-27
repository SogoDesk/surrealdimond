/**
 * How much the chapters move (client feedback, 27 October 2026, F-A3:
 * "minimize unnecessary animations for performance").
 *
 * With CALM_CHAPTERS on, scroll-driven choreography is off across the site:
 * no pinned or scrubbed stages, no parallax, no hand-offs between sections,
 * no ambient loops that follow the pointer. Each chapter takes its calm
 * path, the one first built for prefers-reduced-motion: content in place,
 * with at most a short fade as it arrives. Hover feedback, drawers and the
 * homepage hero carousel keep their motion. Set it to false to bring the
 * scroll choreography back.
 */

import { prefersReducedMotion } from "@/hooks/useMedia";

export const CALM_CHAPTERS = true;

/** True when a chapter should skip its scroll choreography: calm mode, or the visitor asked for reduced motion. */
export const calmChapters = () => CALM_CHAPTERS || prefersReducedMotion();
