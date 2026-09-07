"use client";

/**
 * Settings row: three paper tiles holding turntable videos on white with
 * mix-blend-mode multiply, captioned by setting and linking to engagement rings.
 *
 * Fine pointers: hovering scrubs currentTime with the pointer's x across the
 * tile (0 to the clip's length) and the ring eases back to rest over 0.8s on
 * leave. Touch: the clip autoplays muted inline while in view and pauses when
 * out. Tiles reveal with a clip-path from the bottom, stagger 0.15s. Sources
 * attach only once a tile is near the viewport. Reduced motion: short fade.
 */

import Link from "next/link";
import { useEffect, useRef } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { videoSrc } from "@/content/catalog";
import { prefersReducedMotion, isTouchDevice } from "@/hooks/useMedia";

const SETTINGS = [
  { slug: "le2001w440-11770", caption: "Round solitaire" },
  { slug: "lrra04w442-11773", caption: "Radiant solitaire" },
  { slug: "lw2007w442-11769", caption: "Oval solitaire" },
] as const;

const CLIP_SECONDS = 15;
const HREF = "/jewelry/engagement";

export default function SettingTiles({ className = "" }: { className?: string }) {
  const rootRef = useRef<HTMLUListElement>(null);

  // Lazy source attach plus touch autoplay, both through one observer.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const videos = Array.from(root.querySelectorAll<HTMLVideoElement>("video[data-src]"));
    const touch = isTouchDevice();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            if (!video.src) {
              video.preload = "auto";
              video.src = video.dataset.src ?? "";
              video.load();
            }
            if (touch && !prefersReducedMotion()) video.play().catch(() => undefined);
          } else if (touch) {
            video.pause();
          }
        }
      },
      { rootMargin: touch ? "0px" : "40% 0px" },
    );
    videos.forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      if (!root) return;
      const tiles = Array.from(root.querySelectorAll<HTMLElement>("[data-tile]"));
      const reduced = prefersReducedMotion();

      // Reveal: clip from the bottom, stagger 0.15s (reduced motion: 0.3s fade).
      gsap.fromTo(
        tiles,
        reduced ? { autoAlpha: 0 } : { clipPath: "inset(100% 0 0 0)", y: 24, willChange: "transform, clip-path" },
        {
          ...(reduced ? { autoAlpha: 1, duration: 0.3 } : { clipPath: "inset(0% 0 0 0)", y: 0, duration: 1.3, ease: "surreal" }),
          stagger: 0.15,
          scrollTrigger: { trigger: root, start: "top 80%", once: true },
          // Drop the clip once revealed so the hover lift's shadow is not cut off at the tile edge.
          onComplete: () => gsap.set(tiles, { clearProps: "clipPath,transform,willChange" }),
        },
      );
      if (reduced || isTouchDevice()) return;

      // Hover scrub: the pointer's x across the tile maps to the clip's time.
      const offs = tiles.map((tile) => {
        const video = tile.querySelector("video");
        if (!video) return () => undefined;
        const state = { t: 0 };
        const apply = () => {
          if (video.readyState >= 1) video.currentTime = state.t;
        };
        const timeTo = gsap.quickTo(state, "t", { duration: 0.35, ease: "power2.out", onUpdate: apply });
        const move = (e: PointerEvent) => {
          const r = tile.getBoundingClientRect();
          const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          const length = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : CLIP_SECONDS;
          timeTo(x * length);
        };
        const enter = () => {
          video.pause();
          gsap.killTweensOf(state);
        };
        const leave = () => {
          gsap.killTweensOf(state);
          gsap.to(state, { t: 0, duration: 0.8, ease: "power2.inOut", onUpdate: apply });
        };
        tile.addEventListener("pointerenter", enter);
        tile.addEventListener("pointermove", move);
        tile.addEventListener("pointerleave", leave);
        return () => {
          tile.removeEventListener("pointerenter", enter);
          tile.removeEventListener("pointermove", move);
          tile.removeEventListener("pointerleave", leave);
        };
      });
      return () => offs.forEach((off) => off());
    },
    { scope: rootRef },
  );

  return (
    <ul
      ref={rootRef}
      className={`m-0 grid list-none grid-cols-2 gap-x-4 gap-y-8 p-0 md:grid-cols-12 md:gap-x-[var(--col-gap)] ${className}`}
      aria-label="Engagement ring settings"
    >
      {SETTINGS.map((setting, i) => {
        const src = videoSrc(setting.slug);
        return (
          <li
            key={setting.slug}
            className={`md:col-span-4 ${i === 2 ? "max-md:col-span-2 max-md:mx-auto max-md:w-[calc(50%-0.5rem)]" : ""}`}
          >
            <Link
              href={HREF}
              data-tile
              data-cursor="play"
              className="group block outline-none focus-visible:[&>div]:outline focus-visible:[&>div]:outline-2 focus-visible:[&>div]:outline-offset-4 focus-visible:[&>div]:outline-[var(--accent-strong)]"
              aria-label={`${setting.caption}, view setting`}
            >
              <div className="relative aspect-square overflow-hidden bg-[var(--surface)] shadow-[0_0_0_1px_var(--rule)] transition-[transform,box-shadow] duration-700 ease-[var(--ease-surreal)] group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_24px_-8px_rgba(11,31,42,0.08),0_0_0_1px_var(--rule)]">
                <video
                  className="h-full w-full object-contain transition-transform duration-1000 ease-[var(--ease-surreal)] group-hover:scale-[1.04]"
                  style={{ mixBlendMode: "multiply" }}
                  data-src={src.mp4}
                  poster={src.poster}
                  muted
                  playsInline
                  loop
                  preload="metadata"
                  aria-hidden
                  tabIndex={-1}
                />
              </div>
              <div className="mt-5 flex flex-col gap-1">
                <span className="font-editorial text-[26px] font-normal leading-tight text-[var(--fg)]">{setting.caption}</span>
                <span className="t-nav inline-flex items-center gap-2 text-[var(--fg-muted)]">
                  View setting
                  <svg aria-hidden viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" className="transition-transform duration-500 ease-[var(--ease-surreal)] group-hover:translate-x-1.5">
                    <path d="M4 12h15M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
