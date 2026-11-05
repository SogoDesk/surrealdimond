"use client";

/**
 * Two-tier header on the Tanishq pattern (docs/CONTEXT.md, "Navigation").
 *
 * Top row: the live line mark and wordmark (#site-logo), the site search
 * (SiteSearch: suggestions from the catalog, the stone feed and the pages;
 * a search icon on phones), and the trade utilities. Signed out: Log in and
 * Become a dealer only. Signed in: appointments, Dealer Options (a trimmed
 * menu), the Retailer Dashboard in Surreal blue and the mini cart. The
 * labelled Light / Dark switch sits in the right corner (client change
 * request, November 2026). Second row (from 1024px): the primary links;
 * Jewelry opens the mega menu on hover intent, click or tap. Both rows stay
 * in place; while the page scrolls the bar fades out, and it comes back on
 * hover, on focus, or as soon as the scrolling stops. The bar is light on the
 * commerce pages; the homepage passes `chapters`, which mounts ThemeSync so
 * the bar follows each chapter's data-theme (light-on-dark glass over the
 * dark chapters).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FocusEvent, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import LineMark from "@/components/brand/LineMark";
import Wordmark from "@/components/brand/Wordmark";
import Button from "@/components/ui/Button";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import { account, nav } from "@/content/site";
import { LINE_MARK_ASPECT } from "@/components/brand/lineMarkPaths";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import MegaMenu from "./MegaMenu";
import SiteSearch from "./SiteSearch";
import ThemeSync from "./ThemeSync";
import MiniCart from "./MiniCart";
import DealerMenu from "./DealerMenu";
import { useDealer } from "@/lib/dealer";
import ThemeSwitch from "./ThemeSwitch";
import { MenuButton } from "./MobileMenu";
import styles from "./chrome.module.css";

export interface ChromeLink {
  label: string;
  href: string;
}

const hrefFor = (label: string, fallback: string) => nav.find((n) => n.label === label)?.href ?? fallback;

/** Second-row links, in the order of the Phase 1 page list. */
export const PRIMARY_LINKS: ChromeLink[] = [
  { label: "Jewelry", href: hrefFor("Jewelry", "/jewelry") },
  { label: "Diamonds", href: hrefFor("Diamonds", "/diamonds") },
  { label: "Made to Order", href: hrefFor("Made to Order", "/diamonds/made-to-order") },
  { label: "Legacy", href: hrefFor("Legacy", "/legacy") },
  { label: "Custom", href: hrefFor("Custom", "/custom") },
  { label: "About", href: hrefFor("About", "/about") },
  { label: "Contact", href: hrefFor("Contact", "/contact") },
];

export const LOGIN_LINK: ChromeLink = { label: "Log in", href: account.login };
export const APPLY_LINK: ChromeLink = { label: "Become a dealer", href: account.apply };
export const APPOINTMENT_LINK: ChromeLink = { label: "Schedule an appointment", href: account.appointment };
export const DASHBOARD_LINK: ChromeLink = { label: "Retailer Dashboard", href: account.dashboard };

const CONDENSE_AT = 80;
/** The bar fades while the page scrolls, and is back this long after the scrolling stops. */
const FADE_IDLE = 450;

const subscribeScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};
const pastCondense = () => window.scrollY > CONDENSE_AT;
const notPast = () => false;

export interface HeaderProps {
  menuOpen: boolean;
  onMenuToggle: () => void;
  headerRef?: RefObject<HTMLElement | null>;
  /** Follow the homepage chapters' themes (ThemeSync). */
  chapters?: boolean;
}

function MagnifierIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <circle cx="6.75" cy="6.75" r="5.25" />
      <path d="M10.6 10.6 15 15" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3.5" width="13" height="12" rx="1" />
      <path d="M2.5 7h13M6 2v3M12 2v3" />
      <path d="M6 10.5h1M8.5 10.5h1M11 10.5h1M6 13h1M8.5 13h1" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <circle cx="9" cy="6.25" r="3.25" />
      <path d="M2.75 16c.8-3.1 3.2-4.75 6.25-4.75S14.45 12.9 15.25 16" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg aria-hidden viewBox="0 0 10 10" className={styles.chevron} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3.75 5 6.75l3-3" />
    </svg>
  );
}

export default function Header({ menuOpen, onMenuToggle, headerRef, chapters = false }: HeaderProps) {
  const localRef = useRef<HTMLElement | null>(null);
  const ref = headerRef ?? localRef;
  const logoRef = useRef<HTMLAnchorElement>(null);
  const shopRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const [shopOpen, setShopOpen] = useState(false);
  const condensed = useSyncExternalStore(subscribeScroll, pastCondense, notPast);
  const dealer = useDealer();
  const intentTimer = useRef(0);

  const { contextSafe } = useGSAP({ scope: ref });

  /* Hover intent, 150ms both ways, shared by the Jewelry item and the panel. */
  const intend = useCallback((open: boolean) => {
    window.clearTimeout(intentTimer.current);
    intentTimer.current = window.setTimeout(() => setShopOpen(open), 150);
  }, []);
  const closeShop = useCallback(() => {
    window.clearTimeout(intentTimer.current);
    setShopOpen(false);
  }, []);

  useEffect(() => () => window.clearTimeout(intentTimer.current), []);

  /* Past the first 80px, scrolling fades the bar out; it returns when the scrolling stops (and on hover or focus, in CSS). */
  useEffect(() => {
    const header = ref.current;
    if (!header) return;
    let timer = 0;
    const onScroll = () => {
      window.clearTimeout(timer);
      if (window.scrollY > CONDENSE_AT) header.dataset.scrolling = "true";
      timer = window.setTimeout(() => {
        delete header.dataset.scrolling;
      }, FADE_IDLE);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
      delete header.dataset.scrolling;
    };
  }, [ref]);

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

  /* Hovering the mark redraws its strokes from tip to base in 500ms. */
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

  /* Leaving the Jewelry item toward the panel keeps it open; any other link or leaving the header starts the close intent. */
  const onShopLeave = (e: PointerEvent<HTMLElement>) => {
    const next = e.relatedTarget;
    if (next instanceof Element && next.closest("#shop-menu")) return;
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

  const under = (href: string) => pathname !== "/" && (pathname === href || pathname.startsWith(`${href}/`));
  // The most specific link wins: on /diamonds/made-to-order, Made to Order rather than Diamonds.
  const isRouteActive = (href: string) => under(href) && !PRIMARY_LINKS.some((l) => l.href !== href && l.href.startsWith(`${href}/`) && under(l.href));

  return (
    <header
      ref={ref}
      className={styles.header}
      data-theme="light"
      data-site-header
      data-condensed={condensed && !shopOpen ? "true" : undefined}
      data-menu-open={menuOpen ? "true" : "false"}
      data-shop-open={shopOpen ? "true" : undefined}
      onBlur={onHeaderBlur}
      onPointerLeave={onHeaderLeave}
    >
      <div className={styles.bar}>
        <Link ref={logoRef} href="/" id="site-logo" className={styles.logo} aria-label="Surreal, home" onPointerEnter={redraw} onFocus={redraw}>
          <LineMark navy="var(--mark-a)" sky="var(--mark-b)" alternating strokeCount={12} strokeScale={6} style={{ height: 36, width: 36 * LINE_MARK_ASPECT }} />
          <Wordmark size={24} withTm className={styles.wordmark} />
        </Link>

        <div className={styles.searchSlot}>
          <SiteSearch />
        </div>

        <div className={styles.right}>
          {/* Signed out: Log in and Become a dealer only. Signed in: appointments, Dealer Options, the Retailer Dashboard in Surreal blue and the cart (client change request, November 2026). */}
          {dealer ? (
            <>
              <button type="button" className={`${styles.util} ${styles.iconLink}`} onClick={() => openContactDrawer("other", "visit")}>
                <CalendarIcon />
                <span className={styles.utilLabel}>Appointments</span>
              </button>
              <DealerMenu dealer={dealer} />
              <span className={styles.pillWrap}>
                <Button variant="primary" href={DASHBOARD_LINK.href} className={`${styles.pill} ${styles.pillSky}`}>
                  {DASHBOARD_LINK.label}
                </Button>
              </span>
            </>
          ) : (
            <>
              <Link href={pathname === "/" || pathname === LOGIN_LINK.href ? LOGIN_LINK.href : `${LOGIN_LINK.href}?next=${encodeURIComponent(pathname)}`} className={styles.dashPill} data-active={isRouteActive(LOGIN_LINK.href) ? "true" : undefined}>
                <UserIcon />
                <span>{LOGIN_LINK.label}</span>
              </Link>
              <span className={styles.pillWrap}>
                <Button variant="primary" href={APPLY_LINK.href} className={styles.pill}>
                  {APPLY_LINK.label}
                </Button>
              </span>
            </>
          )}
          <Link href={account.search} className={styles.searchIconLink} aria-label="Search">
            <MagnifierIcon />
          </Link>
          {dealer && <MiniCart />}
          <ThemeSwitch className={styles.modeBar} />
          <MenuButton open={menuOpen} onToggle={onMenuToggle} />
        </div>
      </div>

      <nav className={styles.row} aria-label="Primary">
        <ul className={styles.rowList}>
          {PRIMARY_LINKS.map((item) => {
            const isShop = item.label === "Jewelry";
            const active = isRouteActive(item.href);
            if (!isShop)
              return (
                <li key={item.label}>
                  <Link href={item.href} className={`${styles.link} t-nav`} data-active={active ? "true" : undefined} aria-current={active ? "page" : undefined}>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            /* Jewelry is the mega menu's trigger: hover intent opens it, and so does a click or a tap (with a mouse a click only opens it, so hovering then clicking never closes it). View all inside goes to the store. */
            return (
              <li key={item.label} className={styles.shopItem} onPointerEnter={() => intend(true)} onPointerLeave={onShopLeave}>
                <button
                  ref={shopRef}
                  type="button"
                  className={`${styles.link} t-nav`}
                  data-active={active ? "true" : undefined}
                  aria-haspopup="true"
                  aria-expanded={shopOpen}
                  aria-controls="shop-menu"
                  onKeyDown={onShopKey}
                  onClick={(e) => {
                    window.clearTimeout(intentTimer.current);
                    const mouse = (e.nativeEvent as globalThis.PointerEvent).pointerType === "mouse";
                    setShopOpen((o) => (mouse ? true : !o));
                  }}
                >
                  <span>{item.label}</span>
                  <Chevron />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <MegaMenu open={shopOpen} onIntent={intend} onClose={closeShop} />
      {chapters && <ThemeSync headerRef={ref} />}
    </header>
  );
}
