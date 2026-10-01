"use client";

/**
 * Quick View for the store (the earlier collection's quick view, rebuilt on
 * the current product page). Clicking a card's image or name opens it as a
 * drawer from the right (a full sheet on phones), starting from the card's
 * metal and carat; the page stays where it was and the URL does not change.
 *
 * Inside: the views (the render in the chosen metal, the turntable, other
 * angles) with thumbnails; the category, name, design line and reference;
 * the dealer price box; metal (only the metals the piece exists in, BRD
 * R-12), total carat weight, ring size for rings, quantity; Add to cart for
 * a signed-in dealer (Log in to add to cart otherwise) and the wishlist
 * heart; the next day delivery countdown and three facts; and View full
 * details, which opens the product page with the same metal and carat.
 * Previous and next step through the store's current results. Mechanics
 * from useDrawer: inert while closed, focus held inside, Escape closes, the
 * page scroll locked while open.
 *
 * The drawer renders into document.body (a portal): inside the store's
 * sections it would sit in their stacking context, under the site header.
 */

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { defaultSelection, renderForSelection, type PieceSelection } from "@/components/shop/filters";
import Placeholder from "@/components/shop/Placeholder";
import { trapTab, useDrawer } from "@/components/shop/useDrawer";
import DeliveryCountdown from "@/components/product/DeliveryCountdown";
import { caratOptions, categoryLabel, formatCarat, metals, productHref, productMetals, productViews, renderSrc, styleRef, videoSrc, type Product } from "@/content/catalog";
import { groundStyle } from "@/content/grounds";
import { account } from "@/content/site";
import { addToCart, RING_SIZES, SIZED_CATEGORIES } from "@/lib/cart";
import { useDealer } from "@/lib/dealer";
import { useWishlist } from "./useWishlist";
import s from "./quickview.module.css";

export interface QuickViewProps {
  product: Product | null;
  /** The card's selection when it was opened. */
  selection: PieceSelection | null;
  /** Counts openings, so the body starts afresh each time. */
  opening: number;
  open: boolean;
  position: number;
  total: number;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
}

const noop = () => () => {};

export default function QuickView(props: QuickViewProps) {
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  return mounted ? createPortal(<Drawer {...props} />, document.body) : null;
}

function Drawer({ product, selection, opening, open, position, total, onClose, onStep }: QuickViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const { onKeyDown } = useDrawer({ open, onClose, rootRef, panelRef, backdropRef, axis: "x" });

  return (
    <div ref={rootRef} className={s.root} inert={!open} aria-hidden={!open} onKeyDown={onKeyDown} data-lenis-prevent>
      <div ref={backdropRef} className={s.backdrop} onClick={onClose} />
      <div ref={panelRef} className={s.panel} role="dialog" aria-modal="true" aria-label={product ? `Quick view: ${product.name}` : "Quick view"} tabIndex={-1} onKeyDown={(e) => trapTab(e, panelRef.current)}>
        <header className={s.head}>
          <span className={s.headLabel}>
            Quick view
            {product && total > 0 && (
              <span className="tabular">
                {position + 1} of {total}
              </span>
            )}
          </span>
          <span className={s.headNav}>
            <button type="button" className={s.iconBtn} onClick={() => onStep(-1)} disabled={position <= 0} aria-label="Previous piece">
              <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 3 5 8l5 5" />
              </svg>
            </button>
            <button type="button" className={s.iconBtn} onClick={() => onStep(1)} disabled={position >= total - 1} aria-label="Next piece">
              <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 3 5 5-5 5" />
              </svg>
            </button>
            <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close">
              <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <path d="M3 3l10 10M13 3 3 13" />
              </svg>
            </button>
          </span>
        </header>
        {product && <Body key={`${product.id}-${opening}`} product={product} initial={selection ?? defaultSelection(product, null)} onClose={onClose} />}
      </div>
    </div>
  );
}

type View = { kind: "render"; slug: string } | { kind: "video"; mp4: string; poster: string };

function Body({ product, initial, onClose }: { product: Product; initial: PieceSelection; onClose: () => void }) {
  const dealer = useDealer();
  const { has, toggle } = useWishlist();
  const [selection, setSelection] = useState(initial);
  const [size, setSize] = useState("6.5");
  const [qty, setQty] = useState(1);
  const [at, setAt] = useState(0);
  const [added, setAdded] = useState(false);

  const sized = SIZED_CATEGORIES.has(product.category);
  const primary = renderForSelection(product, selection);
  const video = product.video ? videoSrc(product.video) : null;
  const views: View[] = [
    ...(primary ? [{ kind: "render" as const, slug: primary }] : []),
    ...(video ? [{ kind: "video" as const, mp4: video.mp4, poster: video.poster }] : []),
    ...productViews(product)
      .filter((v) => v !== primary && !Object.values(product.variants ?? {}).includes(v))
      .slice(0, 3)
      .map((slug) => ({ kind: "render" as const, slug })),
  ];
  const cur = Math.min(at, Math.max(0, views.length - 1));
  const view = views[cur];
  const ground = groundStyle(product.category);
  const ref = styleRef(product);
  const ownMetals = productMetals(product);
  const metalLabel = metals.find((m) => m.id === selection.metal)?.label ?? "";
  const full = `${productHref(product)}?metal=${selection.metal}&ct=${selection.carat}`;
  const loginHref = `${account.login}?next=${encodeURIComponent(full)}`;
  const saved = has(product.id);

  const choose = (patch: Partial<PieceSelection>) => {
    setSelection((prev) => ({ ...prev, ...patch }));
    setAt(0);
    setAdded(false);
  };
  const add = () => {
    addToCart({ productId: product.id, metal: selection.metal, carat: selection.carat, size: sized ? size : null, qty, note: "" });
    setAdded(true);
  };

  return (
    <div className={s.body}>
      <div className={s.gallery}>
        <div className={s.stage} style={ground}>
          {!view ? (
            <Placeholder metal={selection.metal} carat={selection.carat} size="stage" className={s.placeholder} />
          ) : view.kind === "video" ? (
            <video key={view.mp4} className={s.media} src={view.mp4} poster={view.poster} muted playsInline loop autoPlay preload="metadata" aria-label={`${product.name} turning on the turntable`} />
          ) : (
            <Image key={view.slug} src={renderSrc(view.slug)} alt={`${product.name}, ${product.detail}`} width={900} height={900} sizes="(min-width: 640px) 520px, 100vw" className={s.media} />
          )}
          {view?.kind === "video" && <span className={s.tag}>360 turntable</span>}
          <button type="button" className={s.heart} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} onClick={() => toggle(product.id)}>
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
              <path d="M10 16.5s-6.5-3.9-6.5-8.6A3.6 3.6 0 0 1 10 5.6a3.6 3.6 0 0 1 6.5 2.3c0 4.7-6.5 8.6-6.5 8.6Z" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {views.length > 1 && (
          <ul className={s.thumbs} aria-label="Views">
            {views.map((v, i) => (
              <li key={v.kind === "video" ? "video" : v.slug}>
                <button type="button" className={s.thumb} style={ground} aria-current={i === cur ? "true" : undefined} aria-label={v.kind === "video" ? "360 turntable" : `View ${i + 1}`} onClick={() => setAt(i)}>
                  <Image src={v.kind === "video" ? v.poster : renderSrc(v.slug)} alt="" width={140} height={140} sizes="64px" />
                  {v.kind === "video" && <span className={s.play} aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={s.titleBlock}>
        <p className={s.kicker}>{categoryLabel(product.category)}</p>
        <h2 className={s.name}>{product.name}</h2>
        <p className={s.detail}>{product.detail}</p>
        {ref && <p className={`${s.ref} tabular`}>Ref. {ref}</p>}
      </div>

      <div className={s.priceBox}>
        {dealer ? (
          <span>
            <strong>On your dealer price list</strong>
            Confirmed for {dealer.store} when Surreal accepts your order.
          </span>
        ) : (
          <>
            <span>
              <strong>Dealer price</strong>
              Log in to see your price and availability.
            </span>
            <Link href={loginHref} className={s.priceLink} onClick={onClose}>
              Log in
            </Link>
          </>
        )}
      </div>

      <div className={s.field}>
        <p className={s.label}>
          Metal <span>{metalLabel}</span>
        </p>
        <div className={s.row}>
          {metals
            .filter((m) => ownMetals.includes(m.id))
            .map((m) => (
              <button key={m.id} type="button" className={s.metal} aria-pressed={selection.metal === m.id} onClick={() => choose({ metal: m.id })}>
                <span className={s.dot} style={{ background: m.swatch }} aria-hidden />
                {m.label}
              </button>
            ))}
        </div>
      </div>

      <div className={s.field}>
        <p className={s.label}>
          Total carat weight <span>{formatCarat(selection.carat)}</span>
        </p>
        <div className={s.row}>
          {caratOptions[product.category].map((ct) => (
            <button key={ct} type="button" className={s.chip} aria-pressed={selection.carat === ct} onClick={() => choose({ carat: ct })}>
              {formatCarat(ct)}
            </button>
          ))}
        </div>
      </div>

      <div className={s.fieldRow}>
        {sized && (
          <label className={s.field}>
            <span className={s.label}>Ring size</span>
            <select className={s.select} value={size} onChange={(e) => setSize(e.target.value)}>
              {RING_SIZES.map((x) => (
                <option key={x} value={x}>
                  US {x}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className={s.field}>
          <span className={s.label} id={`qv-qty-${product.id}`}>
            Quantity
          </span>
          <span className={s.stepper} role="group" aria-labelledby={`qv-qty-${product.id}`}>
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="One fewer">
              −
            </button>
            <span className="tabular" aria-live="polite">
              {qty}
            </span>
            <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="One more">
              +
            </button>
          </span>
        </div>
      </div>

      <div className={s.doors}>
        {dealer ? (
          <button type="button" className={s.primary} onClick={add}>
            {added ? "Added to cart" : "Add to cart"}
          </button>
        ) : (
          <Link href={loginHref} className={s.primary} onClick={onClose}>
            Log in to add to cart
          </Link>
        )}
        <Link href={full} className={s.secondary} onClick={onClose}>
          View full details
          <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </Link>
      </div>
      {added && (
        <p className={s.notice} role="status">
          {product.name}, {metalLabel.toLowerCase()}, {formatCarat(selection.carat)}
          {sized ? `, size ${size}` : ""}, qty {qty} is in your cart.{" "}
          <Link href={account.cart} onClick={onClose}>
            Review the cart
          </Link>
        </p>
      )}

      <DeliveryCountdown />
      <ul className={s.facts}>
        <li>
          <strong>Grown by Surreal</strong>, the largest CVD grower
        </li>
        <li>
          <strong>Available in</strong> {metals.filter((m) => ownMetals.includes(m.id)).map((m) => m.label.toLowerCase()).join(", ")}
        </li>
        <li>
          <strong>Made to order</strong> in other carat weights and sizes
        </li>
      </ul>
    </div>
  );
}
