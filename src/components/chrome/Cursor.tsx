"use client";

/**
 * Custom cursor (DESIGN.md, "Cursor and micro"). Fine pointers only: a 6px dot
 * tracking 1:1 and a 32px ring that follows with a quickTo lag. Ink on light,
 * sky on dark, ink on the sky panel: the cursor copies the data-theme of the
 * nearest themed ancestor under the pointer (a chapter, the mega menu, the
 * sheet) and falls back to html[data-page-theme], which ThemeSync writes.
 * The ring is an SVG circle with a non-scaling stroke so it stays 1px while
 * it scales. Over links and buttons the ring grows to 44px and the dot
 * disappears; over [data-cursor] targets (view, drag, turn, play, open) it
 * grows to 72px with a Jost label; over text it steps aside for the native
 * I-beam; over inputs it becomes a filled mist disc. Hidden the moment a touch
 * event fires and never mounted under reduced motion.
 */

import { useRef } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { isTouchDevice, prefersReducedMotion } from "@/hooks/useMedia";
import styles from "./chrome.module.css";

const LABELS: Record<string, string> = { view: "View", drag: "Drag", turn: "Turn", play: "Play", open: "Open" };
const TEXT_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, dt, dd, td, th, em, strong, address, time";
const INPUT_SELECTOR = "input, textarea, select, [contenteditable='true']";
const CLICK_SELECTOR = "a, button, [role='button'], label, summary";

type State = "default" | "link" | "label" | "text" | "input";

export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const root = ref.current;
      if (!root) return;
      if (!window.matchMedia("(pointer: fine)").matches || isTouchDevice() || prefersReducedMotion()) return;

      const html = document.documentElement;
      const dot = root.querySelector<HTMLElement>("[data-dot]");
      const ring = root.querySelector<HTMLElement>("[data-ring]");
      const shape = root.querySelector<HTMLElement>("[data-shape]");
      const label = root.querySelector<HTMLElement>("[data-label]");
      if (!dot || !ring || !shape || !label) return;

      html.dataset.cursor = "custom";
      gsap.set(root, { autoAlpha: 0 });
      gsap.set([dot, ring], { x: -100, y: -100 });

      const dotX = gsap.quickSetter(dot, "x", "px");
      const dotY = gsap.quickSetter(dot, "y", "px");
      const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" });
      const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });

      let visible = false;
      let state: State = "default";
      let alive = true;

      const setVisible = (next: boolean) => {
        if (visible === next) return;
        visible = next;
        gsap.to(root, { autoAlpha: next ? 1 : 0, duration: 0.3, ease: "power2.out", overwrite: true });
      };

      const apply = (next: State, text = "") => {
        if (next === "label" && label.textContent !== text) label.textContent = text;
        if (next === state) return;
        state = next;
        document.body.style.cursor = next === "text" ? "text" : "";
        shape.dataset.fill = next === "input" ? "true" : "false";
        const ringScale = next === "label" ? 72 / 32 : next === "link" ? 44 / 32 : 1;
        const dotScale = next === "default" ? 1 : 0;
        gsap.to(shape, { scale: ringScale, duration: 0.4, ease: "surreal", overwrite: true });
        gsap.to(dot, { scale: dotScale, duration: 0.4, ease: "surreal", overwrite: "auto" });
        gsap.to(label, { autoAlpha: next === "label" ? 1 : 0, duration: 0.3, ease: "power2.out", overwrite: true });
        if (next === "text") setVisible(false);
        else if (!visible) setVisible(true);
      };

      const move = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        dotX(e.clientX);
        dotY(e.clientY);
        ringX(e.clientX);
        ringY(e.clientY);
        if (state !== "text") setVisible(true);
      };

      const over = (e: PointerEvent) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const themed = target.closest<HTMLElement>("[data-theme]");
        root.dataset.cursorTheme = themed?.dataset.theme ?? html.dataset.pageTheme ?? "light";
        const tagged = target.closest<HTMLElement>("[data-cursor]:not(html)");
        if (tagged) {
          const kind = tagged.dataset.cursor ?? "link";
          if (kind in LABELS) return apply("label", LABELS[kind]);
          return apply("link");
        }
        if (target.closest(INPUT_SELECTOR)) return apply("input");
        if (target.closest(CLICK_SELECTOR)) return apply("link");
        if (target.closest(TEXT_SELECTOR) && (target.textContent ?? "").trim().length > 0) return apply("text");
        apply("default");
      };

      const leaveWindow = () => setVisible(false);
      const enterWindow = () => {
        if (state !== "text") setVisible(true);
      };

      const teardown = () => {
        if (!alive) return;
        alive = false;
        window.removeEventListener("pointermove", move);
        document.removeEventListener("pointerover", over);
        document.removeEventListener("mouseleave", leaveWindow);
        document.removeEventListener("mouseenter", enterWindow);
        document.body.style.cursor = "";
        delete html.dataset.cursor;
        delete root.dataset.cursorTheme;
        gsap.set(root, { autoAlpha: 0 });
      };
      const onTouch = () => teardown();

      window.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerover", over);
      document.addEventListener("mouseleave", leaveWindow);
      document.addEventListener("mouseenter", enterWindow);
      window.addEventListener("touchstart", onTouch, { passive: true, once: true });

      return () => {
        window.removeEventListener("touchstart", onTouch);
        teardown();
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={styles.cursor} aria-hidden data-site-cursor>
      <div className={styles.cursorDot} data-dot />
      <div className={styles.cursorRing} data-ring>
        <svg className={styles.cursorShape} data-shape data-fill="false" viewBox="0 0 32 32" focusable="false">
          <circle cx="16" cy="16" r="15.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className={styles.cursorLabel} data-label />
      </div>
    </div>
  );
}
