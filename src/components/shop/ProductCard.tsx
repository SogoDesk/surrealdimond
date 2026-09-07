"use client";

/**
 * Product card: a button holding a 4:5 paper tile (index top-left, a 360 mark
 * when the piece has a turntable, the render on multiply at 74 percent of the
 * tile width) and beneath it the name, the detail and a row of metal swatches.
 *
 * Fine pointers: the tile lifts and the render scales; a piece with a video
 * plays its turntable muted on loop while hovered, otherwise a piece with
 * angles crossfades to its first angle; hovering a swatch swaps the render to
 * that metal's variant. Click opens the quick view. The card stays in the DOM
 * when filtered out (data-hidden, display none) so GSAP Flip can animate it
 * leaving and entering.
 */

import Image from "next/image";
import { useRef, useState } from "react";
import { metals, productMetals, renderSrc, videoSrc, type Metal, type Product } from "@/content/catalog";
import { isTouchDevice, prefersReducedMotion } from "@/hooks/useMedia";
import { pad2, renderFor } from "./filters";
import s from "./shop.module.css";

const RENDER_SIZES = "(max-width: 419px) 74vw, (max-width: 767px) 37vw, (max-width: 1279px) 24vw, 22vw";

export interface ProductCardProps {
  product: Product;
  /** One-based position in the filtered list, or null when filtered out. */
  index: number | null;
  /** Metal preselected by the filters, so the tile shows that variant. */
  preferredMetal: Metal | null;
  onOpen: (product: Product) => void;
}

export default function ProductCard({ product, index, preferredMetal, onOpen }: ProductCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hoverMetal, setHoverMetal] = useState<Metal | null>(null);
  const [show, setShow] = useState<"base" | "angle" | "video">("base");
  const own = productMetals(product);
  const metal = hoverMetal ?? (preferredMetal && own.includes(preferredMetal) ? preferredMetal : null);
  const slug = renderFor(product, metal);
  const angle = product.angles?.[0];
  const video = product.video ? videoSrc(product.video) : null;
  const hidden = index === null;

  const enter = () => {
    if (isTouchDevice() || prefersReducedMotion()) return;
    if (video) {
      const el = videoRef.current;
      if (el) {
        if (!el.src) {
          el.src = video.mp4;
          el.load();
        }
        el.play().catch(() => undefined);
      }
      setShow("video");
    } else if (angle) {
      setShow("angle");
    }
  };
  const leave = () => {
    const el = videoRef.current;
    if (el && el.src) {
      el.pause();
      el.currentTime = 0;
    }
    setShow("base");
    setHoverMetal(null);
  };

  return (
    <button
      type="button"
      className={s.card}
      data-tile
      data-card
      data-flip-id={product.id}
      data-hidden={hidden ? "true" : undefined}
      data-show={show === "base" ? undefined : show}
      data-cursor="view"
      aria-label={`${product.name}, ${product.detail}, quick view`}
      onClick={() => onOpen(product)}
      onPointerEnter={enter}
      onPointerLeave={leave}
    >
      <span className={s.tileWell}>
        <span className={`t-index ${s.index}`} aria-hidden>
          {index === null ? "" : pad2(index)}
        </span>
        {video && (
          <span className={s.mark360} aria-hidden>
            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M1.5 6a4.5 4.5 0 1 0 1.3-3.2" />
              <path d="M1.5 1.5v2.4h2.4" />
            </svg>
            360
          </span>
        )}
        <span className={s.stage}>
          <Image src={renderSrc(slug)} alt="" width={1200} height={1200} sizes={RENDER_SIZES} draggable={false} className={`${s.render} ${s.renderBase}`} />
          {angle && !video && (
            <Image src={renderSrc(angle)} alt="" width={1200} height={1200} sizes={RENDER_SIZES} draggable={false} className={`${s.render} ${s.renderAlt}`} loading="lazy" />
          )}
          {video && <video ref={videoRef} className={s.video} poster={video.poster} muted playsInline loop preload="none" aria-hidden tabIndex={-1} />}
        </span>
      </span>
      <span className={s.meta}>
        <span className={s.name}>{product.name}</span>
        <span className={s.detail}>{product.detail}</span>
        {own.length > 1 && (
          <span className={s.swatches} aria-hidden>
            {own.map((m) => {
              const meta = metals.find((x) => x.id === m);
              return (
                <span
                  key={m}
                  className={s.swatch}
                  style={{ background: meta?.swatch }}
                  data-active={metal === m ? "true" : undefined}
                  title={meta?.label}
                  onPointerEnter={() => setHoverMetal(m)}
                />
              );
            })}
          </span>
        )}
      </span>
    </button>
  );
}
