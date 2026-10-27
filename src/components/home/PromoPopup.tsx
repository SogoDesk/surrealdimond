"use client";

/**
 * The homepage pop-up banner (lib/promo.ts). After the banner's delay, if it
 * is live for this visitor and they have not closed this version recently,
 * a card rises over the page with the page behind it dimmed and softly
 * blurred. The card closes with its cross, the Escape key or a click on the
 * dimmed page; following its button also counts as closing. While open it
 * holds focus, locks the page scroll and hands focus back on close.
 *
 * Three layouts: the photograph beside the text, the photograph full bleed
 * with the text over a dark scrim, or text alone. Light or navy. An offer
 * code shows as a chip the visitor can copy. /?promo=preview opens the
 * published banner straight away, ignoring dates and closings, for staff.
 *
 * PromoCard is the card alone, shared with the console's live preview.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useDealer } from "@/lib/dealer";
import { rememberClosed, shouldShowPromo, usePromo, type Promo } from "@/lib/promo";
import { lockScroll } from "@/lib/scroll";
import s from "./PromoPopup.module.css";

export function PromoCard({ promo, headingId, onClose, onFollow }: { promo: Promo; headingId?: string; onClose?: () => void; onFollow?: () => void }) {
  const [copied, setCopied] = useState(false);
  const withImage = promo.layout !== "text" && promo.image;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={s.card} data-layout={promo.layout} data-tone={promo.tone}>
      {onClose && (
        <button type="button" className={s.close} onClick={onClose} aria-label="Close">
          <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <path d="M3 3l10 10M13 3 3 13" />
          </svg>
        </button>
      )}
      {withImage && (
        <div className={s.media}>
          <Image src={promo.image} alt="" fill sizes="(min-width: 768px) 380px, 100vw" />
        </div>
      )}
      <div className={s.body}>
        {promo.eyebrow && <p className={s.eyebrow}>{promo.eyebrow}</p>}
        <h2 id={headingId} className={s.title}>
          {promo.title}
          {promo.emphasis && <em> {promo.emphasis}</em>}
        </h2>
        {promo.message && <p className={s.message}>{promo.message}</p>}
        {promo.code && (
          <div className={s.code}>
            <span className={s.codeLabel}>Use code</span>
            <strong className={s.codeValue}>{promo.code}</strong>
            <button type="button" className={s.codeCopy} onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </button>
            <span className={s.srOnly} aria-live="polite">
              {copied ? "Code copied" : ""}
            </span>
          </div>
        )}
        {promo.cta && promo.href && (
          <Link href={promo.href} className={s.cta} onClick={onFollow}>
            {promo.cta}
            <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        )}
        {promo.fineprint && <p className={s.fineprint}>{promo.fineprint}</p>}
      </div>
    </div>
  );
}

const FOCUSABLE = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

export default function PromoPopup() {
  const promo = usePromo();
  const dealer = useDealer();
  const [state, setState] = useState<"hidden" | "open" | "closing">("hidden");
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const headingId = useId();

  // Decide and wait the delay; a new version, or the dealer session arriving, decides again.
  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("promo") === "preview";
    if (!preview && !shouldShowPromo(promo, Boolean(dealer))) return;
    const id = window.setTimeout(
      () => {
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setState("open");
      },
      preview ? 500 : Math.max(1, promo.delay) * 1000,
    );
    return () => window.clearTimeout(id);
  }, [promo, dealer]);

  useEffect(() => {
    if (state !== "open") return;
    lockScroll(true);
    panelRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    return () => lockScroll(false);
  }, [state]);

  if (state === "hidden") return null;

  const close = () => {
    rememberClosed(promo);
    setState("closing");
    window.setTimeout(() => {
      setState("hidden");
      openerRef.current?.focus({ preventScroll: true });
    }, 280);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={s.root} data-state={state} onKeyDown={onKeyDown}>
      <div className={s.backdrop} onClick={close} aria-hidden />
      <div ref={panelRef} className={s.panel} role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <PromoCard promo={promo} headingId={headingId} onClose={close} onFollow={() => rememberClosed(promo)} />
      </div>
    </div>
  );
}
