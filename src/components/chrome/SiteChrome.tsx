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
import { dashSection } from "@/content/dashboard";
import { canSeeBilling } from "@/lib/invoices";
import Header, { APPLY_LINK, APPOINTMENT_LINK, DASHBOARD_LINK, LOGIN_LINK, PRIMARY_LINKS, type ChromeLink } from "./Header";
import MobileMenu from "./MobileMenu";

const SECONDARY_LINKS: ChromeLink[] = [LOGIN_LINK, APPLY_LINK, APPOINTMENT_LINK, { label: "Instagram", href: brand.social.instagram }];
const CART_LINK: ChromeLink = { label: "Cart and checkout", href: account.cart };
const INSTAGRAM_LINK: ChromeLink = { label: "Instagram", href: brand.social.instagram };
/** Signed in: the Retailer Dashboard and the Dealer Options from the header (owners also see Invoices and payments). */
const dealerLinks = (billing: boolean): ChromeLink[] => [
  CART_LINK,
  DASHBOARD_LINK,
  ...(["orders", "invoices", "memo", "account"] as const)
    .map((id) => dashSection(id))
    .filter((d) => d && (!d.billing || billing))
    .map((d) => ({ label: d!.label, href: d!.href })),
  APPOINTMENT_LINK,
  INSTAGRAM_LINK,
];

export default function SiteChrome({ chapters = false }: { chapters?: boolean }) {
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
      <Header menuOpen={menuOpen} onMenuToggle={toggle} chapters={chapters} />
      <MobileMenu open={menuOpen} onClose={close} links={PRIMARY_LINKS} secondary={dealer ? dealerLinks(canSeeBilling(dealer)) : SECONDARY_LINKS} visitHref={APPOINTMENT_LINK.href} />
    </>
  );
}
