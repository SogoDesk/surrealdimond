"use client";

/**
 * Quick View for a stone (BRD R-15): a drawer from the right with the shape
 * drawn large in plan view and its length and width marked, the grade chips,
 * every attribute in a grid, the certificate and the shipment, then the
 * doors: Add to cart and Request on memo for a signed-in dealer (Log in
 * otherwise), and Grow one like it to order, which opens the M2O request
 * prefilled with this stone (R-19). Previous and next step through the
 * current results. Mechanics come from useDrawer (inert while closed, focus
 * trap, Escape, scroll lock).
 */

import Link from "next/link";
import { useRef, useState } from "react";
import ShapeIcon from "@/components/brand/ShapeIcon";
import { trapTab, useDrawer } from "@/components/shop/useDrawer";
import { SHAPE_LABEL, measurements, shipment, stoneGrade, stoneTitle, type Stone } from "@/content/diamonds";
import { account, brand } from "@/content/site";
import { addStone, useCart } from "@/lib/cart";
import { useDealer } from "@/lib/dealer";
import { requestMemo, useUnavailable } from "@/lib/memo";
import { m2oHref, EMPTY } from "./query";
import s from "./diamonds.module.css";
import { formatUSD, stonePrice } from "@/lib/pricing";

export interface StoneDrawerProps {
  stone: Stone | null;
  open: boolean;
  position: number;
  total: number;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
}

export default function StoneDrawer({ stone, open, position, total, onClose, onStep }: StoneDrawerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const { onKeyDown } = useDrawer({ open, onClose, rootRef, panelRef, backdropRef, axis: "x" });
  const dealer = useDealer();
  const cart = useCart();
  const [memoFor, setMemoFor] = useState<string | null>(null);

  const gone = useUnavailable();
  const inCart = stone ? cart.some((l) => l.stoneId === stone.id) : false;
  const held = stone ? gone.has(stone.id) : false;
  const loginHref = stone ? `${account.login}?next=${encodeURIComponent(`/diamonds?stone=${stone.id}`)}` : account.login;

  const specs: [string, string][] = stone
    ? [
        ["Shape", SHAPE_LABEL[stone.shape]],
        ["Carat", stone.carat.toFixed(2)],
        ["Color", stone.color],
        ["Clarity", stone.clarity],
        ["Cut", stone.cut ?? "N/A"],
        ["Polish", stone.polish],
        ["Symmetry", stone.symmetry],
        ["Fluorescence", stone.fluorescence],
        ["Measurements", measurements(stone)],
        ["Ratio", stone.ratio.toFixed(2)],
        ["Table", `${stone.tablePct.toFixed(1)}%`],
        ["Depth", `${stone.depthPct.toFixed(1)}%`],
        ["Growth", "Lab grown, CVD"],
        ["Stock ID", stone.id],
      ]
    : [];

  return (
    <div ref={rootRef} className={s.drawerRoot} inert={!open} aria-hidden={!open} onKeyDown={onKeyDown} data-lenis-prevent>
      <div ref={backdropRef} className={s.drawerBackdrop} onClick={onClose} />
      <div ref={panelRef} className={s.drawer} role="dialog" aria-modal="true" aria-label={stone ? stoneTitle(stone) : "Stone"} tabIndex={-1} onKeyDown={(e) => trapTab(e, panelRef.current)}>
        {stone && (
          <>
            <header className={s.drawerHead}>
              <span className="tabular">{held ? "No longer available" : `${position + 1} of ${total}`}</span>
              <span className={s.drawerNav}>
                <button type="button" className={s.iconBtn} onClick={() => onStep(-1)} disabled={held || position <= 0} aria-label="Previous stone">
                  <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 3 5 8l5 5" />
                  </svg>
                </button>
                <button type="button" className={s.iconBtn} onClick={() => onStep(1)} disabled={held || position >= total - 1} aria-label="Next stone">
                  <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 3 5 5-5 5" />
                  </svg>
                </button>
                <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close">
                  <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                    <path d="M3 3l10 10M13 3 3 13" />
                  </svg>
                </button>
              </span>
            </header>

            <div className={s.drawerBody}>
              <div className={s.plan}>
                <span className={s.sample}>Sample stone</span>
                <div className={s.planFigure}>
                  <ShapeIcon shape={stone.shape} detail className={s.planIcon} />
                </div>
                <span className={s.planLength}>{stone.length.toFixed(2)} mm</span>
                <span className={s.planWidth}>{stone.width.toFixed(2)} mm</span>
              </div>

              <div className={s.drawerTitleRow}>
                <h2 className={s.drawerTitle}>{stoneTitle(stone)}</h2>
                <p className={s.drawerSub}>
                  Stock {stone.id} · {stone.source === "surreal" ? "Grown by Surreal" : "Supplier stone"}
                </p>
                <div className={s.gradeChips}>
                  <span>{stoneGrade(stone)}</span>
                  {stone.cut && <span>{stone.cut}</span>}
                  <span>
                    {stone.polish === "Excellent" ? "EX" : stone.polish} / {stone.symmetry === "Excellent" ? "EX" : stone.symmetry}
                  </span>
                  <span>Fluor. {stone.fluorescence}</span>
                </div>
              </div>

              <dl className={s.specGrid}>
                {specs.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd className="tabular">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className={s.infoRow}>
                <div className={s.infoCard}>
                  <span className={s.infoLabel}>Certificate</span>
                  <strong className="tabular">
                    {stone.lab} {stone.certificate}
                  </strong>
                  <span>Sample number. Live stones link to the lab report.</span>
                </div>
                <div className={s.infoCard}>
                  <span className={s.infoLabel}>Shipment</span>
                  <strong>{shipment(stone)}</strong>
                  <span>{stone.source === "surreal" ? "For orders placed before 4:00pm EST." : "Shipped by the supplier; timing confirmed with the order."}</span>
                </div>
              </div>

              <div className={s.priceBox}>
                <span>
                  <strong className={dealer ? "tabular" : undefined}>{dealer ? formatUSD(stonePrice(stone)) : "Dealer price"}</strong>
                  {dealer ? "Dealer price" : "Log in to see your price and availability."}
                </span>
                {!dealer && (
                  <Link href={loginHref} className={s.priceLink}>
                    Log in
                  </Link>
                )}
              </div>

              {held && (
                <p className={s.notice} role="status">
                  {memoFor === stone.id ? `Memo requested. The stone is held for ${dealer?.store ?? "your store"} and has left the available list.` : "This stone is on an order or on memo and has left the available list."}{" "}
                  Questions: {brand.office.phone}.
                </p>
              )}

              <div className={s.drawerDoors} hidden={held}>
                {dealer ? (
                  <>
                    <button type="button" className={s.primary} disabled={inCart} onClick={() => addStone(stone.id, stone.carat)}>
                      {inCart ? "In your cart" : "Add to cart"}
                    </button>
                    <button
                      type="button"
                      className={s.secondary}
                      disabled={memoFor === stone.id}
                      onClick={() => {
                        requestMemo(stone.id);
                        setMemoFor(stone.id);
                      }}
                    >
                      Request on memo
                    </button>
                  </>
                ) : (
                  <Link href={loginHref} className={s.primary}>
                    Log in to order
                  </Link>
                )}
              </div>
              <Link href={m2oHref(EMPTY, stone)} className={s.m2oLink}>
                <span>
                  <strong>Grow one like it to order</strong>
                  Made to Order: any shape, any carat weight, with an IGI certificate.
                </span>
                <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
