"use client";

/**
 * Signed-in account button in the header: the store's initials in a sky disc
 * and the store name, opening a small menu (Retailer Dashboard, Orders,
 * Wishlist with its count, Log out). Closes on outside click and Escape.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, type DealerSession } from "@/lib/dealer";
import { useOrders } from "@/lib/cart";
import { useWishlist } from "@/components/store/useWishlist";
import { account } from "@/content/site";
import styles from "./chrome.module.css";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export default function AccountMenu({ dealer }: { dealer: DealerSession }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { count } = useWishlist();
  const orders = useOrders();

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

  return (
    <div ref={ref} className={styles.account}>
      <button type="button" className={styles.accountBtn} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className={styles.avatar} aria-hidden>
          {initials(dealer.store)}
        </span>
        <span className={styles.accountName}>{dealer.store}</span>
        <svg aria-hidden viewBox="0 0 10 10" width="10" height="10" className={styles.chevron} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3.75 5 6.75l3-3" />
        </svg>
      </button>
      {open && (
        <div className={styles.accountMenu} role="menu">
          <div className={styles.accountHead}>
            <span className={styles.accountStore}>{dealer.store}</span>
            <span className={styles.accountEmail}>{dealer.email}</span>
            {dealer.demo && <span className={styles.accountDemo}>Preview account</span>}
          </div>
          <Link role="menuitem" href={account.dashboard} className={styles.accountItem} onClick={() => setOpen(false)}>
            Retailer Dashboard
          </Link>
          <Link role="menuitem" href={account.cart} className={styles.accountItem} onClick={() => setOpen(false)}>
            Cart and checkout
          </Link>
          <span role="menuitem" className={`${styles.accountItem} ${styles.accountItemStatic}`}>
            Orders placed <span className={styles.accountCount}>{orders.length}</span>
          </span>
          <span role="menuitem" className={`${styles.accountItem} ${styles.accountItemStatic}`}>
            Wishlist <span className={styles.accountCount}>{count}</span>
          </span>
          <button
            role="menuitem"
            type="button"
            className={`${styles.accountItem} ${styles.accountOut}`}
            onClick={() => {
              signOut();
              setOpen(false);
              router.push("/");
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
