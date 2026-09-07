"use client";

/**
 * 03. Say yes (engagement). A 240vh pinned stage (160vh on mobile): the studio
 * photograph returns and pushes in on the ring, a circle of porcelain opens
 * from the ring and the photographed ring dissolves into a scroll-scrubbed
 * turntable that the pointer nudges; the copy reveals at 35 percent, when the
 * section flips its data-theme to light so the header follows; the shape strip
 * draws at 60 percent. An unpinned settings row follows. Reduced motion: a
 * static porcelain panel with frame 0 and the strip drawn.
 */

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore, type MouseEvent } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import { useSplitLines } from "@/components/motion/SplitReveal";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { scrollToTarget } from "@/lib/scroll";
import { prefersReducedMotion, isTouchDevice } from "@/hooks/useMedia";
import ShapeStrip, { type ShapeStripHandle } from "./ShapeStrip";
import SettingTiles from "./SettingTiles";
import styles from "./Engagement.module.css";

/* saveData or a 2g connection: one still render with a slow tilt instead of the sequence. */
const isLiteConnection = () => {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(conn?.saveData) || /(^|-)2g$/.test(conn?.effectiveType ?? "");
};
const subscribeNever = () => () => undefined;

const PHOTO = "/media/photos/hero-3984-wide.webp";
const STILL = "/media/renders/le2004w442-11741.webp";
const SEQ_DIR = "/media/seq/le2004w442-11771";
const VIDEO = { mp4: "/media/video/le2004w442-11771.mp4", poster: "/media/video/le2004w442-11771.webp", seconds: 15 };
const FRAMES = 96;
const EAGER = 12;
/* Video takes over at pin start when fewer than this share of the wanted frames have arrived (60 of 96). */
const VIDEO_FALLBACK_SHARE = 60 / 96;
const NUDGE = 8;
const MAX_DPR = 2;
const CHAPTER = "engagement";
const NEXT_SECTION = "#collections";

/* The photographed ring inside the 21:9 crop and the ring inside the turntable frames, as fractions. */
const PHOTO_RING = { w: 2400, h: 1028, x: 0.5, y: 0.66, width: 0.115, posX: 0.5, posY: 0.58 };
const FRAME_RING = { x: 0.5, y: 0.55, width: 0.7 };

type Frames = (HTMLImageElement | null)[];

/** Where the ring lands on the stage for an object-fit cover image at the hero's object position. */
function ringOnStage(w: number, h: number) {
  const s = Math.max(w / PHOTO_RING.w, h / PHOTO_RING.h);
  const rw = PHOTO_RING.w * s;
  const rh = PHOTO_RING.h * s;
  const ox = (w - rw) * PHOTO_RING.posX;
  const oy = (h - rh) * PHOTO_RING.posY;
  return { x: ox + rw * PHOTO_RING.x, y: oy + rh * PHOTO_RING.y, w: rw * PHOTO_RING.width };
}

/** Load frames by index with a small concurrency cap. Returns a disposer. */
function loadFrames(images: Frames, indices: number[], onLoad: (i: number) => void) {
  const queue = indices.filter((i) => !images[i]);
  let disposed = false;
  let active = 0;
  const pump = () => {
    while (active < 6 && queue.length && !disposed) {
      const i = queue.shift() as number;
      const img = document.createElement("img");
      img.decoding = "async";
      active++;
      img.onload = img.onerror = () => {
        active--;
        if (disposed) return;
        if (img.naturalWidth > 0) {
          images[i] = img;
          onLoad(i);
        }
        pump();
      };
      img.src = `${SEQ_DIR}/${String(i + 1).padStart(3, "0")}.webp`;
    }
  };
  pump();
  return () => {
    disposed = true;
  };
}

/** Draw the closest loaded frame to `index` with contain math at device pixel ratio; returns what was drawn. */
function drawFrame(canvas: HTMLCanvasElement, images: Frames, index: number) {
  let pick = -1;
  for (let d = 0; d < FRAMES && pick < 0; d++) {
    if (images[index - d]) pick = index - d;
    else if (images[index + d]) pick = index + d;
  }
  const img = pick >= 0 ? images[pick] : null;
  const ctx = canvas.getContext("2d");
  if (!img || !ctx) return -1;
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const cw = canvas.width / dpr;
  const ch = canvas.height / dpr;
  const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  return pick;
}

function frameOrder(stride: number) {
  const order: number[] = [];
  for (let i = 0; i < FRAMES; i += 8) order.push(i);
  for (let i = 0; i < FRAMES; i += stride) if (!order.includes(i)) order.push(i);
  return order;
}

/**
 * The header only reads a chapter's data-theme when the chapter crosses the bar,
 * so the mid-pin flip mirrors itself onto the header and the root while this
 * chapter is the one under the bar. Local stand-in for attribute observation.
 */
function syncChrome(theme: "light" | "dark") {
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  if (!header) return;
  const active = header.dataset.activeChapter;
  if (active && active !== CHAPTER) return;
  header.dataset.theme = theme;
  document.documentElement.dataset.pageTheme = theme;
}

export default function Engagement() {
  const stageRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const porcelainRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stripRef = useRef<ShapeStripHandle>(null);

  const imagesRef = useRef<Frames>(Array.from({ length: FRAMES }, () => null));
  const loadedRef = useRef(0);
  const wantedRef = useRef(FRAMES); // frames this device asks for (every second one under 768px)
  const wantRef = useRef(0); // frame the scroll and pointer ask for
  const pickRef = useRef(-1); // frame actually on the canvas
  const videoModeRef = useRef(false);
  const lightRef = useRef(false); // past the 35 percent mark
  const headTweenRef = useRef<gsap.core.Animation | null>(null);
  // Server snapshot is false; the client re-renders once after hydration with the real connection.
  const lite = useSyncExternalStore(subscribeNever, isLiteConnection, () => false);

  /** Paint the wanted frame (canvas or, in fallback, the video's currentTime). */
  const paint = (force = false) => {
    const want = wantRef.current;
    if (videoModeRef.current) {
      const video = videoRef.current;
      if (video && video.readyState >= 1) {
        const length = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : VIDEO.seconds;
        video.currentTime = (want / FRAMES) * length;
      }
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || (!force && pickRef.current === want)) return;
    const pick = drawFrame(canvas, imagesRef.current, want);
    if (pick >= 0) pickRef.current = pick;
  };
  const paintRef = useRef(paint);
  useEffect(() => {
    paintRef.current = paint;
  });

  // Progressive preload: 12 frames at once, the rest while the time section is on screen.
  useEffect(() => {
    if (lite) return;
    const stage = stageRef.current;
    if (!stage) return;
    const images = imagesRef.current;
    const order = frameOrder(window.innerWidth < 768 ? 2 : 1);
    wantedRef.current = order.length;
    const onLoad = () => {
      loadedRef.current++;
      if (loadedRef.current >= order.length && videoModeRef.current) {
        // The whole set is in: hand back from the video to the canvas.
        videoModeRef.current = false;
        if (videoRef.current) videoRef.current.hidden = true;
        if (canvasRef.current) canvasRef.current.hidden = false;
        paintRef.current(true);
        return;
      }
      if (pickRef.current !== wantRef.current) paintRef.current(true);
    };
    const disposers = [loadFrames(images, order.slice(0, EAGER), onLoad)];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        disposers.push(loadFrames(images, order.slice(EAGER), onLoad));
        observer.disconnect();
      },
      { rootMargin: "250% 0px" },
    );
    observer.observe(stage);
    return () => {
      observer.disconnect();
      disposers.forEach((dispose) => dispose());
    };
  }, [lite]);

  // Keep the canvas bitmap in step with its box and pixel ratio.
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(entry.contentRect.width * dpr);
      canvas.height = Math.round(entry.contentRect.height * dpr);
      paintRef.current(true);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, [lite]);

  // Headline lines rise out of masks; the tween is parked until the 35 percent mark.
  useSplitLines(
    headRef,
    (split) => {
      const tween = gsap.fromTo(
        split.lines,
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, ease: "surreal", stagger: 0.08, paused: true },
      );
      if (lightRef.current) tween.progress(1);
      headTweenRef.current = tween;
      return tween;
    },
    { enabled: !prefersReducedMotion() },
  );

  useGSAP(
    () => {
      registerGsap();
      const stage = stageRef.current;
      const photo = photoRef.current;
      const porcelain = porcelainRef.current;
      const copy = copyRef.current;
      const host = hostRef.current;
      if (!stage || !porcelain || !host || !copy) return;
      const section = stage.closest<HTMLElement>("[data-chapter]");
      const setTheme = (light: boolean) => {
        const theme = light ? "light" : "dark";
        section?.setAttribute("data-theme", theme);
        syncChrome(theme);
      };

      if (prefersReducedMotion()) {
        setTheme(true);
        lightRef.current = true;
        porcelain.setAttribute("data-open", "");
        if (photo) gsap.set(photo, { autoAlpha: 0 });
        stripRef.current?.draw();
        paintRef.current(true);
        return;
      }

      const mobile = () => window.innerWidth < 768;
      const ring = () => ringOnStage(stage.clientWidth, stage.clientHeight);
      let center = { x: 0, y: 0 };
      const clip = { r: 0 };
      const frame = { index: 0 };
      const nudge = { v: 0 };
      const applyClip = () => {
        porcelain.style.clipPath = `circle(${clip.r}vmax at ${center.x}px ${center.y}px)`;
      };
      /** Transform that places the turntable's ring over the photographed ring at the same width. */
      const hostStart = () => {
        if (mobile()) return { x: 0, y: 0, scale: 0.6 };
        const r = ring();
        let left = 0;
        let top = 0;
        let el: HTMLElement | null = host;
        while (el && el !== stage) {
          left += el.offsetLeft;
          top += el.offsetTop;
          el = el.offsetParent as HTMLElement | null;
        }
        const size = host.offsetWidth;
        const scale = r.w / (size * FRAME_RING.width);
        return {
          x: r.x - (left + size / 2) - (FRAME_RING.x - 0.5) * size * scale,
          y: r.y - (top + size / 2) - (FRAME_RING.y - 0.5) * size * scale,
          scale,
        };
      };

      // Copy stack (eyebrow rule, label, body, buttons); the headline tween lives in useSplitLines.
      const copyTl = gsap.timeline({ paused: true });
      copyTl
        .fromTo(copy.querySelector(".eyebrow-rule"), { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.8, ease: "surreal" }, 0)
        .fromTo(copy.querySelector("[data-eyebrow] > span:last-child"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.2)
        .fromTo(copy.querySelector("p"), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "surreal" }, 0.5)
        .fromTo(copy.querySelectorAll("[data-ctas] > *"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, ease: "surreal", stagger: 0.1 }, 0.7);

      let stripOn = false;
      const crossings = (p: number) => {
        const light = p >= 0.35;
        if (light !== lightRef.current) {
          lightRef.current = light;
          setTheme(light);
          if (light) {
            copyTl.play();
            headTweenRef.current?.play();
          } else {
            copyTl.reverse();
            headTweenRef.current?.reverse();
          }
        }
        const strip = p >= 0.6;
        if (strip !== stripOn) {
          stripOn = strip;
          if (strip) stripRef.current?.draw();
          else stripRef.current?.reset();
        }
      };

      // Render loop: scroll frame plus pointer nudge, snapped to integers and wrapped for a full turn.
      const render = () => {
        const target = (((Math.round(frame.index + nudge.v) % FRAMES) + FRAMES) % FRAMES);
        if (target === wantRef.current) return;
        wantRef.current = target;
        paintRef.current();
      };
      const enableVideoFallback = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const enough = Math.ceil(wantedRef.current * VIDEO_FALLBACK_SHARE);
        if (!video || videoModeRef.current || loadedRef.current >= enough) return;
        videoModeRef.current = true;
        video.preload = "auto";
        video.src = VIDEO.mp4;
        video.addEventListener("loadedmetadata", () => paintRef.current(true), { once: true });
        video.load();
        video.hidden = false;
        if (canvas) canvas.hidden = true;
      };

      if (photo) gsap.set(photo, { autoAlpha: 0 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          pin: true,
          anticipatePin: 1,
          start: "top top",
          end: () => `+=${mobile() ? 160 : 240}%`,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            const r = ring();
            center = mobile() ? { x: stage.clientWidth / 2, y: stage.clientHeight / 2 } : { x: r.x, y: r.y };
            if (photo) gsap.set(photo, { transformOrigin: `${r.x}px ${r.y}px` });
            applyClip();
            crossings(self.progress);
          },
          onToggle: (self) => {
            const targets = [photo, porcelain, host].filter(Boolean) as HTMLElement[];
            if (self.isActive) {
              gsap.set(targets, { willChange: "transform" });
              gsap.ticker.add(render);
              if (self.direction >= 0) enableVideoFallback();
            } else {
              gsap.set(targets, { clearProps: "willChange" });
              gsap.ticker.remove(render);
            }
            if (photo) gsap.to(photo, { autoAlpha: self.isActive || self.progress >= 1 ? 1 : 0, duration: 0.3, ease: "power1.out", overwrite: "auto" });
          },
          onUpdate: (self) => crossings(self.progress),
        },
      });
      // 0 to 25: the camera pushes in on the ring. 25 to 45: the porcelain circle opens and the turntable
      // travels from the photographed ring to its column. 45 to 95: one full rotation.
      if (photo) tl.fromTo(photo, { scale: 1, y: 0 }, { scale: 1.35, y: () => -stage.clientHeight * 0.05, duration: 0.25, ease: "power1.inOut" }, 0);
      tl.to(clip, { r: 150, duration: 0.2, ease: "power2.in", onUpdate: applyClip }, 0.25);
      tl.fromTo(host, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: "power1.out" }, 0.25);
      tl.fromTo(
        host,
        { x: () => hostStart().x, y: () => hostStart().y, scale: () => hostStart().scale },
        { x: 0, y: 0, scale: 1, duration: 0.2, ease: "power2.inOut" },
        0.25,
      );
      tl.to(frame, { index: FRAMES - 1, duration: 0.5 }, 0.45);
      tl.to({}, { duration: 0.05 }, 0.95);

      // The pointer's x nudges the frame by up to 8 either way while the turntable is on screen.
      if (isTouchDevice()) return;
      const nudgeTo = gsap.quickTo(nudge, "v", { duration: 0.6, ease: "power3" });
      const move = (e: PointerEvent) => {
        if (tl.progress() < 0.45) return;
        nudgeTo((e.clientX / window.innerWidth - 0.5) * 2 * NUDGE);
      };
      const leave = () => nudgeTo(0);
      stage.addEventListener("pointermove", move);
      stage.addEventListener("pointerleave", leave);
      return () => {
        stage.removeEventListener("pointermove", move);
        stage.removeEventListener("pointerleave", leave);
        gsap.ticker.remove(render);
      };
    },
    { scope: stageRef, dependencies: [lite], revertOnUpdate: true },
  );

  const skipAhead = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!document.querySelector(NEXT_SECTION)) return;
    e.preventDefault();
    scrollToTarget(NEXT_SECTION);
  };

  return (
    <Section id={CHAPTER} theme="dark" label="Engagement" className={styles.section}>
      <a href={NEXT_SECTION} onClick={skipAhead} className={`${styles.skip} t-nav`}>
        Skip the engagement stage
      </a>
      <div ref={stageRef} className={styles.stage}>
        <div ref={photoRef} className={styles.photo} aria-hidden>
          <Image src={PHOTO} alt="" fill sizes="100vw" className={styles.photoImg} decoding="async" />
        </div>
        <div ref={porcelainRef} className={styles.porcelain}>
          <div className={`container grid-12 ${styles.body}`}>
            <div ref={copyRef} className={styles.copy}>
              <Eyebrow>Engagement</Eyebrow>
              <h2 ref={headRef} className="t-headline">
                Say yes to the <em>new forever</em>.
              </h2>
              <p className="t-body">
                Choose the shape, the setting and the metal. Every engagement ring is handcrafted by the finest craftspeople
                around a diamond we grew ourselves, and if the stone you want does not exist yet, we will grow it for you.
              </p>
              <div className={styles.ctas} data-ctas>
                <Button href="/jewelry/engagement" arrow>
                  Shop engagement rings
                </Button>
                <Button href="/diamonds" variant="secondary">
                  Search loose diamonds
                </Button>
              </div>
            </div>
            <div className={styles.stoneCol}>
              <div
                ref={hostRef}
                className={styles.turntable}
                data-cursor="turn"
                role="img"
                aria-label="Oval halo engagement ring on a pave band, turning as you scroll"
              >
                <span className={styles.shadow} aria-hidden />
                {lite ? (
                  <Image src={STILL} alt="" width={1200} height={1200} sizes="(max-width: 767px) 80vw, 40vw" className={styles.still} />
                ) : (
                  <>
                    <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
                    <video ref={videoRef} className={styles.video} poster={VIDEO.poster} muted playsInline preload="none" hidden aria-hidden tabIndex={-1} />
                  </>
                )}
              </div>
            </div>
          </div>
          <ShapeStrip ref={stripRef} className={styles.strip} />
        </div>
      </div>
      <div className={`container ${styles.settings}`}>
        <SettingTiles className="w-full" />
      </div>
    </Section>
  );
}
