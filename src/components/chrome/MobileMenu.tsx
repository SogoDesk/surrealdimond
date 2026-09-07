"use client";

/**
 * Mobile navigation (DESIGN.md, "Navigation").
 *
 * MenuButton: the 40px circle whose two lines morph into an X (MorphSVG). The
 * header renders it in its right cluster so it inherits the chapter colour.
 *
 * MobileMenu (default): the full-screen porcelain sheet. It rises with
 * clip-path from the bottom in 0.6s, the primary links reveal as masked
 * SplitText lines in Cormorant 40px with a 0.06s stagger, the secondary links
 * follow in Jost, and a dark 3:2 photograph tile labelled Visit New York sits
 * at the bottom with the office address. Scroll is locked while it is open,
 * Escape closes it, and focus returns to the button on close.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { brand } from "@/content/site";
import { registerGsap, gsap, SplitText, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import { lockScroll } from "@/lib/scroll";
import type { ChromeLink } from "./Header";
import styles from "./chrome.module.css";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";

const LINE_A = "M4 9 L20 9";
const LINE_B = "M4 15 L20 15";
const CROSS_A = "M6 6 L18 18";
const CROSS_B = "M6 18 L18 6";

export function MenuButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const ref = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const svg = ref.current;
      if (!svg) return;
      const [a, b] = Array.from(svg.querySelectorAll("path"));
      if (!a || !b) return;
      const duration = prefersReducedMotion() ? 0 : 0.5;
      gsap.to(a, { morphSVG: open ? CROSS_A : LINE_A, duration, ease: "surreal", overwrite: true });
      gsap.to(b, { morphSVG: open ? CROSS_B : LINE_B, duration, ease: "surreal", overwrite: true });
    },
    { scope: ref, dependencies: [open] },
  );

  return (
    <button
      type="button"
      className={styles.menuButton}
      aria-expanded={open}
      aria-controls="mobile-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={onToggle}
      data-cursor="link"
      data-menu-button
    >
      <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden>
        <path d={LINE_A} />
        <path d={LINE_B} />
      </svg>
    </button>
  );
}

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: ChromeLink[];
  secondary: ChromeLink[];
  /** Destination of the Visit New York tile. */
  visitHref: string;
}

export default function MobileMenu({ open, onClose, links, secondary, visitHref }: MobileMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const splitRef = useRef<SplitText | null>(null);
  const everOpened = useRef(false);

  /* Split the primary links once, on the final font face, so the lines are ready before the first open. */
  useGSAP(
    () => {
      registerGsap();
      const sheet = ref.current;
      if (!sheet || prefersReducedMotion()) return;
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (cancelled) return;
        const targets = sheet.querySelectorAll("[data-sheet-link]");
        if (targets.length === 0) return;
        splitRef.current = SplitText.create(targets, { type: "lines", mask: "lines", linesClass: "split-line" });
      });
      return () => {
        cancelled = true;
        splitRef.current?.revert();
        splitRef.current = null;
      };
    },
    { scope: ref },
  );

  useGSAP(
    () => {
      registerGsap();
      const sheet = ref.current;
      if (!sheet) return;
      if (!open && !everOpened.current) return;
      everOpened.current = true;
      const reduce = prefersReducedMotion();
      const lines: Element[] = splitRef.current?.lines ?? Array.from(sheet.querySelectorAll("[data-sheet-link]"));
      const secondaryItems = sheet.querySelectorAll("[data-sheet-secondary]");
      const tile = sheet.querySelector("[data-sheet-tile]");
      gsap.killTweensOf([sheet, lines, secondaryItems, tile]);

      if (open) {
        gsap.set(sheet, { visibility: "visible" });
        if (reduce) {
          gsap.fromTo(sheet, { opacity: 0, clipPath: "inset(0% 0 0 0)" }, { opacity: 1, duration: 0.3, ease: "none" });
          gsap.set([lines, secondaryItems, tile], { autoAlpha: 1, y: 0, yPercent: 0 });
          return;
        }
        const tl = gsap.timeline();
        tl.fromTo(sheet, { opacity: 1, clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.6, ease: "surreal" });
        tl.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "surreal", stagger: 0.06 }, 0.2);
        tl.fromTo(secondaryItems, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "surreal", stagger: 0.05 }, 0.5);
        if (tile) tl.fromTo(tile, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, ease: "surreal" }, 0.55);
        return;
      }

      const hide = () => gsap.set(sheet, { visibility: "hidden" });
      if (reduce) {
        gsap.to(sheet, { opacity: 0, duration: 0.3, ease: "none", onComplete: hide });
        return;
      }
      gsap.to(sheet, { clipPath: "inset(100% 0 0 0)", duration: 0.5, ease: "surrealInOut", onComplete: hide });
    },
    { scope: ref, dependencies: [open] },
  );

  /* Scroll lock, Escape, focus management and closing when the viewport grows past the mobile layout. */
  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const sheet = ref.current;
    const focusTimer = window.setTimeout(() => {
      sheet?.querySelector<HTMLElement>("[data-sheet-link]")?.focus({ preventScroll: true });
    }, 350);
    const focusable = () => {
      const header = document.querySelector<HTMLElement>("[data-site-header]");
      const scope = [header, sheet].filter((el): el is HTMLElement => el !== null && el !== undefined);
      return scope
        .flatMap((el) => Array.from(el.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")))
        .filter((el) => !el.closest("[inert]") && (el.offsetParent !== null || el.getClientRects().length > 0));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      /* Keep Tab inside the bar and the sheet while the sheet covers the page. */
      if (e.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === first || !items.includes(current as HTMLElement))) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && (current === last || !items.includes(current as HTMLElement))) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mql.matches) onClose();
    };
    window.addEventListener("keydown", onKey);
    mql.addEventListener("change", onChange);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      mql.removeEventListener("change", onChange);
      lockScroll(false);
      document.querySelector<HTMLElement>("[data-menu-button]")?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      id="mobile-menu"
      className={styles.sheet}
      data-theme="light"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      aria-hidden={!open}
      inert={!open}
      data-lenis-prevent
    >
      <div className={styles.sheetInner}>
        <nav aria-label="Primary">
          <ul className={styles.sheetLinks}>
            {links.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className={styles.sheetLink} data-sheet-link data-cursor="link" onClick={onClose}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ul className={styles.sheetSecondary} aria-label="More">
          {secondary.map((item) => {
            const external = /^https?:/.test(item.href);
            return (
              <li key={item.label} data-sheet-secondary>
                {external ? (
                  <a href={item.href} className="t-nav" target="_blank" rel="noreferrer" data-cursor="link" onClick={onClose}>
                    {item.label}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="t-nav"
                    data-cursor="link"
                    onClick={(e) => {
                      onClose();
                      if (item.href === "/contact") {
                        e.preventDefault();
                        window.setTimeout(() => openContactDrawer("other", "visit"), 450);
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <Link
          href={visitHref}
          className={styles.tile}
          data-sheet-tile
          data-cursor="view"
          onClick={(e) => {
            onClose();
            if (visitHref === "/contact") {
              e.preventDefault();
              window.setTimeout(() => openContactDrawer("other", "visit"), 450);
            }
          }}
        >
          <Image src="/media/photos/sb-3067-sm.webp" alt="" fill sizes="(min-width: 768px) 80vw, 100vw" decoding="async" />
          <span className={styles.tileText}>
            <span className={styles.tileLabel}>Visit New York</span>
            <span className={styles.tileAddress}>
              {brand.office.address1}
              <br />
              {brand.office.address2}
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
