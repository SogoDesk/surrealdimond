"use client";

/**
 * Product card: a 4:5 paper tile (index top-left, a 360 mark when the piece
 * has a turntable, the render on multiply at 74 percent of the tile width)
 * with the name and the detail beneath it, together one button that opens
 * the quick view; then the card's own selectors, a metal row of the three
 * metals as swatch dots and a carat row of the sizes offered in the category.
 *
 * The selection is local to the card and persists while it stays mounted.
 * Changing it crossfades the stage (0.35s) to the render for that metal when
 * the library has one, otherwise to a placeholder saying the piece is made
 * to order in that metal and size. Fine pointers, while the selection has a
 * render: the tile lifts and the render scales; a piece with a video plays
 * its turntable muted on loop while hovered, otherwise a piece with angles
 * crossfades to its first angle. The card stays in the DOM when filtered out
 * (data-hidden, display none) so GSAP Flip can animate it leaving and
 * entering.
 */

import Image from "next/image";
import { useRef, useState } from "react";
import { caratOptions, formatCarat, metals, renderSrc, videoSrc, type Metal, type Product } from "@/content/catalog";
import { isTouchDevice, prefersReducedMotion } from "@/hooks/useMedia";
import { defaultSelection, pad2, renderForSelection, type PieceSelection } from "./filters";
import Placeholder from "./Placeholder";
import s from "./shop.module.css";

const RENDER_SIZES = "(max-width: 419px) 74vw, (max-width: 767px) 37vw, (max-width: 1279px) 24vw, 22vw";

export interface ProductCardProps {
  product: Product;
  /** One-based position in the filtered list, or null when filtered out. */
  index: number | null;
  /** Metal chosen in the filters; the card starts on that metal and follows it when it changes. */
  preferredMetal: Metal | null;
  onOpen: (product: Product, selection: PieceSelection) => void;
}

/** What the stage shows for a selection: a render, or the placeholder for that metal and carat. */
interface StageView {
  key: string;
  slug: string | null;
  metal: Metal;
  carat: number;
}

function viewFor(product: Product, selection: PieceSelection): StageView {
  const slug = renderForSelection(product, selection);
  return { key: slug ?? `${selection.metal}|${selection.carat}`, slug, metal: selection.metal, carat: selection.carat };
}

function StageLayer({ view, out = false }: { view: StageView; out?: boolean }) {
  const motion = out ? s.layerOut : s.layerIn;
  if (view.slug === null) return <Placeholder metal={view.metal} carat={view.carat} className={motion} />;
  return (
    <Image
      src={renderSrc(view.slug)}
      alt=""
      width={1200}
      height={1200}
      sizes={RENDER_SIZES}
      draggable={false}
      className={`${s.render} ${out ? "" : s.renderBase} ${motion}`}
    />
  );
}

export default function ProductCard({ product, index, preferredMetal, onOpen }: ProductCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [show, setShow] = useState<"base" | "angle" | "video">("base");

  // The visitor's own pick; until there is one the card follows the filters.
  const [pick, setPick] = useState<PieceSelection | null>(null);
  // A newly filtered metal takes over the metal of a picked card (adjusted during render, no effect needed).
  const [seenPreferred, setSeenPreferred] = useState(preferredMetal);
  if (seenPreferred !== preferredMetal) {
    setSeenPreferred(preferredMetal);
    if (preferredMetal && pick && pick.metal !== preferredMetal) setPick({ ...pick, metal: preferredMetal });
  }
  const selection = pick ?? defaultSelection(product, preferredMetal);

  // The stage keeps the outgoing view for one crossfade (adjusted during render as well).
  const view = viewFor(product, selection);
  const [stack, setStack] = useState<{ current: StageView; previous: StageView | null }>({ current: view, previous: null });
  if (stack.current.key !== view.key) setStack({ current: view, previous: stack.current });

  const hasRender = view.slug !== null;
  const angle = product.angles?.[0];
  const video = product.video ? videoSrc(product.video) : null;
  const carats = caratOptions[product.category];
  const hidden = index === null;

  const stopMedia = () => {
    const el = videoRef.current;
    if (el && el.src) {
      el.pause();
      el.currentTime = 0;
    }
    setShow("base");
  };
  const enter = () => {
    if (!hasRender || isTouchDevice() || prefersReducedMotion()) return;
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
  const select = (patch: Partial<PieceSelection>) => {
    setPick((prev) => ({ ...(prev ?? defaultSelection(product, preferredMetal)), ...patch }));
    if (renderForSelection(product, { ...selection, ...patch }) === null) stopMedia();
  };

  return (
    <article
      className={s.card}
      data-tile
      data-card
      data-flip-id={product.id}
      data-hidden={hidden ? "true" : undefined}
      data-show={show === "base" || !hasRender ? undefined : show}
      onPointerEnter={enter}
      onPointerLeave={stopMedia}
    >
      <button type="button" className={s.cardOpen} data-cursor="view" aria-label={`${product.name}, ${product.detail}, quick view`} onClick={() => onOpen(product, selection)}>
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
            {stack.previous && <StageLayer key={`out-${stack.previous.key}`} view={stack.previous} out />}
            <StageLayer key={`in-${view.key}`} view={view} />
            {angle && !video && (
              <Image src={renderSrc(angle)} alt="" width={1200} height={1200} sizes={RENDER_SIZES} draggable={false} className={`${s.render} ${s.renderAlt}`} loading="lazy" />
            )}
            {video && <video ref={videoRef} className={s.video} poster={video.poster} muted playsInline loop preload="none" aria-hidden tabIndex={-1} />}
          </span>
        </span>
        <span className={s.meta}>
          <span className={s.name}>{product.name}</span>
          <span className={s.detail}>{product.detail}</span>
        </span>
      </button>

      <div className={s.selectors} onClick={(e) => e.stopPropagation()}>
        <div className={s.swatches} role="group" aria-label="Metal">
          {metals.map((m) => (
            <button
              key={m.id}
              type="button"
              className={s.swatch}
              style={{ background: m.swatch }}
              aria-pressed={selection.metal === m.id}
              aria-label={m.label}
              title={m.label}
              onClick={() => select({ metal: m.id })}
              data-cursor="link"
            />
          ))}
        </div>
        <div className={s.carats} role="group" aria-label="Carat">
          {carats.map((ct) => (
            <button key={ct} type="button" className={s.carat} aria-pressed={selection.carat === ct} onClick={() => select({ carat: ct })} data-cursor="link">
              {formatCarat(ct)}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
