"use client";

/**
 * Porcelain preloader (DESIGN.md, "Preloader").
 *
 *   <Preloader />   place once, first child of the page (above the header)
 *
 * Sequence on a first visit per session: the line mark draws stroke by stroke
 * (sky leading ink), a Jost counter runs on real asset progress with a 1.8 s
 * floor, SURREAL tracks in beneath the mark with its byline, then a beam wipes
 * left to right while the sheet's clip-path follows it and the mark and
 * wordmark fly into the header's #site-logo with Flip. Return visits get a
 * 0.4 s fade; reduced motion gets a 0.3 s fade.
 *
 * Signals for the rest of the page: the moment the beam starts (or at once on
 * the short paths) it sets document.documentElement.dataset.revealed = "true"
 * and dispatches a "surreal:reveal" CustomEvent on window with
 * detail.mode = "full" | "repeat" | "reduced" | "skipped".
 *
 * The server renders only the flat porcelain sheet; the mark, counter and
 * wordmark mount on the client and stay hidden until GSAP owns them.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { registerGsap, gsap, Flip, useGSAP } from "@/lib/gsap";
import { lockScroll } from "@/lib/scroll";
import { prefersReducedMotion } from "@/hooks/useMedia";
import LineMark from "@/components/brand/LineMark";
import styles from "./Preloader.module.css";

export const PRELOADER_SESSION_KEY = "surreal-preloaded";
export const PRELOADER_REVEAL_EVENT = "surreal:reveal";
export type PreloaderRevealMode = "full" | "repeat" | "reduced" | "skipped";

const HERO_SRC = "/media/photos/hero-3984-wide.webp";
const FRAME_DIR = "/media/seq/le2004w442-11771";
const FRAME_COUNT = 12;
const MIN_DISPLAY = 1.8;
const COUNTER_START = 0.4;
const COUNTER_SPAN = 1.2;
const ASSET_TIMEOUT_MS = 8000;

type Mode = "full" | "repeat" | "reduced";

function announceReveal(mode: PreloaderRevealMode) {
  document.documentElement.dataset.revealed = "true";
  window.dispatchEvent(new CustomEvent(PRELOADER_REVEAL_EVENT, { detail: { mode } }));
}

/** Resolves once the image is decoded, or on error, never rejects. */
function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    img.decode().then(() => resolve(), () => resolve());
  });
}

/** Fonts, the hero photograph and the first turntable frames, with a hard cap. */
function preloadAssets(onProgress: (p: number) => void): Promise<void> {
  const tasks: Promise<void>[] = [
    document.fonts.ready.then(() => undefined),
    loadImage(HERO_SRC),
    ...Array.from({ length: FRAME_COUNT }, (_, i) => loadImage(`${FRAME_DIR}/${String(i + 1).padStart(3, "0")}.webp`)),
  ];
  let done = 0;
  const tracked = tasks.map((t) =>
    t.then(() => {
      done += 1;
      onProgress(done / tasks.length);
    }),
  );
  const cap = new Promise<void>((resolve) => {
    window.setTimeout(() => {
      onProgress(1);
      resolve();
    }, ASSET_TIMEOUT_MS);
  });
  return Promise.race([Promise.all(tracked).then(() => undefined), cap]);
}

/**
 * Takes a lockup piece out of the centered flex column at its current place,
 * so the flights measure a layout that cannot shift while they run.
 */
function pinInPlace(el: HTMLElement | SVGSVGElement): DOMRect {
  const r = el.getBoundingClientRect();
  gsap.set(el, { position: "absolute", left: r.left, top: r.top, width: r.width, height: r.height, margin: 0 });
  return r;
}

/**
 * Flies a text element onto a target with one uniform scale (the font size
 * ratio) while its tracking tweens to the target's, so the glyphs land on the
 * header's glyphs without stretching. Returns null when either box is empty.
 */
function flyText(el: HTMLElement, target: Element, duration: number): gsap.core.Tween | null {
  const from = el.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (from.width < 1 || from.height < 1 || to.width < 1 || to.height < 1) return null;
  const fromSize = parseFloat(getComputedStyle(el).fontSize);
  const toStyle = getComputedStyle(target);
  const toSize = parseFloat(toStyle.fontSize);
  if (!fromSize || !toSize) return null;
  const spacing = parseFloat(toStyle.letterSpacing);
  const tracking = Number.isFinite(spacing) ? `${spacing / toSize}em` : "0.08em";
  return gsap.fromTo(
    el,
    { transformOrigin: "0% 50%", x: 0, y: 0, scale: 1 },
    {
      x: to.left - from.left,
      y: to.top + to.height / 2 - (from.top + from.height / 2),
      scale: toSize / fromSize,
      letterSpacing: tracking,
      duration,
      ease: "surreal",
    },
  );
}

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<() => void>(() => undefined);
  const [mode, setMode] = useState<Mode | null>(null);
  const [done, setDone] = useState(false);

  // Decide the path on the client only: sessionStorage and media queries are not available on the server.
  useEffect(() => {
    let next: Mode = "full";
    try {
      if (window.sessionStorage.getItem(PRELOADER_SESSION_KEY)) next = "repeat";
    } catch {
      // storage unavailable: run the full sequence
    }
    if (prefersReducedMotion()) next = "reduced";
    if (next === "full") {
      try {
        window.sessionStorage.setItem(PRELOADER_SESSION_KEY, "1");
      } catch {
        // ignore
      }
    }
    // Applied in a microtask: the server's flat sheet must hydrate before the client path renders.
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setMode(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hold the page still while the full sequence plays. Lenis mounts in a parent
  // effect, so lock again on the next frame to catch it once it exists.
  useEffect(() => {
    if (mode !== "full") return;
    lockScroll(true);
    const raf = window.requestAnimationFrame(() => lockScroll(true));
    return () => {
      window.cancelAnimationFrame(raf);
      lockScroll(false);
    };
  }, [mode]);

  useGSAP(
    () => {
      if (!mode) return;
      registerGsap();
      const root = rootRef.current;
      if (!root) return;

      let finished = false;
      let disposed = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        lockScroll(false);
        setDone(true);
      };

      if (mode !== "full") {
        announceReveal(mode);
        gsap.to(root, { autoAlpha: 0, duration: mode === "repeat" ? 0.4 : 0.3, ease: "none", onComplete: finish });
        return;
      }

      const sheet = root.querySelector<HTMLElement>("[data-sheet]");
      const mark = root.querySelector<SVGSVGElement>("[data-mark] svg");
      const word = root.querySelector<HTMLElement>("[data-word]");
      const byline = root.querySelector<HTMLElement>("[data-byline]");
      const counter = root.querySelector<HTMLElement>("[data-counter]");
      const beam = root.querySelector<HTMLElement>("[data-beam]");
      if (!sheet || !mark || !word || !byline || !counter || !beam) {
        announceReveal("full");
        gsap.to(root, { autoAlpha: 0, duration: 0.4, ease: "none", onComplete: finish });
        return;
      }

      // Strokes are ordered from the outermost, bottom-left curve inward.
      const skyPaths = Array.from(mark.querySelectorAll<SVGPathElement>('[data-layer="sky"] path'));
      const inkPaths = Array.from(mark.querySelectorAll<SVGPathElement>('[data-layer="ink"] path'));

      gsap.set([...skyPaths, ...inkPaths], { drawSVG: "0%" });
      gsap.set(word, { autoAlpha: 0, letterSpacing: "0.6em", marginRight: "-0.6em" });
      gsap.set([byline, counter], { autoAlpha: 0 });
      gsap.set(mark, { visibility: "visible" });

      // 0.0 to 1.5 s: the draw. 0.4 s: the counter appears. 1.2 to 1.8 s: the wordmark tracks in.
      const intro = gsap.timeline();
      skyPaths.forEach((p, i) => intro.to(p, { drawSVG: "100%", duration: 0.9, ease: "power2.out" }, i * 0.018));
      inkPaths.forEach((p, i) => intro.to(p, { drawSVG: "100%", duration: 0.9, ease: "power2.out" }, i * 0.018 + 0.06));
      intro.to(counter, { autoAlpha: 1, duration: 0.4, ease: "none" }, COUNTER_START);
      intro.to(word, { autoAlpha: 1, letterSpacing: "0.08em", marginRight: "-0.08em", duration: 0.6, ease: "power3.out" }, 1.2);
      intro.to(byline, { autoAlpha: 1, duration: 0.4, ease: "none" }, 1.4);

      // The counter follows real progress, capped by a time curve so cached
      // assets still read as a count and slow ones hold the number honestly.
      let real = 0;
      let shown = 0;
      let beamStarted = false;
      const started = performance.now();
      preloadAssets((p) => {
        real = Math.max(real, p);
      });

      const startBeam = () => {
        if (beamStarted || disposed) return;
        beamStarted = true;
        announceReveal("full");

        const vw = window.innerWidth;
        const tl = gsap.timeline({ onComplete: finish });
        tl.set(beam, { visibility: "visible" }, 0);
        tl.to(counter, { autoAlpha: 0, duration: 0.2, ease: "none" }, 0);
        tl.to(byline, { autoAlpha: 0, duration: 0.3, ease: "none" }, 0);

        // The beam line and the sheet's clip edge share one value, so the
        // porcelain is gone exactly in the beam's wake and never ahead of it.
        const setBeamX = gsap.quickSetter(beam, "x", "px");
        const setClip = gsap.quickSetter(sheet, "clipPath");
        const sweep = { x: -140 };
        setBeamX(sweep.x);
        setClip("inset(0 0 0 0px)");
        tl.to(
          sweep,
          {
            x: vw + 140,
            duration: 0.4,
            ease: "surreal",
            onUpdate: () => {
              setBeamX(sweep.x);
              setClip(`inset(0 0 0 ${Math.max(0, sweep.x)}px)`);
            },
          },
          0,
        );
        // Once the sheet is gone the page beneath is live; only the flight remains.
        tl.set([beam, sheet], { visibility: "hidden" }, 0.4);
        tl.set(root, { pointerEvents: "none" }, 0.4);

        // Hand-off: the mark and wordmark fly to their nav positions.
        const logo = document.getElementById("site-logo");
        const markTarget = logo?.querySelector<Element>("[data-line-mark]") ?? logo;
        const wordTarget = logo?.querySelector<Element>("[data-wordmark-text]") ?? logo?.querySelector<Element>("[data-wordmark]") ?? null;
        if (logo && markTarget) {
          const theme = getComputedStyle(logo);
          const inkTo = theme.getPropertyValue("--mark-a").trim() || "#f2f4f6";
          const skyTo = theme.getPropertyValue("--mark-b").trim() || "#86dfff";
          gsap.set(logo, { opacity: 0 });
          // Freeze the lockup where it stands: the flex column would otherwise
          // recentre the mark as the wordmark's tracking changes mid flight.
          pinInPlace(mark);
          pinInPlace(word);
          pinInPlace(byline);
          const markBox = markTarget.getBoundingClientRect();
          if (markBox.width >= 1 && markBox.height >= 1) {
            tl.add(Flip.fit(mark, markTarget, { duration: 0.9, ease: "surreal", scale: true }) as gsap.core.Tween, 0);
          } else {
            tl.to(mark, { autoAlpha: 0, duration: 0.5, ease: "none" }, 0);
          }
          const wordFlight = wordTarget ? flyText(word, wordTarget, 0.9) : null;
          if (wordFlight) {
            tl.add(wordFlight, 0);
          } else {
            tl.to(word, { autoAlpha: 0, duration: 0.4, ease: "none" }, 0);
          }
          // The nav sits on the dark hero: ink strokes cross to the header's stroke colour over the last 0.4 s.
          tl.to(inkPaths, { stroke: inkTo, duration: 0.4, ease: "none" }, 0.5);
          tl.to(skyPaths, { stroke: skyTo, duration: 0.4, ease: "none" }, 0.5);
          tl.set(logo, { clearProps: "opacity" }, 0.9);
        } else {
          tl.to([mark, word], { autoAlpha: 0, duration: 0.5, ease: "none" }, 0);
        }
      };

      const tick = () => {
        const elapsed = (performance.now() - started) / 1000;
        const cap = gsap.utils.clamp(0, 1, (elapsed - COUNTER_START) / COUNTER_SPAN);
        const target = Math.min(cap, real);
        shown += (target - shown) * Math.min(1, 0.16 * gsap.ticker.deltaRatio());
        if (target >= 1 && shown > 0.995) shown = 1;
        counter.textContent = String(Math.round(shown * 100)).padStart(3, "0");
        if (shown >= 1 && elapsed >= MIN_DISPLAY) {
          gsap.ticker.remove(tick);
          startBeam();
        }
      };
      gsap.ticker.add(tick);

      skipRef.current = () => {
        if (disposed || beamStarted) return;
        beamStarted = true;
        gsap.ticker.remove(tick);
        intro.kill();
        announceReveal("skipped");
        gsap.to(root, { autoAlpha: 0, duration: 0.3, ease: "none", onComplete: finish });
      };

      return () => {
        disposed = true;
        gsap.ticker.remove(tick);
      };
    },
    { scope: rootRef, dependencies: [mode], revertOnUpdate: true },
  );

  const onSkip = useCallback(() => skipRef.current(), []);

  if (done) return null;

  const full = mode === "full";
  return (
    <div ref={rootRef} className={styles.root} data-preloader aria-busy={full || undefined}>
      <div className={styles.sheet} data-sheet>
        {full ? (
          <span className={styles.counter} data-counter aria-hidden="true">
            000
          </span>
        ) : null}
      </div>
      {full ? (
        <div className={styles.lockup} role="img" aria-label="Surreal by JB Bhanderi">
          <span data-mark style={{ display: "contents" }}>
            <LineMark className={styles.mark} />
          </span>
          <span className={styles.word} data-word>
            SURREAL
          </span>
          <span className={styles.byline} data-byline>
            by JB BHANDERI
          </span>
        </div>
      ) : null}
      {full ? <div className={styles.beam} data-beam aria-hidden="true" /> : null}
      {full ? (
        <button type="button" className={styles.skip} onClick={onSkip} data-cursor="link">
          Skip intro
        </button>
      ) : null}
    </div>
  );
}
