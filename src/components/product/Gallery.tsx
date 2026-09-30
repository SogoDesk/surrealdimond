"use client";

/**
 * Product gallery (after Tanishq's two-up gallery). Desktop: a wide first
 * view, then square tiles: the turntable, the other renders and two campaign
 * photographs from the category (tagged Campaign, since they show the
 * collection rather than this exact piece). Phones: one swipe row with a
 * counter. Any view opens the full screen viewer: arrows, keyboard, swipe,
 * thumbnails, Escape to close. A View similar pill on the first view jumps
 * to the similar designs.
 */

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import Placeholder from "@/components/shop/Placeholder";
import { renderForSelection, type PieceSelection } from "@/components/shop/filters";
import { productViews, renderSrc, videoSrc, type Product } from "@/content/catalog";
import { editorial } from "@/content/editorial";
import { groundStyle } from "@/content/grounds";
import { lockScroll } from "@/lib/scroll";
import s from "./product.module.css";

type View = { kind: "render"; src: string; alt: string } | { kind: "video"; src: string; poster: string; alt: string } | { kind: "photo"; src: string; alt: string };

function ViewMedia({ view, sizes, priority = false }: { view: View; sizes: string; priority?: boolean }) {
  if (view.kind === "video") return <video className={s.viewVideo} src={view.src} poster={view.poster} muted playsInline loop autoPlay preload="metadata" aria-label={view.alt} />;
  if (view.kind === "photo") return <Image src={view.src} alt={view.alt} fill sizes={sizes} className={s.viewPhoto} />;
  return <Image src={view.src} alt={view.alt} width={1200} height={1200} sizes={sizes} priority={priority} className={s.viewImage} />;
}

function Lightbox({ views, at, onClose, onGo }: { views: View[]; at: number; onClose: () => void; onGo: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const n = views.length;
  const go = useCallback((i: number) => onGo(((i % n) + n) % n), [n, onGo]);

  useEffect(() => {
    lockScroll(true);
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(at + 1);
      if (e.key === "ArrowLeft") go(at - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [at, go, onClose]);

  const view = views[at];
  const down = (e: PointerEvent) => (startX.current = e.clientX);
  const up = (e: PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 48) go(at + (dx < 0 ? 1 : -1));
  };

  return (
    <div ref={ref} className={s.lightbox} role="dialog" aria-modal="true" aria-label="Gallery" tabIndex={-1} data-lenis-prevent>
      <div className={s.lbTop}>
        <span className="tabular">
          {at + 1} / {n}
        </span>
        <button type="button" className={s.lbClose} onClick={onClose} aria-label="Close gallery">
          <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
            <path d="M3 3l10 10M13 3 3 13" />
          </svg>
        </button>
      </div>
      <div className={s.lbStage} onPointerDown={down} onPointerUp={up} data-kind={view.kind}>
        <ViewMedia key={at} view={view} sizes="90vw" />
        {view.kind === "photo" && <span className={s.viewTag}>Campaign</span>}
      </div>
      <button type="button" className={`${s.lbArrow} ${s.lbPrev}`} onClick={() => go(at - 1)} aria-label="Previous view">
        <svg aria-hidden viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 10H4M9 5l-5 5 5 5" />
        </svg>
      </button>
      <button type="button" className={`${s.lbArrow} ${s.lbNext}`} onClick={() => go(at + 1)} aria-label="Next view">
        <svg aria-hidden viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10h12M11 5l5 5-5 5" />
        </svg>
      </button>
      <ul className={s.lbThumbs}>
        {views.map((v, i) => (
          <li key={i}>
            <button type="button" className={s.lbThumb} aria-current={i === at} aria-label={`View ${i + 1}`} onClick={() => go(i)} data-kind={v.kind}>
              <Image src={v.kind === "video" ? v.poster : v.src} alt="" width={120} height={120} sizes="64px" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Gallery({ product, selection }: { product: Product; selection: PieceSelection }) {
  const primary = renderForSelection(product, selection);
  const video = product.video ? videoSrc(product.video) : null;
  const views = useMemo<View[]>(() => {
    const renders = productViews(product).filter((v) => v !== primary);
    const list: View[] = [];
    if (primary) list.push({ kind: "render", src: renderSrc(primary), alt: `${product.name}, ${product.detail}` });
    if (video) list.push({ kind: "video", src: video.mp4, poster: video.poster, alt: `${product.name} turning on the turntable` });
    renders.slice(0, 4).forEach((r) => list.push({ kind: "render", src: renderSrc(r), alt: `${product.name}, another view` }));
    editorial[product.category].single.slice(0, 2).forEach((p) => list.push({ kind: "photo", src: p.src, alt: p.alt }));
    return list;
  }, [product, primary, video]);

  const ground = groundStyle(product.category);
  const rowRef = useRef<HTMLUListElement>(null);
  const [at, setAt] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const total = views.length + (primary ? 0 : 1);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const onScroll = () => setAt(Math.round(row.scrollLeft / Math.max(1, row.clientWidth)));
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => row.removeEventListener("scroll", onScroll);
  }, []);

  const toSimilar = () => document.getElementById("similar")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className={s.gallery}>
      <ul ref={rowRef} className={s.views} aria-label={`${product.name}, views`}>
        {!primary && (
          <li className={`${s.view} ${s.viewWide}`} style={ground}>
            <Placeholder metal={selection.metal} carat={selection.carat} size="stage" className={s.viewPlaceholder} />
          </li>
        )}
        {views.map((v, i) => (
          <li key={`${v.kind}-${v.src}`} className={`${s.view} ${i === 0 && primary ? s.viewWide : ""}`} data-kind={v.kind} style={v.kind === "photo" ? undefined : ground}>
            <button type="button" className={s.viewOpen} onClick={() => setOpen(i)} aria-label={`Open view ${i + 1} of ${views.length} full screen`}>
              <ViewMedia view={v} sizes={i === 0 ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 28vw, 100vw"} priority={i === 0} />
            </button>
            {v.kind === "video" && <span className={s.viewTag}>360 turntable</span>}
            {v.kind === "photo" && <span className={s.viewTag}>Campaign</span>}
            {i === 0 && (
              <button type="button" className={s.similarPill} onClick={toSimilar}>
                <svg aria-hidden viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                  <rect x="2" y="2" width="5" height="5" rx="1" />
                  <rect x="9" y="2" width="5" height="5" rx="1" />
                  <rect x="2" y="9" width="5" height="5" rx="1" />
                  <rect x="9" y="9" width="5" height="5" rx="1" />
                </svg>
                View similar
              </button>
            )}
          </li>
        ))}
      </ul>
      <span className={s.viewCount} aria-hidden>
        {Math.min(at + 1, total)} / {total}
      </span>
      {open !== null && <Lightbox views={views} at={open} onClose={() => setOpen(null)} onGo={setOpen} />}
    </div>
  );
}
