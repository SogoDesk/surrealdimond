"use client";

/**
 * The doors of a holding page. Dealer pages offer Log in and Become a
 * dealer to visitors, and tell a signed-in dealer the page is still in
 * design, pointing to what already works (the store and the cart). Public
 * pages in design point home and to the office phone.
 */

import Button from "@/components/ui/Button";
import { account, brand } from "@/content/site";
import { useDealer } from "@/lib/dealer";
import s from "./GatePage.module.css";

export default function GateDoors({ kind, benefits }: { kind: "dealer" | "building"; benefits: string[] }) {
  const dealer = useDealer();

  if (kind === "dealer" && dealer) {
    return (
      <>
        <p className={s.signedIn}>
          Signed in as <strong>{dealer.store}</strong>. This part of the dealer site is in design and arrives with the next release.
        </p>
        <div className={s.doors}>
          <Button href="/jewelry" variant="primary" arrow>
            Browse jewelry
          </Button>
          <Button href={account.cart} variant="secondary">
            View cart
          </Button>
        </div>
      </>
    );
  }

  if (kind === "dealer") {
    return (
      <>
        <div className={s.doors}>
          <Button href={account.login} variant="primary" arrow>
            Dealer log in
          </Button>
          <Button href={account.apply} variant="secondary">
            Become a dealer
          </Button>
        </div>
        <ul className={s.points}>
          {benefits.map((b) => (
            <li key={b}>
              <svg aria-hidden viewBox="0 0 10 10" width="9" height="9">
                <path d="M5 0.5 9.5 5 5 9.5 0.5 5Z" fill="currentColor" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <>
      <div className={s.doors}>
        <Button href="/" variant="primary" arrow>
          Back to the homepage
        </Button>
        <Button href={brand.office.phoneHref} variant="secondary">
          Call {brand.office.phone}
        </Button>
      </div>
      <p className={s.note}>This page is in design and arrives with the next release.</p>
    </>
  );
}
