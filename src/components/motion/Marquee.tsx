"use client";

/**
 * Seamless infinite marquee.
 *
 *   <Marquee speed={60} gap={64} pauseOnHover scrollVelocity fade>
 *     <span>Lab grown</span><span>DEF colour</span><span>VVS clarity</span>
 *   </Marquee>
 *
 * The content is duplicated until it covers twice the container width, then
 * the track loops with an xPercent tween. speed is px per second, direction is
 * "left" or "right", gap is the px between items and between repeats.
 * scrollVelocity scales playback by the smoothed scroll velocity so the band
 * hurries when the page does. Reduced motion: static.
 */

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { registerGsap, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";

export interface MarqueeProps {
  speed?: number;
  direction?: "left" | "right";
  gap?: number;
  pauseOnHover?: boolean;
  scrollVelocity?: boolean;
  /** Soften both ends with a gradient mask. */
  fade?: boolean;
  className?: string;
  children: ReactNode;
}

const FADE_MASK = "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)";

export default function Marquee({
  speed = 80,
  direction = "left",
  gap = 48,
  pauseOnHover = false,
  scrollVelocity = false,
  fade = false,
  className = "",
  children,
}: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);

  // Measure one copy and repeat it until the track spans twice the container.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const first = trackRef.current?.firstElementChild;
    if (!root || !(first instanceof HTMLElement)) return;
    const measure = () => {
      const unit = first.offsetWidth;
      if (unit > 0) setCopies(Math.max(2, Math.ceil((root.clientWidth * 2) / unit)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(first);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      const track = trackRef.current;
      const first = track?.firstElementChild;
      if (!root || !track || !(first instanceof HTMLElement) || prefersReducedMotion()) return;
      const unit = first.offsetWidth;
      if (!unit) return;
      const shift = 100 / copies; // one copy as a share of the track width
      const loop = gsap.fromTo(
        track,
        { xPercent: direction === "left" ? 0 : -shift },
        { xPercent: direction === "left" ? -shift : 0, duration: unit / speed, ease: "none", repeat: -1 },
      );
      if (!pauseOnHover && !scrollVelocity) return;

      let hovered = false;
      let velocity = 0;
      let current = 1;
      const tracker = scrollVelocity
        ? ScrollTrigger.create({ onUpdate: (self) => void (velocity = self.getVelocity()) })
        : null;
      const tick = () => {
        const boost = scrollVelocity ? Math.min(Math.abs(velocity) / 800, 4) : 0;
        const target = hovered ? 0 : 1 + boost;
        current += (target - current) * 0.08;
        velocity *= 0.9; // settle when scroll updates stop arriving
        loop.timeScale(current);
      };
      const enter = () => void (hovered = true);
      const leave = () => void (hovered = false);
      gsap.ticker.add(tick);
      if (pauseOnHover) {
        root.addEventListener("pointerenter", enter);
        root.addEventListener("pointerleave", leave);
      }
      return () => {
        gsap.ticker.remove(tick);
        tracker?.kill();
        root.removeEventListener("pointerenter", enter);
        root.removeEventListener("pointerleave", leave);
      };
    },
    { scope: rootRef, dependencies: [copies, speed, direction, pauseOnHover, scrollVelocity], revertOnUpdate: true },
  );

  const maskStyle: CSSProperties | undefined = fade
    ? { maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }
    : undefined;

  return (
    <div ref={rootRef} className={`overflow-hidden whitespace-nowrap ${className}`} style={maskStyle}>
      <div ref={trackRef} className="flex w-max will-change-transform">
        {Array.from({ length: copies }, (_, i) => (
          <div
            key={i}
            aria-hidden={i > 0 || undefined}
            className="flex shrink-0 items-center"
            style={{ gap, paddingRight: gap }}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
