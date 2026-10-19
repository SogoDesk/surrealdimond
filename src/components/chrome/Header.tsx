"use client";

/**
 * Two-tier header on the Tanishq pattern (docs/CONTEXT.md, "Navigation").
 *
 * Top row: the live line mark and wordmark (#site-logo, the element the
 * preloader Flips its mark into), a wide search field with rotating prompts,
 * and the trade utilities: appointments, Log in, the Become a dealer pill and
 * the cart (signed in: the store's account menu and the mini cart). Second row (from 1024px): the primary links, with Jewelry opening
 * the mega menu on hover intent. Past 80px of scroll the second row folds
 * away and the bar keeps only the top row; it returns near the top of the
 * page. The bar is light on the commerce pages; the homepage passes
 * `chapters`, which mounts ThemeSync so the bar follows each chapter's
 * data-theme (light-on-dark glass over the dark chapters).
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FocusEvent, type FormEvent, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import LineMark from "@/components/brand/LineMark";
import Wordmark from "@/components/brand/Wordmark";
import Button from "@/components/ui/Button";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import { account, nav } from "@/content/site";
import { LINE_MARK_ASPECT } from "@/components/brand/lineMarkPaths";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import MegaMenu from "./MegaMenu";
import ThemeSync from "./ThemeSync";
import MiniCart from "./MiniCart";
import AccountMenu from "./AccountMenu";
import { useDealer } from "@/lib/dealer";
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

const PROMPTS = ["engagement rings", "oval diamonds", "a style number", "tennis bracelets", "stud earrings", "the Constellation Collection"];
const CONDENSE_AT = 80;

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

/** The search field: a native input with an animated prompt layered over it while it is empty. */
function SearchField() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [prompt, setPrompt] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setPrompt((p) => (p + 1) % PROMPTS.length), 2800);
    return () => window.clearInterval(id);
  }, []);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `${account.search}?q=${encodeURIComponent(q)}` : account.search);
  };

  const showPrompt = value.length === 0;

  return (
    <form role="search" className={styles.search} onSubmit={submit} data-focused={focused ? "true" : undefined}>
      <MagnifierIcon />
      <label htmlFor="site-search" className={styles.srOnly}>
        Search the Surreal catalog
      </label>
      <input
        id="site-search"
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off"
        className={styles.searchInput}
      />
      {showPrompt && (
        <span className={styles.searchPrompt} aria-hidden>
          <span>Search for&nbsp;</span>
          <span className={styles.promptWindow}>
            <span key={prompt} className={styles.promptWord}>
              {PROMPTS[prompt]}
            </span>
          </span>
        </span>
      )}
      <button type="submit" className={styles.searchSubmit} aria-label="Search">
        <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 8h11M9 4l4 4-4 4" />
        </svg>
      </button>
    </form>
  );
}

export default function Header({ menuOpen, onMenuToggle, headerRef, chapters = false }: HeaderProps) {
  const localRef = useRef<HTMLElement | null>(null);
  const ref = headerRef ?? localRef;
  const logoRef = useRef<HTMLAnchorElement>(null);
  const shopRef = useRef<HTMLAnchorElement>(null);
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

  const isRouteActive = (href: string) => pathname !== "/" && (pathname === href || pathname.startsWith(`${href}/`));

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
          <LineMark navy="var(--mark-a)" sky="var(--mark-b)" alternating strokeCount={12} strokeScale={6} style={{ height: 30, width: 30 * LINE_MARK_ASPECT }} />
          <Wordmark size={20} withTm className={styles.wordmark} />
        </Link>

        <div className={styles.searchSlot}>
          <SearchField />
        </div>

        <div className={styles.right}>
          <button type="button" className={`${styles.util} ${styles.iconLink}`} onClick={() => openContactDrawer("other", "visit")}>
            <CalendarIcon />
            <span className={styles.utilLabel}>Appointments</span>
          </button>
          {dealer ? (
            <AccountMenu dealer={dealer} />
          ) : (
            <>
              <Link href={LOGIN_LINK.href} className={`${styles.util} ${styles.iconLink}`} data-active={isRouteActive(LOGIN_LINK.href) ? "true" : undefined}>
                <UserIcon />
                <span className={styles.utilLabel}>{LOGIN_LINK.label}</span>
              </Link>
              <span className={styles.pillWrap}>
                <Button variant="primary" href={APPLY_LINK.href} className={styles.pill}>
                  {APPLY_LINK.label}
                </Button>
              </span>
            </>
          )}
          <MiniCart />
          <MenuButton open={menuOpen} onToggle={onMenuToggle} />
        </div>
      </div>

      <nav className={styles.row} aria-label="Primary">
        <ul className={styles.rowList}>
          {PRIMARY_LINKS.map((item) => {
            const isShop = item.label === "Jewelry";
            const active = isRouteActive(item.href);
            const link = (
              <Link
                ref={isShop ? shopRef : undefined}
                href={item.href}
                className={`${styles.link} t-nav`}
                data-active={active ? "true" : undefined}
                aria-current={active ? "page" : undefined}
                aria-haspopup={isShop ? "true" : undefined}
                aria-expanded={isShop ? shopOpen : undefined}
                aria-controls={isShop ? "shop-menu" : undefined}
                onKeyDown={isShop ? onShopKey : undefined}
              >
                <span>{item.label}</span>
                {isShop && <Chevron />}
              </Link>
            );
            if (!isShop) return <li key={item.label}>{link}</li>;
            return (
              <li key={item.label} className={styles.shopItem} onPointerEnter={() => intend(true)} onPointerLeave={onShopLeave}>
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
                  {shopOpen ? "Close the Jewelry menu" : "Open the Jewelry menu"}
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
