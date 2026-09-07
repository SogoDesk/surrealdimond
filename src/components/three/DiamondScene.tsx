"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { Canvas, type RootState } from "@react-three/fiber";
import Diamond from "./Diamond";
import type { DiamondQuality } from "./diamondQuality";

export type { DiamondQuality } from "./diamondQuality";

export interface DiamondSceneProps {
  className?: string;
  style?: CSSProperties;
  /** Scroll progress from 0 to 1, driven by the page. */
  progress?: number;
  /**
   * Optional mutable progress source for hot paths (for example a ScrollTrigger onUpdate
   * writing into a ref). When provided it takes precedence over the progress prop and avoids
   * re-rendering React on every scroll frame.
   */
  progressRef?: RefObject<number>;
  /** "low" drops to 2 bounces, dpr 1 and no sparkles for mobile and weak GPUs. */
  quality?: DiamondQuality;
  /** Uniform scale of the stone. At 1 the girdle radius is one world unit. */
  scale?: number;
}

function supportsWebGL2(): boolean {
  try {
    if (typeof window === "undefined" || !("WebGL2RenderingContext" in window)) return false;
    const canvas = document.createElement("canvas");
    return canvas.getContext("webgl2") !== null;
  } catch {
    return false;
  }
}

/**
 * Hero canvas for the diamond. Renders nothing at all when WebGL2 is unavailable so the page
 * can show a static image underneath, pauses the frame loop while scrolled out of view or when
 * the tab is hidden, and respects prefers-reduced-motion by freezing the stone.
 */
export default function DiamondScene({
  className,
  style,
  progress = 0,
  progressRef,
  quality = "high",
  scale = 1,
}: DiamondSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [supported] = useState<boolean | null>(() => (typeof window === "undefined" ? null : supportsWebGL2()));
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const internalProgress = useRef(progress);
  const invalidateRef = useRef<((frames?: number) => void) | null>(null);

  useLayoutEffect(() => {
    internalProgress.current = progress;
    invalidateRef.current?.();
  }, [progress]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReduced(mq.matches);
    mq.addEventListener("change", onMotion);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      mq.removeEventListener("change", onMotion);
    };
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || !supported) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "15% 0px 15% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [supported]);

  const activeProgress = progressRef ?? internalProgress;

  // Memoised so scroll driven re-renders of this component do not re-render the R3F tree.
  const content = useMemo(
    () => (
      <Suspense fallback={null}>
        <Diamond progressRef={activeProgress} quality={quality} scale={scale} reducedMotion={reduced} />
      </Suspense>
    ),
    [activeProgress, quality, scale, reduced],
  );

  if (supported === false) return null;

  const frameloop = !visible || hidden ? "never" : reduced ? "demand" : "always";

  return (
    <div ref={hostRef} className={className} style={{ pointerEvents: "none", ...style }} aria-hidden>
      {supported && (
        <Canvas
          resize={{ offsetSize: true, scroll: false, debounce: { scroll: 50, resize: 0 } }}
          dpr={quality === "low" ? 1 : [1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: 32, position: [0, 0.6, 5.2], near: 0.1, far: 60 }}
          frameloop={frameloop}
          flat={false}
          onCreated={(state: RootState) => {
            invalidateRef.current = state.invalidate;
          }}
          style={{ background: "transparent" }}
        >
          {content}
        </Canvas>
      )}
    </div>
  );
}
