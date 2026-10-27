"use client";

/**
 * Product gallery, in the Amazon manner: one large view at a time, with
 * every view as a thumbnail in a vertical strip on its left (a row under it
 * on phones). The views: the render in the chosen metal, the turntable, the
 * other renders, and two campaign photographs from the category (tagged
 * Campaign, since they show the collection rather than this exact piece).
 *
 * The stage moves to the next view on its own every few seconds (longer on
 * the turntable), with a progress line on the active thumbnail. It holds
 * while the pointer or focus is on the gallery, while it is off screen or
 * the tab is hidden, and when the visitor presses pause; it never moves with
 * reduced motion. Thumbnails, arrows, swipe and the arrow keys choose a view;
 * the stage opens the full screen viewer. On desktop the gallery stays in
 * view while the buying column scrolls, so the details below are one short
 * scroll away. A View similar pill jumps to the similar designs.
 */

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from "react";
import { useReducedMotion } from "@/hooks/useMedia";
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
    <div ref={ref} className={s.lightbox} role="dialog" aria-modal="true" aria-label="Gallery" tabIndex={-1}>
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

/** How long each view holds before the next, in milliseconds. */
const DWELL = 4500;
const DWELL_VIDEO = 8000;

type Item = View | { kind: "placeholder" };

function Thumb({ item }: { item: Item }) {
  if (item.kind === "placeholder") return <span className={s.thumbPlaceholder} aria-hidden />;
  const src = item.kind === "video" ? item.poster : item.src;
  return <Image src={src} alt="" width={160} height={160} sizes="72px" className={item.kind === "photo" ? s.thumbPhoto : s.thumbImage} />;
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
  const items = useMemo<Item[]>(() => (primary ? views : [{ kind: "placeholder" }, ...views]), [primary, views]);
  const offset = primary ? 0 : 1;
  const n = items.length;

  const ground = groundStyle(product.category);
  const rootRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const [at, setAt] = useState(0);
  const [hold, setHold] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [open, setOpen] = useState<number | null>(null);

  // A new metal or carat changes the first view: start again from it (adjusted during render).
  const [seen, setSeen] = useState(primary);
  if (seen !== primary) {
    setSeen(primary);
    setAt(0);
  }

  const cur = n ? at % n : 0;
  const item = items[cur];
  const dwell = item?.kind === "video" ? DWELL_VIDEO : DWELL;
  const running = !reduced && !hold && !stopped && onScreen && open === null && n > 1;

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setAt((a) => (a + 1) % n), dwell);
    return () => window.clearTimeout(id);
  }, [running, cur, dwell, n]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let inView = true;
    const sync = () => setOnScreen(inView && document.visibilityState === "visible");
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const go = (i: number) => setAt(((i % n) + n) % n);
  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      go(cur + 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      go(cur - 1);
    }
  };
  const down = (e: PointerEvent) => (startX.current = e.clientX);
  const up = (e: PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
  };
  const toSimilar = () => document.getElementById("similar")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div
      ref={rootRef}
      className={s.gallery}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setHold(false)}
    >
      <ul className={s.thumbs} aria-label={`${product.name}, views`} onKeyDown={onKey}>
        {items.map((it, i) => (
          <li key={it.kind === "placeholder" ? "placeholder" : `${it.kind}-${it.src}`}>
            <button
              type="button"
              className={s.thumb}
              aria-current={i === cur ? "true" : undefined}
              aria-label={`View ${i + 1} of ${n}${it.kind === "video" ? ", 360 turntable" : it.kind === "photo" ? ", campaign photograph" : ""}`}
              onClick={() => go(i)}
              onMouseEnter={() => go(i)}
              data-kind={it.kind}
              style={it.kind === "photo" ? undefined : ground}
            >
              <Thumb item={it} />
              {it.kind === "video" && (
                <span className={s.thumbPlay} aria-hidden>
                  <svg viewBox="0 0 12 12" width="10" height="10">
                    <path d="M3.5 2.2v7.6L9.8 6Z" fill="currentColor" />
                  </svg>
                </span>
              )}
              {i === cur && running && <span key={`${cur}-${dwell}`} className={s.thumbProgress} style={{ animationDuration: `${dwell}ms` }} aria-hidden />}
            </button>
          </li>
        ))}
      </ul>

      <div className={s.stage} data-kind={item?.kind} style={item?.kind === "photo" ? undefined : ground} onPointerDown={down} onPointerUp={up} aria-live={running ? "off" : "polite"}>
        {item?.kind === "placeholder" ? (
          <Placeholder metal={selection.metal} carat={selection.carat} size="stage" className={s.viewPlaceholder} />
        ) : (
          item && (
            <button type="button" className={s.viewOpen} onClick={() => setOpen(cur - offset)} aria-label={`Open view ${cur + 1} of ${n} full screen`}>
              <span key={cur} className={s.stageMedia}>
                <ViewMedia view={item} sizes="(min-width: 1024px) 50vw, 100vw" priority={cur === 0} />
              </span>
            </button>
          )
        )}
        {item?.kind === "video" && <span className={s.viewTag}>360 turntable</span>}
        {item?.kind === "photo" && <span className={s.viewTag}>Campaign</span>}

        {n > 1 && (
          <>
            <button type="button" className={`${s.stageArrow} ${s.stagePrev}`} onClick={() => go(cur - 1)} aria-label="Previous view">
              <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.5 4 6.5 10l6 6" />
              </svg>
            </button>
            <button type="button" className={`${s.stageArrow} ${s.stageNext}`} onClick={() => go(cur + 1)} aria-label="Next view">
              <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7.5 4 6 6-6 6" />
              </svg>
            </button>
          </>
        )}

        <div className={s.stageFoot}>
          <span className={`${s.stageCount} tabular`}>
            {cur + 1} / {n}
          </span>
          {n > 1 && !reduced && (
            <button type="button" className={s.stagePause} onClick={() => setStopped((v) => !v)} aria-label={stopped ? "Play the views" : "Pause the views"} aria-pressed={stopped}>
              {stopped ? (
                <svg aria-hidden viewBox="0 0 12 12" width="10" height="10">
                  <path d="M3.5 2.2v7.6L9.8 6Z" fill="currentColor" />
                </svg>
              ) : (
                <svg aria-hidden viewBox="0 0 12 12" width="10" height="10">
                  <path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" />
                </svg>
              )}
            </button>
          )}
          <button type="button" className={s.similarPill} onClick={toSimilar}>
            <svg aria-hidden viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <rect x="2" y="2" width="5" height="5" rx="1" />
              <rect x="9" y="2" width="5" height="5" rx="1" />
              <rect x="2" y="9" width="5" height="5" rx="1" />
              <rect x="9" y="9" width="5" height="5" rx="1" />
            </svg>
            View similar
          </button>
        </div>
      </div>

      {open !== null && open >= 0 && <Lightbox views={views} at={open} onClose={() => setOpen(null)} onGo={setOpen} />}
    </div>
  );
}
