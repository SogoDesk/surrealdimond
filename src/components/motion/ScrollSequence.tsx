"use client";

/**
 * Scroll-scrubbed image sequence (turntable style).
 *
 *   <ScrollSequence dir="/media/seq/le2004w442-11771" frames={96} blend="multiply" scrollLength="250%">
 *     <Reveal className="absolute bottom-12 left-[var(--gutter)]">...</Reveal>
 *   </ScrollSequence>
 *
 * Frames are named by `pattern` (1-based, "%03d.webp" gives 001.webp) and are
 * preloaded first and last, then every 8th, then the rest, so scrubbing works
 * before the whole set has arrived. The canvas is drawn with object-fit contain
 * math at device pixel ratio and only when the frame index changes. With pin
 * (default) the wrapper pins for `scrollLength` of viewport height while the
 * sequence plays; children render above the canvas inside the pinned wrapper.
 * Reduced motion: the last frame is drawn, nothing pins or scrubs.
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";

export interface ScrollSequenceProps {
  dir: string;
  frames: number;
  pattern?: string;
  className?: string;
  style?: CSSProperties;
  pin?: boolean;
  scrollLength?: string;
  scrub?: number;
  blend?: "multiply" | "normal";
  /** Accessible description for the rendered sequence. */
  label?: string;
  children?: ReactNode;
  onProgress?: (progress: number) => void;
}

const CONCURRENCY = 6;
const MAX_DPR = 2;

function frameUrl(dir: string, pattern: string, index: number) {
  const file = pattern.replace(/%(0?)(\d*)d/, (_match, zero: string, width: string) => {
    const n = String(index + 1);
    return zero && width ? n.padStart(Number(width), "0") : n;
  });
  return `${dir.replace(/\/$/, "")}/${file}`;
}

/** First, last, every 8th, then everything else, each index once. */
function loadOrder(frames: number) {
  const seen = new Set<number>();
  const order: number[] = [];
  const push = (i: number) => {
    if (i >= 0 && i < frames && !seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  push(0);
  push(frames - 1);
  for (let i = 0; i < frames; i += 8) push(i);
  for (let i = 0; i < frames; i++) push(i);
  return order;
}

export default function ScrollSequence({
  dir,
  frames,
  pattern = "%03d.webp",
  className = "",
  style,
  pin = true,
  scrollLength = "200%",
  scrub = 0.6,
  blend = "normal",
  label,
  children,
  onProgress,
}: ScrollSequenceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const wantRef = useRef(0); // frame the scroll position asks for
  const drawnRef = useRef(-1); // image index currently on the canvas
  const progressRef = useRef(onProgress);
  useEffect(() => {
    progressRef.current = onProgress;
  }, [onProgress]);
  // ready is derived from the source the first frame belongs to, so a new sequence resets it.
  const sourceKey = `${dir}|${pattern}|${frames}`;
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const ready = readyKey === sourceKey;

  /** Draw the closest loaded frame to `index`; skipped when it is already on screen. */
  const draw = useCallback(
    (index: number, force = false) => {
      const canvas = canvasRef.current;
      const images = imagesRef.current;
      if (!canvas) return;
      let pick = -1;
      for (let d = 0; d < frames && pick < 0; d++) {
        if (images[index - d]) pick = index - d;
        else if (images[index + d]) pick = index + d;
      }
      if (pick < 0 || (pick === drawnRef.current && !force)) return;
      const img = images[pick];
      const ctx = canvas.getContext("2d");
      if (!img || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      drawnRef.current = pick;
    },
    [frames],
  );

  // Progressive preload with a small concurrency cap.
  useEffect(() => {
    const images: (HTMLImageElement | null)[] = Array.from({ length: frames }, () => null);
    imagesRef.current = images;
    drawnRef.current = -1;
    const queue = loadOrder(frames);
    let disposed = false;
    let active = 0;

    const pump = () => {
      while (active < CONCURRENCY && queue.length && !disposed) {
        const i = queue.shift() as number;
        const img = new Image();
        img.decoding = "async";
        active++;
        img.onload = img.onerror = () => {
          active--;
          if (disposed) return;
          if (img.naturalWidth > 0) {
            images[i] = img;
            if (i === 0) setReadyKey(sourceKey);
            if (drawnRef.current !== wantRef.current) draw(wantRef.current);
          }
          pump();
        };
        img.src = frameUrl(dir, pattern, i);
      }
    };
    pump();
    return () => {
      disposed = true;
    };
  }, [dir, frames, pattern, sourceKey, draw]);

  // Keep the canvas bitmap in step with the container and pixel ratio.
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(entry.contentRect.width * dpr);
      canvas.height = Math.round(entry.contentRect.height * dpr);
      draw(wantRef.current, true);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [draw]);

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      if (!root) return;
      if (prefersReducedMotion()) {
        wantRef.current = frames - 1;
        draw(frames - 1);
        return;
      }
      const state = { frame: 0 };
      gsap.to(state, {
        frame: frames - 1,
        snap: "frame",
        ease: "none",
        scrollTrigger: {
          trigger: root,
          pin,
          anticipatePin: pin ? 1 : 0,
          scrub,
          start: pin ? "top top" : "top bottom",
          end: pin ? `+=${scrollLength}` : "bottom top",
          invalidateOnRefresh: true,
          onUpdate: (self) => progressRef.current?.(self.progress),
        },
        onUpdate: () => {
          const frame = Math.round(state.frame);
          if (frame === wantRef.current) return;
          wantRef.current = frame;
          draw(frame);
        },
      });
    },
    { scope: rootRef, dependencies: [frames, pin, scrollLength, scrub, draw], revertOnUpdate: true },
  );

  return (
    <div
      ref={rootRef}
      className={`relative w-full ${className}`}
      style={{ height: pin ? "100svh" : undefined, ...style }}
      role={label ? "img" : undefined}
      aria-label={label}
      data-ready={ready || undefined}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full transition-opacity duration-700"
        style={{ mixBlendMode: blend, opacity: ready ? 1 : 0 }}
      />
      {children}
    </div>
  );
}
