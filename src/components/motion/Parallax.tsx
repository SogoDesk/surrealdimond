"use client";

/**
 * Scroll parallax wrapper.
 *
 *   <div className="aspect-[4/5] overflow-hidden">
 *     <Parallax speed={0.25} scale={1.15} className="h-full">
 *       <img className="h-full w-full object-cover" ... />
 *     </Parallax>
 *   </div>
 *
 * speed is the total travel as a fraction of viewport height (-1..1). Positive
 * lags behind the scroll, negative runs ahead of it. scale enlarges the wrapper
 * so an image inside a clipped frame can move without exposing gaps. The
 * movement is scrubbed from the moment the parent enters the viewport until it
 * leaves, so the wrapper sits at rest when centred. Reduced motion: static.
 */

import { useRef, type CSSProperties, type ReactNode } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";

export interface ParallaxProps {
  speed?: number;
  scale?: number;
  axis?: "x" | "y";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export default function Parallax({
  speed = 0.2,
  scale = 1,
  axis = "y",
  className = "",
  style,
  children,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (!el) return;
      if (scale !== 1) gsap.set(el, { scale, transformOrigin: "50% 50%" });
      if (prefersReducedMotion() || speed === 0) return;
      // Half the travel in each direction, measured fresh on every refresh.
      const travel = () => window.innerHeight * speed * 0.5;
      gsap.fromTo(
        el,
        { [axis]: () => -travel() },
        {
          [axis]: () => travel(),
          ease: "none",
          scrollTrigger: {
            // The parent is the trigger so the moving element never skews its own measurements.
            trigger: el.parentElement ?? el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    },
    { scope: ref, dependencies: [speed, scale, axis], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={className} style={{ willChange: "transform", ...style }}>
      {children}
    </div>
  );
}
