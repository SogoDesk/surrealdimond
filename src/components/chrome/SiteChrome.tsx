"use client";

/**
 * The site chrome in one client component: the fixed two-row header and the
 * mobile menu sheet. Drop it once per page, before the page content, so the
 * header's #site-logo exists when the preloader looks for it. The homepage
 * passes `chapters` so the bar follows its dark and light chapters.
 */

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { account, brand } from "@/content/site";
import { useDealer } from "@/lib/dealer";
import Header, { APPLY_LINK, APPOINTMENT_LINK, DASHBOARD_LINK, LOGIN_LINK, PRIMARY_LINKS, type ChromeLink } from "./Header";
import MobileMenu from "./MobileMenu";

const SECONDARY_LINKS: ChromeLink[] = [LOGIN_LINK, APPLY_LINK, DASHBOARD_LINK, APPOINTMENT_LINK, { label: "Instagram", href: brand.social.instagram }];
const DEALER_LINKS: ChromeLink[] = [{ label: "Cart and checkout", href: account.cart }, DASHBOARD_LINK, APPOINTMENT_LINK, { label: "Instagram", href: brand.social.instagram }];

export default function SiteChrome({ chapters = false, tone = "light" }: { chapters?: boolean; tone?: "light" | "dark" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dealer = useDealer();
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
      <Header menuOpen={menuOpen} onMenuToggle={toggle} chapters={chapters} tone={tone} />
      <MobileMenu open={menuOpen} onClose={close} links={PRIMARY_LINKS} secondary={dealer ? DEALER_LINKS : SECONDARY_LINKS} visitHref={APPOINTMENT_LINK.href} />
    </>
  );
}
