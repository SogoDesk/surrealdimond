"use client";

/**
 * Pinned horizontal scroll section.
 *
 *   <HorizontalScroll label="Collections" snap>
 *     <article className="w-screen shrink-0 snap-start md:w-[60vw]">...</article>
 *     ...
 *   </HorizontalScroll>
 *
 * From 768px up the section pins and vertical scroll drives the track sideways
 * (speed 1 means one vertical pixel per horizontal pixel). Below that, or with
 * reduced motion, it is a native horizontal scroller with scroll-snap and no
 * pin. Give every panel an explicit width, shrink-0 and snap-start. The root
 * exposes --surreal-progress (0..1) for child styling, and a 1px progress line
 * runs along the bottom edge next to the optional label.
 */

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { registerGsap, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useBreakpoint, useReducedMotion } from "@/hooks/useMedia";

export interface HorizontalScrollProps {
  className?: string;
  trackClassName?: string;
  children: ReactNode;
  speed?: number;
  snap?: boolean;
  label?: string;
  onProgress?: (progress: number) => void;
}

export default function HorizontalScroll({
  className = "",
  trackClassName = "",
  children,
  speed = 1,
  snap = false,
  label,
  onProgress,
}: HorizontalScrollProps) {
  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(onProgress);
  useEffect(() => {
    progressRef.current = onProgress;
  }, [onProgress]);
  const desktop = useBreakpoint("md");
  const reduced = useReducedMotion();
  const pinned = desktop && !reduced;

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!root || !viewport || !track) return;

      const setProgress = (p: number) => {
        root.style.setProperty("--surreal-progress", p.toFixed(4));
        if (lineRef.current) lineRef.current.style.transform = `scaleX(${p})`;
        progressRef.current?.(p);
      };

      if (!pinned) {
        const onScroll = () =>
          setProgress(viewport.scrollLeft / Math.max(1, viewport.scrollWidth - viewport.clientWidth));
        viewport.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => viewport.removeEventListener("scroll", onScroll);
      }

      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      let stops: number[] = [0, 1];
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          pin: true,
          anticipatePin: 1,
          scrub: 0.8,
          start: "top top",
          end: () => `+=${distance() / speed}`,
          invalidateOnRefresh: true,
          onRefresh: () => {
            const d = distance();
            stops = d > 0 ? Array.from(track.children, (panel) => Math.min(1, (panel as HTMLElement).offsetLeft / d)) : [0];
            stops.push(1);
          },
          snap: snap
            ? {
                snapTo: (value) => stops.reduce((a, b) => (Math.abs(b - value) < Math.abs(a - value) ? b : a), 0),
                duration: { min: 0.2, max: 0.8 },
                delay: 0.05,
                ease: "power2.inOut",
              }
            : undefined,
          onUpdate: (self) => setProgress(self.progress),
        },
      });

      // Refresh measurements when the track resizes or its images finish loading.
      let timer = 0;
      const refresh = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
      };
      const observer = new ResizeObserver(refresh);
      observer.observe(track);
      const pending = Array.from(track.querySelectorAll("img")).filter((img) => !img.complete);
      pending.forEach((img) => img.addEventListener("load", refresh, { once: true }));
      return () => {
        window.clearTimeout(timer);
        observer.disconnect();
        pending.forEach((img) => img.removeEventListener("load", refresh));
      };
    },
    { scope: rootRef, dependencies: [pinned, speed, snap], revertOnUpdate: true },
  );

  return (
    <section
      ref={rootRef}
      className={`relative ${className}`}
      style={{ "--surreal-progress": 0 } as CSSProperties}
    >
      <div
        ref={viewportRef}
        data-lenis-prevent={pinned ? undefined : ""}
        className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:h-screen md:snap-none md:overflow-hidden md:pb-0"
        style={pinned ? undefined : { height: "auto", overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: "4rem" }}
      >
        <div ref={trackRef} className={`flex md:h-full ${trackClassName}`}>
          {children}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-[var(--gutter)] bottom-6 flex items-center gap-5 text-[11px] uppercase tracking-[0.2em]">
        {label ? <span className="shrink-0 opacity-70">{label}</span> : null}
        <div className="relative h-px flex-1">
          <div className="absolute inset-0 bg-current opacity-20" />
          <div ref={lineRef} className="absolute inset-0 origin-left bg-current" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </section>
  );
}
