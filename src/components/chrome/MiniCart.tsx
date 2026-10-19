"use client";

/**
 * The cart button and mini cart (after Tanishq's mini cart). Signed out, the
 * bag links to /cart, which asks the visitor to log in. Signed in, the bag
 * shows the piece count and opens a popover: "Your cart (n pieces)", each
 * line with its render, metal, carat, size and quantity, the totals the
 * preview can state (pieces, total carat weight), and View cart and
 * Checkout. It also opens by itself for four seconds when a piece is added.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatCarat, metals, productById, renderSrc } from "@/content/catalog";
import { CART_ADDED, caratTotal, pieceCount, removeLine, useCart } from "@/lib/cart";
import { useDealer } from "@/lib/dealer";
import { account } from "@/content/site";
import { groundStyle } from "@/content/grounds";
import { stoneById, stoneGrade, stoneTitle } from "@/content/diamonds";
import ShapeIcon from "@/components/brand/ShapeIcon";
import styles from "./chrome.module.css";
import { formatUSD, linePrice, linesTotal } from "@/lib/pricing";

function BagIcon() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 5.5h13l-.9 10.5H3.4z" />
      <path d="M6 5.5V4.8a3 3 0 0 1 6 0v.7" />
    </svg>
  );
}

export default function MiniCart() {
  const dealer = useDealer();
  const lines = useCart();
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const count = dealer ? pieceCount(lines) : 0;

  useEffect(() => {
    const onAdded = (e: Event) => {
      setFlash((e as CustomEvent<string>).detail);
      setOpen(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOpen(false), 4000);
    };
    window.addEventListener(CART_ADDED, onAdded);
    return () => {
      window.removeEventListener(CART_ADDED, onAdded);
      window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!dealer) {
    return (
      <Link href={account.cart} className={`${styles.bag} ${styles.iconLink}`} aria-label="Cart">
        <BagIcon />
        <span className={styles.count} aria-hidden>
          0
        </span>
      </Link>
    );
  }

  return (
    <div ref={ref} className={styles.miniWrap} onPointerEnter={() => window.clearTimeout(timer.current)}>
      <button type="button" className={`${styles.bag} ${styles.iconLink}`} aria-haspopup="dialog" aria-expanded={open} aria-label={`Cart, ${count} ${count === 1 ? "piece" : "pieces"}`} onClick={() => setOpen((o) => !o)}>
        <BagIcon />
        <span key={count} className={`${styles.count} ${count ? styles.countOn : ""}`} aria-hidden>
          {count}
        </span>
      </button>
      {open && (
        <div className={styles.mini} role="dialog" aria-label="Your cart">
          <div className={styles.miniHead}>
            <span className={styles.miniTitle}>
              Your cart <span>({count} {count === 1 ? "piece" : "pieces"})</span>
            </span>
            <button type="button" className={styles.miniClose} onClick={() => setOpen(false)} aria-label="Close cart">
              <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                <path d="M3 3l10 10M13 3 3 13" />
              </svg>
            </button>
          </div>
          {lines.length === 0 ? (
            <div className={styles.miniEmpty}>
              <p>Your cart is empty.</p>
              <Link href="/jewelry" className={styles.miniPrimary} onClick={() => setOpen(false)}>
                Browse jewelry
              </Link>
            </div>
          ) : (
            <>
              <ul className={styles.miniLines} data-lenis-prevent>
                {lines.map((l) => {
                  const st = l.stoneId ? stoneById(l.stoneId) : undefined;
                  if (st)
                    return (
                      <li key={l.key} className={styles.miniLine} data-flash={flash === l.key ? "true" : undefined}>
                        <span className={`${styles.miniThumb} ${styles.miniStone}`}>
                          <ShapeIcon shape={st.shape} detail className={styles.miniStoneIcon} />
                        </span>
                        <span className={styles.miniText}>
                          <span className={styles.miniName}>{stoneTitle(st)}</span>
                          <span className={styles.miniMeta}>
                            {stoneGrade(st)}, {st.lab}
                          </span>
                          <span className={styles.miniMeta}>Stock {st.id}</span>
                        </span>
                        <button type="button" className={styles.miniRemove} onClick={() => removeLine(l.key)} aria-label={`Remove ${stoneTitle(st)}`}>
                          <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                            <path d="M3 3l10 10M13 3 3 13" />
                          </svg>
                        </button>
                      </li>
                    );
                  const p = productById(l.productId);
                  if (!p) return null;
                  const metal = metals.find((m) => m.id === l.metal)?.label;
                  return (
                    <li key={l.key} className={styles.miniLine} data-flash={flash === l.key ? "true" : undefined}>
                      <span className={styles.miniThumb} style={groundStyle(p.category)}>
                        <Image src={renderSrc(p.variants?.[l.metal] ?? p.image)} alt="" width={120} height={120} sizes="56px" />
                      </span>
                      <span className={styles.miniText}>
                        <span className={styles.miniName}>{p.name}</span>
                        <span className={styles.miniMeta}>
                          {metal}, {formatCarat(l.carat)}
                          {l.size ? `, size ${l.size}` : ""}
                        </span>
                        <span className={styles.miniMeta}>
                          Qty {l.qty}, <span className="tabular">{formatUSD(linePrice(l) ?? 0)}</span>
                        </span>
                      </span>
                      <button type="button" className={styles.miniRemove} onClick={() => removeLine(l.key)} aria-label={`Remove ${p.name}`}>
                        <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                          <path d="M3 3l10 10M13 3 3 13" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className={styles.miniTotals}>
                <span>Total carat weight</span>
                <span className="tabular">{formatCarat(caratTotal(lines))}</span>
              </div>
              <div className={styles.miniTotals}>
                <span>Subtotal</span>
                <span className="tabular">{formatUSD(linesTotal(lines))}</span>
              </div>
              <div className={styles.miniDoors}>
                <Link href={account.cart} className={styles.miniSecondary} onClick={() => setOpen(false)}>
                  View cart
                </Link>
                <Link href="/checkout" className={styles.miniPrimary} onClick={() => setOpen(false)}>
                  Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
