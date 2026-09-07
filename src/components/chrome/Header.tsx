"use client";

/**
 * Fixed top bar (DESIGN.md, "Navigation").
 *
 * Left: the live line mark at 28px and the SURREAL wordmark inside #site-logo,
 * the element the preloader Flips its mark into. Centre (from 1024px): the six
 * primary links, with Shop opening the mega menu on hover intent. Right: Search
 * diamonds, Retailers, the Book a visit pill, the Bag and, below 1024px, the
 * circle Menu button. Colour follows the page through data-theme, which
 * ThemeSync writes on the header as chapters cross the bar.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import LineMark from "@/components/brand/LineMark";
import Wordmark from "@/components/brand/Wordmark";
import Button from "@/components/ui/Button";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import Magnetic from "@/components/motion/Magnetic";
import type { Theme } from "@/components/ui/Section";
import { nav } from "@/content/site";
import { LINE_MARK_ASPECT } from "@/components/brand/lineMarkPaths";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import MegaMenu from "./MegaMenu";
import { MenuButton } from "./MobileMenu";
import ThemeSync from "./ThemeSync";
import styles from "./chrome.module.css";

export interface ChromeLink {
  label: string;
  href: string;
  /** Homepage chapter ids (data-chapter) that make this link the active one. */
  chapters?: string[];
}

const hrefFor = (label: string, fallback: string) => nav.find((n) => n.label === label)?.href ?? fallback;

/** Centre links in the order the specification names them. */
export const PRIMARY_LINKS: ChromeLink[] = [
  { label: "Shop", href: hrefFor("Jewelry", "/jewelry"), chapters: ["collections", "lookbook", "foreveryone"] },
  { label: "Engagement", href: hrefFor("Engagement", "/jewelry/engagement"), chapters: ["engagement"] },
  { label: "Made to Order", href: hrefFor("Made to Order", "/made-to-order"), chapters: ["made-to-order"] },
  { label: "Legacy", href: hrefFor("Legacy", "/legacy"), chapters: ["legacy"] },
  { label: "Custom", href: hrefFor("Custom", "/custom"), chapters: ["custom"] },
  { label: "Education", href: hrefFor("Education", "/education"), chapters: ["education"] },
];

/** Right cluster and mobile secondary links. */
export const SEARCH_LINK: ChromeLink = { label: "Search diamonds", href: hrefFor("Diamonds", "/diamonds") };
export const RETAILERS_LINK: ChromeLink = { label: "Retailers", href: "/dashboard" };
export const VISIT_LINK: ChromeLink = { label: "Book a visit", href: hrefFor("Contact", "/contact") };

export interface HeaderProps {
  menuOpen: boolean;
  onMenuToggle: () => void;
  /** Theme painted before ThemeSync has measured the page. The hero is dark. */
  initialTheme?: Theme;
  headerRef?: RefObject<HTMLElement | null>;
}

function MagnifierIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <circle cx="6.75" cy="6.75" r="5.25" />
      <path d="M10.6 10.6 15 15" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 5.5h13l-.9 10.5H3.4z" />
      <path d="M6 5.5V4.8a3 3 0 0 1 6 0v.7" />
    </svg>
  );
}

export default function Header({ menuOpen, onMenuToggle, initialTheme = "dark", headerRef }: HeaderProps) {
  const localRef = useRef<HTMLElement | null>(null);
  const ref = headerRef ?? localRef;
  const logoRef = useRef<HTMLAnchorElement>(null);
  const shopRef = useRef<HTMLAnchorElement>(null);
  const pathname = usePathname();
  const [shopOpen, setShopOpen] = useState(false);
  const intentTimer = useRef(0);

  const { contextSafe } = useGSAP({ scope: ref });

  /* Hover intent, 150ms both ways, shared by the Shop item and the panel. */
  const intend = useCallback((open: boolean) => {
    window.clearTimeout(intentTimer.current);
    intentTimer.current = window.setTimeout(() => setShopOpen(open), 150);
  }, []);
  const closeShop = useCallback(() => {
    window.clearTimeout(intentTimer.current);
    setShopOpen(false);
  }, []);

  useEffect(() => () => window.clearTimeout(intentTimer.current), []);

  useEffect(() => {
    if (!shopOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      closeShop();
      shopRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shopOpen, closeShop]);

  /* The panel closes when the menu sheet opens or the route changes: state is adjusted during render, the pending intent is cleared after commit. */
  const [seen, setSeen] = useState({ menuOpen, pathname });
  if (seen.menuOpen !== menuOpen || seen.pathname !== pathname) {
    setSeen({ menuOpen, pathname });
    setShopOpen(false);
  }
  useEffect(() => {
    window.clearTimeout(intentTimer.current);
  }, [menuOpen, pathname]);

  /* Hovering the mark redraws its strokes from tip to base in 500ms. The ref is read inside the handler, never during render. */
  const redraw = () =>
    contextSafe(() => {
      if (prefersReducedMotion()) return;
      registerGsap();
      const paths = logoRef.current?.querySelectorAll("path");
      if (!paths || paths.length === 0) return;
      gsap.fromTo(
        paths,
        { drawSVG: "100% 100%" },
        { drawSVG: "0% 100%", duration: 0.5, ease: "surreal", stagger: { amount: 0.12, from: "end" }, overwrite: true },
      );
    })();

  const onHeaderBlur = (e: FocusEvent<HTMLElement>) => {
    if (!shopOpen) return;
    const next = e.relatedTarget as Node | null;
    if (next && ref.current?.contains(next)) return;
    closeShop();
  };

  /*
   * Leaving the Shop item toward the panel crosses the empty bar beneath the
   * link, so that path keeps the panel open; the close intent starts only when
   * the pointer reaches another link or leaves the header altogether.
   */
  const onShopLeave = (e: PointerEvent<HTMLElement>) => {
    const next = e.relatedTarget;
    if (next instanceof Element && ref.current?.contains(next) && !next.closest(`.${styles.center}, .${styles.right}`)) return;
    intend(false);
  };
  const onHeaderLeave = () => {
    if (shopOpen) intend(false);
  };

  const onShopKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      window.clearTimeout(intentTimer.current);
      setShopOpen(true);
    }
  };

  const isRouteActive = (href: string) => pathname !== "/" && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header
      ref={ref}
      className={styles.header}
      data-theme={initialTheme}
      data-site-header
      data-menu-open={menuOpen ? "true" : "false"}
      onBlur={onHeaderBlur}
      onPointerLeave={onHeaderLeave}
    >
      <div className={styles.bar}>
        <Link
          ref={logoRef}
          href="/"
          id="site-logo"
          className={styles.logo}
          aria-label="Surreal, home"
          data-cursor="link"
          onPointerEnter={redraw}
          onFocus={redraw}
        >
          <LineMark
            navy="var(--mark-a)"
            sky="var(--mark-b)"
            alternating
            strokeCount={12}
            strokeScale={6}
            style={{ height: 28, width: 28 * LINE_MARK_ASPECT }}
          />
          <Wordmark size={20} withTm className={styles.wordmark} />
        </Link>

        <nav className={styles.center} aria-label="Primary">
          {PRIMARY_LINKS.map((item) => {
            const isShop = item.label === "Shop";
            const link = (
              <Link
                key={item.label}
                ref={isShop ? shopRef : undefined}
                href={item.href}
                className={`${styles.link} t-nav`}
                data-cursor="link"
                data-chapter-match={item.chapters?.join(" ")}
                data-active={isRouteActive(item.href) ? "true" : undefined}
                aria-current={isRouteActive(item.href) ? "page" : undefined}
                aria-haspopup={isShop ? "true" : undefined}
                aria-expanded={isShop ? shopOpen : undefined}
                aria-controls={isShop ? "shop-menu" : undefined}
                onKeyDown={isShop ? onShopKey : undefined}
              >
                <span aria-hidden className={styles.dot} />
                <span>{item.label}</span>
              </Link>
            );
            if (!isShop) return link;
            return (
              <span
                key={item.label}
                className={styles.shopItem}
                onPointerEnter={() => intend(true)}
                onPointerLeave={onShopLeave}
              >
                {link}
                <button
                  type="button"
                  className={styles.srOnly}
                  aria-expanded={shopOpen}
                  aria-controls="shop-menu"
                  onClick={() => {
                    window.clearTimeout(intentTimer.current);
                    setShopOpen((o) => !o);
                  }}
                >
                  {shopOpen ? "Close the Shop menu" : "Open the Shop menu"}
                </button>
              </span>
            );
          })}
        </nav>

        <div className={styles.right}>
          <Magnetic strength={0.2} className={styles.util}>
            <Link href={SEARCH_LINK.href} className={`${styles.link} t-nav`} data-cursor="link">
              <MagnifierIcon />
              <span className={styles.searchLabel}>{SEARCH_LINK.label}</span>
            </Link>
          </Magnetic>
          <Link
            href={RETAILERS_LINK.href}
            className={`${styles.link} ${styles.util} t-nav`}
            data-cursor="link"
            data-active={isRouteActive(RETAILERS_LINK.href) ? "true" : undefined}
          >
            <span aria-hidden className={styles.dot} />
            <span>{RETAILERS_LINK.label}</span>
          </Link>
          <span className={styles.pillWrap}>
            <Button
              variant="secondary"
              href={VISIT_LINK.href}
              className={styles.pill}
              onClick={(e) => {
                e.preventDefault();
                openContactDrawer("other", "visit");
              }}
            >
              {VISIT_LINK.label}
            </Button>
          </span>
          <Magnetic strength={0.2}>
            <button type="button" className={`${styles.bag} t-nav`} aria-label="Bag, 0 items" data-cursor="link">
              <BagIcon />
              <span className={styles.count} aria-hidden>
                0
              </span>
            </button>
          </Magnetic>
          <MenuButton open={menuOpen} onToggle={onMenuToggle} />
        </div>
      </div>

      <MegaMenu open={shopOpen} onIntent={intend} onClose={closeShop} />
      <ThemeSync headerRef={ref} menuOpen={menuOpen} />
    </header>
  );
}
