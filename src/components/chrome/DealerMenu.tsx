"use client";

/**
 * Dealer Options, signed in (client change request, November 2026): one
 * pill in the header opening a short menu, trimmed to Orders, Invoices and
 * payments (account owners only, as in the dashboard), Open memo items,
 * Account settings and Log out. The Retailer Dashboard is its own button
 * beside it. Closes on outside click, Escape and choosing an item.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { dashSection } from "@/content/dashboard";
import { canSeeBilling } from "@/lib/invoices";
import { signOut, type DealerSession } from "@/lib/dealer";
import styles from "./chrome.module.css";

const ITEMS = ["orders", "invoices", "memo", "account"] as const;

export default function DealerMenu({ dealer }: { dealer: DealerSession }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const items = ITEMS.map((id) => dashSection(id)).filter((d) => d && (!d.billing || canSeeBilling(dealer)));

  return (
    <div ref={ref} className={styles.dealerMenu}>
      <button type="button" className={styles.dashPill} aria-label="Dealer Options" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg aria-hidden viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
          <circle cx="9" cy="6.25" r="3.25" />
          <path d="M2.75 16c.8-3.1 3.2-4.75 6.25-4.75S14.45 12.9 15.25 16" />
        </svg>
        <span>Dealer Options</span>
        <svg aria-hidden viewBox="0 0 10 10" className={styles.chevron} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3.75 5 6.75l3-3" />
        </svg>
      </button>
      {open && (
        <div className={styles.dealerPanel} role="menu" aria-label="Dealer Options">
          <div className={styles.dealerHead}>
            <span className={styles.dealerStore}>{dealer.store}</span>
            <span className={styles.dealerEmail}>{dealer.email}</span>
          </div>
          {items.map(
            (d) =>
              d && (
                <Link key={d.id} role="menuitem" href={d.href} className={styles.dealerItem} onClick={() => setOpen(false)}>
                  {d.label}
                </Link>
              ),
          )}
          <button
            role="menuitem"
            type="button"
            className={`${styles.dealerItem} ${styles.dealerOut}`}
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
