"use client";

/**
 * Magnetic hover for buttons and links.
 *
 *   <Magnetic strength={0.35}><a className="btn">Book an appointment</a></Magnetic>
 *
 * The wrapper follows the pointer by `strength` times the pointer offset from
 * its resting centre and springs back with an elastic ease on leave. Inactive
 * on touch devices and under reduced motion.
 */

import { useRef, type ReactNode } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { isTouchDevice, prefersReducedMotion } from "@/hooks/useMedia";

export interface MagneticProps {
  strength?: number;
  className?: string;
  children: ReactNode;
}

type QuickTo = ReturnType<typeof gsap.quickTo>;

export default function Magnetic({ strength = 0.3, className = "", children }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (!el || isTouchDevice() || prefersReducedMotion()) return;
      let xTo: QuickTo | null = null;
      let yTo: QuickTo | null = null;

      const enter = () => {
        gsap.killTweensOf(el, "x,y");
        xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
        yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
      };
      const move = (event: PointerEvent) => {
        if (!xTo || !yTo) return;
        const rect = el.getBoundingClientRect();
        // Measure from the untransformed centre so the pull stays stable while the element moves.
        const cx = rect.left + rect.width / 2 - Number(gsap.getProperty(el, "x"));
        const cy = rect.top + rect.height / 2 - Number(gsap.getProperty(el, "y"));
        xTo((event.clientX - cx) * strength);
        yTo((event.clientY - cy) * strength);
      };
      const leave = () => {
        xTo?.tween.kill();
        yTo?.tween.kill();
        xTo = yTo = null;
        gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.35)" });
      };

      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: ref, dependencies: [strength], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={`inline-block ${className}`}>
      {children}
    </div>
  );
}
