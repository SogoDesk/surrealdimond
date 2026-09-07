"use client";

/**
 * The opening stone. One large brilliant in profile view lives in a fixed layer
 * over the first two chapters: at rest it sits half off the right edge of the
 * hero, then glides left as the time chapter rises over the held hero and
 * settles in the left half beside the word weeks, before leaving as the
 * engagement chapter arrives. Its travel is one scrubbed timeline spanning the
 * time chapter, so it never fights the chapter's own pin.
 *
 *   <OpeningStone />   (after <TimeCounter /> in the page)
 */

import { useEffect, useRef, useState } from "react";
import DiamondSceneLazy, { detectDiamondQuality, type DiamondQuality } from "@/components/three/DiamondSceneLazy";
import { registerGsap, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import styles from "./OpeningStone.module.css";

const TIME_SECTION = "#time";
const REVEAL_EVENT = "surreal:reveal";
const REVEAL_FALLBACK_MS = 6000;

export default function OpeningStone() {
  const layerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const pastEndRef = useRef(false);
  const [quality] = useState<DiamondQuality>(detectDiamondQuality);
  const [mounted, setMounted] = useState(false);

  // The canvas mounts on the client only; it unmounts once the chapters are behind us.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(!pastEndRef.current));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useGSAP(
    (_context, contextSafe) => {
      const layer = layerRef.current;
      if (!layer || !contextSafe) return;
      registerGsap();
      const reduced = prefersReducedMotion();
      const mobile = !window.matchMedia("(min-width: 768px)").matches;
      const q = gsap.utils.selector(layer);
      const box = q<HTMLElement>("[data-stone=box]")[0];
      const intro = q<HTMLElement>("[data-stone=intro]")[0];
      const time = document.querySelector<HTMLElement>(TIME_SECTION);
      if (!box || !intro) return;

      const vw = () => window.innerWidth;
      const vh = () => window.innerHeight;

      /* Rest pose: the stone's centre on the right edge of the viewport, half visible. */
      const rest = () => ({ x: mobile ? vw() * 0.56 : vw() * 0.5, y: mobile ? -vh() * 0.2 : vh() * 0.02 });
      gsap.set(box, { x: rest().x, y: rest().y, scale: 1, opacity: 1 });

      /* Entrance in the wake of the preloader beam. */
      let revealed = document.documentElement.dataset.revealed === "true";
      let started = false;
      const playEntrance = contextSafe(() => {
        if (started) return;
        started = true;
        if (reduced) {
          gsap.set(intro, { opacity: 1, scale: 1 });
          return;
        }
        gsap.fromTo(intro, { opacity: 0, scale: 0.7, x: vw() * 0.08 }, { opacity: 1, scale: 1, x: 0, duration: 2, ease: "power3.out" });
      });
      if (revealed) playEntrance();
      else window.addEventListener(REVEAL_EVENT, playEntrance, { once: true });
      const fallback = window.setTimeout(() => {
        revealed = true;
        playEntrance();
      }, REVEAL_FALLBACK_MS);

      if (!time) return () => window.clearTimeout(fallback);

      if (reduced) {
        /* Reduced motion: the stone shows in the hero only and leaves with it. */
        ScrollTrigger.create({
          trigger: time,
          start: "top 60%",
          onEnter: () => gsap.set(box, { opacity: 0 }),
          onLeaveBack: () => gsap.set(box, { opacity: 1 }),
        });
        return () => window.clearTimeout(fallback);
      }

      /* Three anchored phases. 1: the chapter rises over the held hero (its top travels from the
         viewport bottom to the top) and the stone glides in from the right edge. */
      const glide = gsap.timeline({
        defaults: { ease: "power1.inOut" },
        scrollTrigger: { trigger: time, start: "top bottom", end: "top top", scrub: 0.8, invalidateOnRefresh: true, refreshPriority: -2 },
      });
      if (mobile) {
        /* No free half beside the figure on a phone: the stone crosses to the centre and leaves with the hero. */
        glide.to(box, { x: () => 0, y: () => -vh() * 0.22, scale: 0.6, duration: 1 }, 0);
        glide.to(box, { opacity: 0, duration: 0.4, ease: "power1.in" }, 0.6);
      } else {
        glide.to(box, { x: () => vw() * 0.06, y: () => vh() * 0.03, scale: 0.86 }, 0);
      }

      /* 2: during the chapter's pin the stone keeps drifting left and settles beside the word weeks. */
      const settle = gsap.timeline({
        defaults: { ease: "power1.out" },
        scrollTrigger: {
          trigger: time,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
          // Measured after the chapter's pin has added its spacer (pins refresh first).
          refreshPriority: -2,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
        },
      });
      if (!mobile) {
        settle.to(box, { x: () => -vw() * 0.26, y: () => vh() * 0.05, scale: 0.68, duration: 0.45 }, 0);
      }

      /* 3: the stone leaves as the engagement chapter scrolls up over the chapter's end. */
      const leave = gsap.timeline({
        defaults: { ease: "power1.in" },
        scrollTrigger: { trigger: time, start: "bottom bottom", end: "bottom 35%", scrub: 0.6, invalidateOnRefresh: true, refreshPriority: -2 },
      });
      leave.to(box, { opacity: 0, scale: mobile ? 0.3 : 0.5, y: () => vh() * 0.18 }, 0);
      void glide;
      void leave;

      /* Unmount the canvas once the chapters are 100vh behind; remount on the way back. */
      ScrollTrigger.create({
        trigger: time,
        start: "bottom -100%",
        refreshPriority: -2,
        onEnter: () => {
          pastEndRef.current = true;
          setMounted(false);
        },
        onLeaveBack: () => {
          pastEndRef.current = false;
          setMounted(true);
        },
      });

      return () => {
        window.removeEventListener(REVEAL_EVENT, playEntrance);
        window.clearTimeout(fallback);
      };
    },
    { scope: layerRef },
  );

  return (
    <div ref={layerRef} className={styles.layer} aria-hidden data-opening-stone>
      <div className={styles.box} data-stone="box">
        <div className={styles.intro} data-stone="intro">
          <div className={styles.glow} />
          {mounted && <DiamondSceneLazy className={styles.canvas} progressRef={progressRef} quality={quality} view="profile" />}
        </div>
      </div>
    </div>
  );
}
