"use client";

/**
 * The dealer cart (after Tanishq's cart). Signed out, the dealer holding page
 * asks the visitor to log in. Signed in: the step bar, then two columns.
 * Left: the ship-to card (the store on the account, with the next day
 * delivery countdown), the line items (quantity, ring size, note, save to
 * wishlist, remove) and the trust row. Right, held in view: the order
 * summary, an optional PO number, Proceed to checkout and Continue shopping.
 * On phones a bar at the foot carries the piece count and the checkout door.
 * An empty cart shows a drawn bag and the way back to the store, with the
 * wishlist when it has pieces.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import GatePage from "@/components/pages/GatePage";
import StoreCard from "@/components/store/StoreCard";
import DeliveryCountdown from "@/components/product/DeliveryCountdown";
import { useWishlist } from "@/components/store/useWishlist";
import { gates } from "@/content/gates";
import { brand } from "@/content/site";
import { featured, productById, type Product } from "@/content/catalog";
import { RING_SIZES, SIZED_CATEGORIES, pieceCount, useCart } from "@/lib/cart";
import { useDealer } from "@/lib/dealer";
import { LineItem, Steps, Summary, TrustRow } from "./parts";
import s from "./checkout.module.css";

function EmptyBag() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden className={s.emptyArt}>
      <circle cx="60" cy="60" r="56" fill="var(--mist)" />
      <path d="M32 44h56l-4 50H36Z" fill="var(--white)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M46 44v-4a14 14 0 0 1 28 0v4" fill="none" stroke="var(--ink)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M52 64h16l4 5-12 14-12-14Z" fill="none" stroke="var(--line)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M48 69h24" stroke="var(--line)" strokeWidth="1" />
    </svg>
  );
}

export default function CartPage() {
  const dealer = useDealer();
  const lines = useCart();
  const router = useRouter();
  const { ids } = useWishlist();

  if (!dealer) return <GatePage {...gates.cart} />;

  const pieces = pieceCount(lines);
  const missingSize = lines.some((l) => {
    const p = productById(l.productId);
    return p && SIZED_CATEGORIES.has(p.category) && !l.size;
  });
  const saved = ids.map((id) => productById(id)).filter((p): p is Product => Boolean(p));
  const suggestions = (saved.length ? saved : featured).slice(0, 5);

  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <section className={s.section} aria-labelledby="cart-title">
          <div className={s.wrap}>
            <nav aria-label="Breadcrumb" className={s.crumbs}>
              <Link href="/">Home</Link>
              <span aria-hidden>/</span>
              <span aria-current="page">Cart</span>
            </nav>
            <div className={s.head}>
              <h1 id="cart-title" className={s.title}>
                Your cart {lines.length > 0 && <span className={s.titleCount}>({pieces} {pieces === 1 ? "piece" : "pieces"})</span>}
              </h1>
              <Steps at={0} />
            </div>

            {lines.length === 0 ? (
              <div className={s.empty}>
                <EmptyBag />
                <p className={s.emptyTitle}>Your cart is empty</p>
                <p className={s.emptyLine}>Pieces you add from the catalog appear here, ready for checkout.</p>
                <div className={s.emptyDoors}>
                  <Link href="/jewelry" className={s.primary}>
                    Continue shopping
                  </Link>
                  <Link href="/diamonds/made-to-order" className={s.secondary}>
                    Made to Order
                  </Link>
                </div>
              </div>
            ) : (
              <div className={s.layout}>
                <div className={s.main}>
                  <div className={s.shipTo}>
                    <span className={s.shipIcon} aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 10.5 12 4l9 6.5V20H3Z" />
                        <path d="M9.5 20v-6h5v6" />
                      </svg>
                    </span>
                    <span className={s.shipText}>
                      <span className={s.shipLabel}>Ship to</span>
                      <strong>{dealer.store}</strong>
                      <span>Store address confirmed at the next step</span>
                    </span>
                    <span className={s.shipCountdown}>
                      <DeliveryCountdown />
                    </span>
                  </div>

                  {missingSize && (
                    <p className={s.alert} role="status">
                      Choose a ring size for each ring before checkout. Sizes US {RING_SIZES[0]} to {RING_SIZES[RING_SIZES.length - 1]}.
                    </p>
                  )}

                  <ul className={s.lines}>
                    {lines.map((l) => (
                      <li key={l.key}>
                        <LineItem line={l} />
                      </li>
                    ))}
                  </ul>
                  <TrustRow />
                </div>

                <div className={s.side}>
                  <Summary lines={lines}>
                    <button type="button" className={s.primaryWide} disabled={missingSize} onClick={() => router.push("/checkout")}>
                      Proceed to checkout
                      <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8h10M9 4l4 4-4 4" />
                      </svg>
                    </button>
                    <Link href="/jewelry" className={s.secondaryWide}>
                      Continue shopping
                    </Link>
                  </Summary>
                  <div className={s.memoCard}>
                    <p className={s.memoTitle}>Prefer it on memo?</p>
                    <p>Surreal runs a long-term memo program for diamonds and jewelry. Call the office at {brand.office.phone} to talk about memo for your case.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={s.more} aria-labelledby="more-title">
          <div className={s.wrap}>
            <h2 id="more-title" className={s.moreTitle}>
              {saved.length ? (
                <>
                  From your <em>wishlist</em>
                </>
              ) : (
                <>
                  You may <em>also like</em>
                </>
              )}
            </h2>
            <ul className={s.moreGrid}>
              {suggestions.map((p) => (
                <li key={p.id}>
                  <StoreCard product={p} preferredMetal={null} />
                </li>
              ))}
            </ul>
          </div>
        </section>
        <Footer />
      </main>

      {lines.length > 0 && (
        <div className={s.mobileBar}>
          <span>
            <strong className="tabular">{pieces}</strong> {pieces === 1 ? "piece" : "pieces"}
          </span>
          <button type="button" className={s.primary} disabled={missingSize} onClick={() => router.push("/checkout")}>
            Checkout
          </button>
        </div>
      )}
    </>
  );
}
