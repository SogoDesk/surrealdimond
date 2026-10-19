"use client";

/**
 * Store card, compact enough for five across (docs/CONTEXT.md, "Listing").
 * A square white well with the render; the 360 badge when the piece has a
 * turntable; a wishlist heart. Hover crossfades to the second view (or plays
 * the turntable) and raises a View details bar. Beneath: name, design line,
 * then the card's own selectors: swatches for only the metals the piece
 * exists in (BRD R-12, B-02) and carat chips. A carat size without a render
 * shows the made to order placeholder.
 * Clicking the well or the name opens Quick View through onQuickView, with
 * the card's metal and carat; a modified click (new tab, new window) still
 * follows the link to the product page.
 */

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import { caratOptions, formatCarat, metals, productHref, productMetals, renderSrc, videoSrc, type Metal, type Product } from "@/content/catalog";
import { isTouchDevice, prefersReducedMotion } from "@/hooks/useMedia";
import { defaultSelection, renderForSelection, type PieceSelection } from "@/components/shop/filters";
import Placeholder from "@/components/shop/Placeholder";
import { account } from "@/content/site";
import { groundStyle } from "@/content/grounds";
import { useWishlist } from "./useWishlist";
import { useDealer } from "@/lib/dealer";
import { addToCart } from "@/lib/cart";
import s from "./store.module.css";
import { formatUSD, jewelryPrice } from "@/lib/pricing";

const SIZES = "(min-width: 1600px) 16vw, (min-width: 1280px) 19vw, (min-width: 1024px) 24vw, (min-width: 768px) 31vw, 46vw";

export default function StoreCard({ product, preferredMetal, priority = false, onQuickView }: { product: Product; preferredMetal: Metal | null; priority?: boolean; onQuickView?: (product: Product, selection: PieceSelection) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [pick, setPick] = useState<PieceSelection | null>(null);
  const [hover, setHover] = useState(false);
  const { has, toggle } = useWishlist();
  const dealer = useDealer();

  // A newly filtered metal takes over a picked card's metal (adjusted during render).
  const [seenPreferred, setSeenPreferred] = useState(preferredMetal);
  if (seenPreferred !== preferredMetal) {
    setSeenPreferred(preferredMetal);
    if (preferredMetal && pick && pick.metal !== preferredMetal && productMetals(product).includes(preferredMetal)) setPick({ ...pick, metal: preferredMetal });
  }
  const selection = pick ?? defaultSelection(product, preferredMetal);
  const ownMetals = productMetals(product);
  const slug = renderForSelection(product, selection);
  const alt = product.angles?.[0] ?? null;
  const video = product.video ? videoSrc(product.video) : null;
  const saved = has(product.id);
  const href = `${productHref(product)}?metal=${selection.metal}&ct=${selection.carat}`;

  const enter = () => {
    if (isTouchDevice() || prefersReducedMotion() || !slug) return;
    setHover(true);
    const v = videoRef.current;
    if (video && v) {
      if (!v.src) {
        v.src = video.mp4;
        v.load();
      }
      v.play().catch(() => undefined);
    }
  };
  const leave = () => {
    setHover(false);
    const v = videoRef.current;
    if (v && v.src) {
      v.pause();
      v.currentTime = 0;
    }
  };

  const quick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!onQuickView || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onQuickView(product, selection);
  };

  const select = (patch: Partial<PieceSelection>) => setPick((prev) => ({ ...(prev ?? defaultSelection(product, preferredMetal)), ...patch }));

  return (
    <article className={s.card} data-hover={hover ? (video ? "video" : alt ? "angle" : "lift") : undefined} onPointerEnter={enter} onPointerLeave={leave}>
      <div className={s.well} style={groundStyle(product.category)}>
        <Link href={href} className={s.wellLink} aria-label={`Quick view: ${product.name}, ${product.detail}`} aria-haspopup="dialog" onClick={quick}>
          {slug ? (
            <Image key={slug} src={renderSrc(slug)} alt="" width={800} height={800} sizes={SIZES} priority={priority} className={`${s.render} ${s.renderBase}`} />
          ) : (
            <Placeholder metal={selection.metal} carat={selection.carat} className={s.placeholder} />
          )}
          {slug && alt && !video && <Image src={renderSrc(alt)} alt="" width={800} height={800} sizes={SIZES} loading="lazy" className={`${s.render} ${s.renderAlt}`} />}
          {slug && video && <video ref={videoRef} className={s.video} poster={video.poster} muted playsInline loop preload="none" aria-hidden tabIndex={-1} />}
          <span className={s.viewBar} aria-hidden>
            Quick view
            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </span>
        </Link>
        {video && <span className={s.badge}>360</span>}
        <button type="button" className={s.heart} aria-pressed={saved} aria-label={saved ? `Remove ${product.name} from your wishlist` : `Save ${product.name} to your wishlist`} onClick={() => toggle(product.id)}>
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
            <path d="M10 16.5s-6.5-3.9-6.5-8.6A3.6 3.6 0 0 1 10 5.6a3.6 3.6 0 0 1 6.5 2.3c0 4.7-6.5 8.6-6.5 8.6Z" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className={s.meta}>
        <Link href={href} className={s.name} aria-haspopup="dialog" onClick={quick}>
          {product.name}
        </Link>
        <span className={s.detail}>{product.detail}</span>
        {dealer ? (
          <span className={s.priceRow}>
          <span className={`${s.priceFigure} tabular`}>{formatUSD(jewelryPrice(product, selection.metal, selection.carat))}</span>
          <button type="button" className={s.price} onClick={() => addToCart({ productId: product.id, metal: selection.metal, carat: selection.carat, size: null, qty: 1, note: "" })}>
            <svg aria-hidden viewBox="0 0 18 18" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 5.5h13l-.9 10.5H3.4z" />
              <path d="M6 5.5V4.8a3 3 0 0 1 6 0v.7" />
            </svg>
            Add to cart
          </button>
          </span>
        ) : (
          <Link href={account.login} className={s.price}>
            <svg aria-hidden viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="6" width="9" height="6.5" rx="1" />
              <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
            </svg>
            Log in for dealer price
          </Link>
        )}
      </div>

      <div className={s.selectors}>
        <div className={s.swatches} role="group" aria-label={`Metal for ${product.name}`}>
          {metals
            .filter((m) => ownMetals.includes(m.id))
            .map((m) => (
              <button
                key={m.id}
                type="button"
                className={s.swatch}
                style={{ background: m.swatch }}
                aria-pressed={selection.metal === m.id}
                aria-label={m.label}
                title={m.label}
                onClick={() => select({ metal: m.id })}
              />
            ))}
        </div>
        <div className={s.carats} role="group" aria-label={`Carat for ${product.name}`}>
          {caratOptions[product.category].map((ct) => (
            <button key={ct} type="button" className={s.carat} aria-pressed={selection.carat === ct} onClick={() => select({ carat: ct })}>
              {formatCarat(ct)}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
