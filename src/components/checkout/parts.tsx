"use client";

/**
 * Pieces shared by the cart and checkout: the five step bar (Cart, Store
 * details, Payment, Review, Confirmation, the live site's steps with
 * Payment added), a cart line, and the order summary. The summary states
 * what the preview can state (pieces, designs, total carat weight,
 * delivery) and, following the dealer site's Prices Policy, that prices are
 * confirmed when Surreal accepts the order.
 */

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatCarat, metals, productById, productHref, renderSrc, styleRef } from "@/content/catalog";
import { RING_SIZES, SIZED_CATEGORIES, beforeCutoff, caratTotal, pieceCount, removeLine, setNote, setQty, setSize, type CartLine } from "@/lib/cart";
import { useWishlist } from "@/components/store/useWishlist";
import s from "./checkout.module.css";

export const STEPS = ["Cart", "Store details", "Payment", "Review", "Confirmation"] as const;

export function Steps({ at }: { at: number }) {
  return (
    <ol className={s.steps} aria-label="Checkout steps">
      {STEPS.map((label, i) => (
        <li key={label} className={s.step} data-state={i < at ? "done" : i === at ? "now" : undefined} aria-current={i === at ? "step" : undefined}>
          <span className={s.stepDot} aria-hidden>
            {i < at ? (
              <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 6.5 5 9l4.5-6" />
              </svg>
            ) : (
              i + 1
            )}
          </span>
          <span className={s.stepLabel}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

export function LineItem({ line, editable = true }: { line: CartLine; editable?: boolean }) {
  const p = productById(line.productId);
  const { has, toggle } = useWishlist();
  if (!p) return null;
  const metal = metals.find((m) => m.id === line.metal);
  const ref = styleRef(p);
  const sized = SIZED_CATEGORIES.has(p.category);
  const image = p.variants?.[line.metal] ?? p.image;
  const href = `${productHref(p)}?metal=${line.metal}&ct=${line.carat}`;

  return (
    <article className={s.line} data-compact={editable ? undefined : "true"}>
      <Link href={href} className={s.lineThumb} aria-label={p.name}>
        <Image src={renderSrc(image)} alt="" width={300} height={300} sizes="120px" />
      </Link>
      <div className={s.lineBody}>
        <div className={s.lineTop}>
          <div className={s.lineTitle}>
            <Link href={href} className={s.lineName}>
              {p.name}
            </Link>
            <span className={s.lineDetail}>
              {p.detail}
              {ref ? ` · Ref. ${ref}` : ""}
            </span>
          </div>
          <span className={s.linePrice}>
            <span>Dealer price</span>
            On confirmation
          </span>
        </div>
        <div className={s.lineSpecs}>
          <span className={s.specChip}>
            <span className={s.swatch} style={{ background: metal?.swatch }} aria-hidden />
            {metal?.label}
          </span>
          <span className={s.specChip}>{formatCarat(line.carat)}</span>
          {sized &&
            (editable ? (
              <label className={s.specChip}>
                <span className={s.srOnly}>Ring size</span>
                <select className={s.sizeSelect} value={line.size ?? ""} onChange={(e) => setSize(line.key, e.target.value || null)} aria-invalid={!line.size}>
                  <option value="">Choose ring size</option>
                  {RING_SIZES.map((x) => (
                    <option key={x} value={x}>
                      Size US {x}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className={s.specChip}>{line.size ? `Size US ${line.size}` : "Size to confirm"}</span>
            ))}
          {!editable && <span className={s.specChip}>Qty {line.qty}</span>}
        </div>
        {editable ? (
          <div className={s.lineActions}>
            <span className={s.stepper} role="group" aria-label={`Quantity of ${p.name}`}>
              <button type="button" onClick={() => setQty(line.key, line.qty - 1)} disabled={line.qty <= 1} aria-label="One fewer">
                −
              </button>
              <span className="tabular">{line.qty}</span>
              <button type="button" onClick={() => setQty(line.key, line.qty + 1)} aria-label="One more">
                +
              </button>
            </span>
            <input className={s.noteInput} value={line.note} placeholder="Add a note for this piece" onChange={(e) => setNote(line.key, e.target.value)} aria-label={`Note for ${p.name}`} />
            <span className={s.lineLinks}>
              <button type="button" className={s.textBtn} onClick={() => toggle(p.id)}>
                {has(p.id) ? "Saved to wishlist" : "Save to wishlist"}
              </button>
              <button type="button" className={s.textBtn} onClick={() => removeLine(line.key)}>
                Remove
              </button>
            </span>
          </div>
        ) : (
          line.note && <p className={s.lineNote}>Note: {line.note}</p>
        )}
      </div>
    </article>
  );
}

export function Summary({ lines, children, compact = false }: { lines: CartLine[]; children?: ReactNode; compact?: boolean }) {
  const pieces = pieceCount(lines);
  const nextDay = beforeCutoff();
  return (
    <aside className={s.summary} aria-label="Order summary">
      <p className={s.summaryTitle}>Order summary</p>
      {compact && (
        <ul className={s.summaryLines}>
          {lines.map((l) => {
            const p = productById(l.productId);
            if (!p) return null;
            return (
              <li key={l.key}>
                <span className={s.summaryThumb}>
                  <Image src={renderSrc(p.variants?.[l.metal] ?? p.image)} alt="" width={96} height={96} sizes="44px" />
                  <span className={s.summaryQty}>{l.qty}</span>
                </span>
                <span className={s.summaryName}>
                  {p.name}
                  <span>
                    {metals.find((m) => m.id === l.metal)?.label}, {formatCarat(l.carat)}
                    {l.size ? `, size ${l.size}` : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <dl className={s.summaryRows}>
        <div>
          <dt>Pieces</dt>
          <dd className="tabular">{pieces}</dd>
        </div>
        <div>
          <dt>Designs</dt>
          <dd className="tabular">{lines.length}</dd>
        </div>
        <div>
          <dt>Total carat weight</dt>
          <dd className="tabular">{formatCarat(caratTotal(lines))}</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>{nextDay ? "Next day" : "After the 4:00pm EST cutoff"}</dd>
        </div>
        <div className={s.summaryTotal}>
          <dt>Order total</dt>
          <dd>On confirmation</dd>
        </div>
      </dl>
      <p className={s.summaryNote}>
        Dealer prices come from your price list and are confirmed when Surreal accepts your order, as set out in the{" "}
        <Link href="/terms">Prices Policy</Link>.
      </p>
      {children}
    </aside>
  );
}

export function TrustRow() {
  const items = [
    { t: "Grown by Surreal", l: "The largest CVD grower", d: <path d="M7 4h10l4 5-9 11L3 9Z M3 9h18" /> },
    { t: "Next day delivery", l: "For orders before 4:00pm EST", d: <path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7" /> },
    { t: "Certificates", l: "Provided on request", d: <path d="M4 3.5h16v12H4zM8 8h8M8 11h5M9 15.5l-1 5 4-2 4 2-1-5" /> },
  ];
  return (
    <ul className={s.trust}>
      {items.map((i) => (
        <li key={i.t}>
          <span className={s.trustIcon} aria-hidden>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              {i.d}
            </svg>
          </span>
          <span>
            <strong>{i.t}</strong>
            {i.l}
          </span>
        </li>
      ))}
    </ul>
  );
}
