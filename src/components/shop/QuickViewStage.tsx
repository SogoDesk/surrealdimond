"use client";

/**
 * Quick view stage: a 1:1 paper area showing the current render on multiply
 * or, for the turntable item, an inline video that scrubs with the pointer's
 * x across the stage (like the settings tiles) and eases back on leave; the
 * poster shows until the pointer arrives. Beneath it, one thumbnail per stage
 * item (primary or turntable, the angles, one per metal variant).
 */

import Image from "next/image";
import { useRef } from "react";
import { renderSrc, videoSrc, type Metal } from "@/content/catalog";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { isTouchDevice, prefersReducedMotion } from "@/hooks/useMedia";
import d from "./drawers.module.css";

export interface StageItem {
  id: string;
  kind: "image" | "video";
  /** Render slug for images, video slug for the turntable. */
  slug: string;
  label: string;
  metal?: Metal;
}

const CLIP_SECONDS = 15;
const STAGE_SIZES = "(max-width: 767px) 100vw, 270px";
const THUMB_SIZES = "56px";

export interface QuickViewStageProps {
  items: StageItem[];
  current: number;
  onSelect: (index: number) => void;
  /** Slug of the video, when the piece has one. */
  video: string | null;
}

export default function QuickViewStage({ items, current, onSelect, video }: QuickViewStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const item = items[current] ?? items[0];
  const showVideo = item?.kind === "video";
  const src = video ? videoSrc(video) : null;
  const imageSlug = item?.kind === "image" ? item.slug : items.find((i) => i.kind === "image")?.slug ?? null;

  // Hover scrub on fine pointers; touch devices play the loop while the turntable item is shown.
  useGSAP(
    () => {
      registerGsap();
      const stage = stageRef.current;
      const el = videoRef.current;
      if (!stage || !el || !src) return;
      if (!el.src) {
        el.src = src.mp4;
        el.load();
      }
      if (prefersReducedMotion()) return;
      if (isTouchDevice()) {
        if (showVideo) el.play().catch(() => undefined);
        else el.pause();
        return;
      }
      if (!showVideo) return;
      const state = { t: 0 };
      const apply = () => {
        if (el.readyState >= 1) el.currentTime = state.t;
      };
      const timeTo = gsap.quickTo(state, "t", { duration: 0.35, ease: "power2.out", onUpdate: apply });
      let returnTween: gsap.core.Tween | null = null;
      const stopReturn = () => {
        returnTween?.kill();
        returnTween = null;
      };
      const move = (e: PointerEvent) => {
        stopReturn();
        const r = stage.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const length = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : CLIP_SECONDS;
        timeTo(x * length);
      };
      const enter = () => {
        el.pause();
        stopReturn();
      };
      const leave = () => {
        timeTo.tween.pause();
        stopReturn();
        returnTween = gsap.to(state, { t: 0, duration: 0.8, ease: "power2.inOut", onUpdate: apply });
      };
      stage.addEventListener("pointerenter", enter);
      stage.addEventListener("pointermove", move);
      stage.addEventListener("pointerleave", leave);
      return () => {
        stage.removeEventListener("pointerenter", enter);
        stage.removeEventListener("pointermove", move);
        stage.removeEventListener("pointerleave", leave);
        stopReturn();
      };
    },
    { scope: stageRef, dependencies: [showVideo, src?.mp4], revertOnUpdate: true },
  );

  return (
    <div className={d.stageCol}>
      <div ref={stageRef} className={d.stage} data-show={showVideo ? "video" : "image"} data-cursor={showVideo ? "turn" : undefined}>
        {imageSlug && <Image src={renderSrc(imageSlug)} alt="" width={1200} height={1200} sizes={STAGE_SIZES} draggable={false} className={d.stageImg} />}
        {src && <video ref={videoRef} className={d.stageVideo} poster={src.poster} muted playsInline loop preload="metadata" aria-hidden tabIndex={-1} />}
        {showVideo && (
          <span className={d.stageHint} aria-hidden>
            Move to turn
          </span>
        )}
      </div>
      {items.length > 1 && (
        <ul className={d.thumbs} aria-label="Views">
          {items.map((it, i) => {
            const thumb = it.kind === "video" ? videoSrc(it.slug).poster : renderSrc(it.slug);
            return (
              <li key={it.id}>
                <button type="button" className={d.thumb} aria-pressed={i === current} aria-label={it.label} onClick={() => onSelect(i)} data-cursor="link">
                  <Image src={thumb} alt="" width={it.kind === "video" ? 720 : 1200} height={it.kind === "video" ? 720 : 1200} sizes={THUMB_SIZES} draggable={false} className={d.thumbImg} />
                  {it.kind === "video" && (
                    <span className={d.thumbMark} aria-hidden>
                      360
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
