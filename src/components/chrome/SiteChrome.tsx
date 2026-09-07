"use client";

/**
 * The site chrome in one client component: the fixed header (with ThemeSync
 * inside it), the mobile menu sheet and the custom cursor. Drop it once in
 * the root layout or page, before the page content, so the header's #site-logo
 * exists when the preloader looks for it.
 */

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import type { Theme } from "@/components/ui/Section";
import { brand } from "@/content/site";
import Header, { PRIMARY_LINKS, RETAILERS_LINK, SEARCH_LINK, VISIT_LINK, type ChromeLink } from "./Header";
import MobileMenu from "./MobileMenu";
import Cursor from "./Cursor";

const SECONDARY_LINKS: ChromeLink[] = [SEARCH_LINK, RETAILERS_LINK, VISIT_LINK, { label: "Instagram", href: brand.social.instagram }];

export interface SiteChromeProps {
  /** Theme the header paints before the first chapter is measured. The homepage hero is dark. */
  initialTheme?: Theme;
}

export default function SiteChrome({ initialTheme = "dark" }: SiteChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // The sheet closes on navigation; adjusted during render so the new route never paints with it open.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setMenuOpen(false);
  }

  const toggle = useCallback(() => setMenuOpen((o) => !o), []);
  const close = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <Header menuOpen={menuOpen} onMenuToggle={toggle} initialTheme={initialTheme} />
      <MobileMenu open={menuOpen} onClose={close} links={PRIMARY_LINKS} secondary={SECONDARY_LINKS} visitHref={VISIT_LINK.href} />
      <Cursor />
    </>
  );
}
