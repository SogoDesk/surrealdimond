"use client";

/**
 * The Retailer Dashboard's frame (BRD 5.7, R-30), in the WB Mason customer
 * portal manner: the site header above, then a sidebar with the dealer's
 * store card and the sections grouped (Overview, Orders and memo, Order,
 * Grow your store, Your account), and the page on the right. Sections still
 * in design carry a "Soon" tag, the next one "Next". On tablets and phones
 * the sidebar becomes a row of chips that scrolls sideways.
 *
 * The dashboard is for signed-in dealers only: a visitor gets the log in and
 * Become a dealer doors in its place. The dealer session lives in this
 * browser, so until the page has hydrated it shows a quiet skeleton rather
 * than flashing the signed-out doors.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import { dashGroups, dashSections } from "@/content/dashboard";
import { account, brand } from "@/content/site";
import { signOut, useDealer } from "@/lib/dealer";
import DashIcon from "./DashIcon";
import s from "./dashboard.module.css";

const noop = () => () => {};
export const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

export const initials = (store: string) =>
  store
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export default function DashboardShell({ children }: { children: ReactNode }) {
  const dealer = useDealer();
  const hydrated = useHydrated();
  const pathname = usePathname();
  const router = useRouter();

  const body = !hydrated ? (
    <div className={s.skeleton} aria-busy="true" aria-label="Loading your dashboard">
      <span />
      <span />
      <span />
    </div>
  ) : !dealer ? (
    <div className={s.gate}>
      <p className={s.kicker}>Retailer Dashboard</p>
      <h1 className={s.gateTitle}>
        Everything for <em>your store</em>
      </h1>
      <p className={s.gateLine}>Orders and reorder, open memo items, marketing programs, training, trade shows and your account, in one place. Log in with your dealer account to open it.</p>
      <div className={s.gateDoors}>
        <Link href={`${account.login}?next=${encodeURIComponent(pathname)}`} className={s.primary}>
          Dealer log in
        </Link>
        <Link href="/contact?type=dealer" className={s.secondary}>
          Become a dealer
        </Link>
      </div>
    </div>
  ) : (
    <div className={s.frame}>
      <aside className={s.sidebar} aria-label="Dashboard">
        <div className={s.storeCard}>
          <span className={s.avatar} aria-hidden>
            {initials(dealer.store)}
          </span>
          <span className={s.storeText}>
            <strong>{dealer.store}</strong>
            <span>{dealer.email}</span>
          </span>
          {dealer.demo && <span className={s.demoTag}>Preview</span>}
        </div>
        <nav className={s.nav}>
          {dashGroups.map((g) => (
            <div key={g} className={s.navGroup}>
              <p className={s.navGroupTitle}>{g}</p>
              <ul>
                {dashSections
                  .filter((d) => d.group === g)
                  .map((d) => {
                    const active = pathname === d.href;
                    return (
                      <li key={d.id}>
                        <Link href={d.href} className={s.navLink} aria-current={active ? "page" : undefined}>
                          <DashIcon id={d.icon} className={s.navIcon} />
                          <span>{d.label}</span>
                          {d.status !== "live" && <span className={s.navTag}>{d.status === "next" ? "Next" : "Soon"}</span>}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>
        <div className={s.sideFoot}>
          <p>
            Questions? <a href={brand.office.phoneHref}>{brand.office.phone}</a>
            <br />
            {brand.office.hours}
          </p>
          <button
            type="button"
            className={s.logout}
            onClick={() => {
              signOut();
              router.push("/");
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <div className={s.content}>{children}</div>
    </div>
  );

  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main" className={s.main}>
        <div className={s.wrap}>{body}</div>
        <Footer />
      </main>
    </>
  );
}
