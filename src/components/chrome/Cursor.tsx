"use client";

/**
 * Pointer light. The native cursor stays; a soft pool of beam-coloured light
 * follows the pointer a beat behind it, adding a little glow to whatever it
 * passes over. It blends with screen, so it lifts the dark chapters and all
 * but disappears on the light ones. Fine pointers only; never mounted for
 * touch or reduced motion.
 */

import { useRef } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { isTouchDevice, prefersReducedMotion } from "@/hooks/useMedia";
import styles from "./chrome.module.css";

export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const glow = ref.current;
      if (!glow) return;
      if (!window.matchMedia("(pointer: fine)").matches || isTouchDevice() || prefersReducedMotion()) return;

      gsap.set(glow, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
      const x = gsap.quickTo(glow, "x", { duration: 0.55, ease: "power3.out" });
      const y = gsap.quickTo(glow, "y", { duration: 0.55, ease: "power3.out" });
      let shown = false;

      const move = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        x(e.clientX);
        y(e.clientY);
        if (!shown) {
          shown = true;
          gsap.to(glow, { autoAlpha: 1, duration: 0.8, ease: "power2.out", overwrite: "auto" });
        }
      };
      const leave = () => {
        shown = false;
        gsap.to(glow, { autoAlpha: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" });
      };
      const press = () => gsap.fromTo(glow, { scale: 1 }, { scale: 0.85, duration: 0.5, ease: "power2.out", yoyo: true, repeat: 1 });

      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("pointerdown", press, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
      return () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerdown", press);
        document.documentElement.removeEventListener("pointerleave", leave);
      };
    },
    { scope: ref },
  );

  return <div ref={ref} className={styles.glow} aria-hidden />;
}
