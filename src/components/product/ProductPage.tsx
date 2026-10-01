"use client";

/**
 * Product page, on Tanishq's product page in the Surreal system
 * (docs/CONTEXT.md, "UX reference"), top to bottom:
 *
 *   1. Gallery (Gallery.tsx: thumbnails on the left, one view at a time
 *      that moves on by itself, held in view) beside the buying column:
 *      name, reference, wishlist and share, the dealer price box, metal,
 *      total carat weight, ring size, quantity, special instructions, the
 *      doors, the delivery countdown and service notes.
 *   2. Jewelry details: Product details and Dealer pricing tabs, the
 *      accordions beside the piece's image. Straight after the price, since
 *      dealers read the details next.
 *   3. Program banners: grow the center stone to order, or go custom.
 *   4. See it in person: the New York office band.
 *   5. Complete the look: a campaign photograph and pieces from other
 *      categories.
 *   6. You may also like: All designs and Similar designs, five across.
 *   7. Explore by center stone (or by metal where pieces have no center).
 *   8. Dealer questions, answered from the live dealer site.
 *   9. The Surreal Assurance, then the footer.
 *
 * A slim action bar rises from the bottom once the main doors scroll away.
 * The metal and carat arrive from the card through ?metal=&ct=, read inside
 * a Suspense boundary whose fallback renders the piece's defaults.
 */

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer, { openContactDrawer } from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import Assurance from "@/components/brand/Assurance";
import { defaultSelection, renderForSelection, type PieceSelection } from "@/components/shop/filters";
import { useWishlist } from "@/components/store/useWishlist";
import { caratOptions, categoryLabel, formatCarat, metals, productById, productMetals, renderSrc, styleRef, type Metal, type Product } from "@/content/catalog";
import { account } from "@/content/site";
import { useDealer } from "@/lib/dealer";
import { addToCart } from "@/lib/cart";
import { recordView } from "@/lib/recent";
import Gallery from "./Gallery";
import DeliveryCountdown from "./DeliveryCountdown";
import { CompleteLook, DealerQuestions, Details, Explore, InPerson, ProgramBanners, Similar } from "./ProductSections";
import s from "./product.module.css";

const SIZED = new Set(["engagement", "wedding-bands", "rings"]);
const RING_SIZES = ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"];

export default function ProductPage({ productId }: { productId: string }) {
  const product = productById(productId);
  if (!product) return null;
  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <Suspense fallback={<ProductView product={product} params={null} />}>
          <WithParams product={product} />
        </Suspense>
        <InPerson product={product} />
        <CompleteLook product={product} />
        <Similar product={product} />
        <Explore product={product} />
        <DealerQuestions />
        <Assurance />
        <Footer />
      </main>
    </>
  );
}

function WithParams({ product }: { product: Product }) {
  const params = useSearchParams();
  return <ProductView product={product} params={params} />;
}

function initialSelection(product: Product, params: URLSearchParams | null): PieceSelection {
  const base = defaultSelection(product, null);
  const metal = params?.get("metal");
  const ct = Number(params?.get("ct"));
  return {
    metal: productMetals(product).includes(metal as Metal) ? (metal as Metal) : base.metal,
    carat: caratOptions[product.category].includes(ct) ? ct : base.carat,
  };
}

function ProductView({ product, params }: { product: Product; params: URLSearchParams | null }) {
  const [selection, setSelection] = useState<PieceSelection>(() => initialSelection(product, params));
  const [size, setSize] = useState<string>("6.5");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [barOn, setBarOn] = useState(false);
  const doorsRef = useRef<HTMLDivElement>(null);
  const { has, toggle } = useWishlist();
  const ref = styleRef(product);
  const sized = SIZED.has(product.category);
  const next = `/jewelry/${product.category}/${product.id}?metal=${selection.metal}&ct=${selection.carat}`;
  const loginHref = `${account.login}?next=${encodeURIComponent(next)}`;
  const metalLabel = metals.find((m) => m.id === selection.metal)?.label ?? "";
  const saved = has(product.id);
  const dealer = useDealer();
  const add = () => addToCart({ productId: product.id, metal: selection.metal, carat: selection.carat, size: sized ? size : null, qty, note: notes.trim() });

  /* The piece joins the dealer's recently viewed list (BRD R-08). */
  useEffect(() => {
    recordView(product.id);
  }, [product.id]);

  /* The action bar rises once the main doors have scrolled above the viewport (checked on scroll, so a jump to the top hides it too). */
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const el = doorsRef.current;
      if (el) setBarOn(el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    frame = window.requestAnimationFrame(check);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const share = async () => {
    const url = window.location.origin + next;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Share sheet dismissed.
    }
  };

  return (
    <>
      <section className={s.top} aria-labelledby="product-title">
        <div className={s.wrap}>
          <nav aria-label="Breadcrumb" className={s.crumbs}>
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/jewelry">Jewelry</Link>
            <span aria-hidden>/</span>
            <Link href={`/jewelry/${product.category}`}>{categoryLabel(product.category)}</Link>
            <span aria-hidden>/</span>
            <span aria-current="page">{product.name}</span>
          </nav>

          <div className={s.layout}>
            <Gallery product={product} selection={selection} />

            <div className={s.info}>
              <div className={s.infoInner}>
                <div className={s.kicker}>
                  <span>{categoryLabel(product.category)}</span>
                  {product.video && <span className={s.kickerTag}>360</span>}
                </div>
                <h1 id="product-title" className={s.name}>
                  {product.name}
                </h1>
                <p className={s.detail}>{product.detail}</p>
                <div className={s.refRow}>
                  {ref && <span className={`${s.ref} tabular`}>Ref. {ref}</span>}
                  <span className={s.refActions}>
                    <button type="button" className={s.iconBtn} aria-pressed={saved} onClick={() => toggle(product.id)} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}>
                      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
                        <path d="M10 16.5s-6.5-3.9-6.5-8.6A3.6 3.6 0 0 1 10 5.6a3.6 3.6 0 0 1 6.5 2.3c0 4.7-6.5 8.6-6.5 8.6Z" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button type="button" className={s.iconBtn} onClick={share} aria-label="Share this piece">
                      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 3v10M6.5 6.5 10 3l3.5 3.5M4 11v5h12v-5" />
                      </svg>
                    </button>
                    {copied && <span className={s.copied}>Link copied</span>}
                  </span>
                </div>

                <div className={s.priceBox}>
                  <span className={s.priceIcon} aria-hidden>
                    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2.5" y="6" width="9" height="6.5" rx="1" />
                      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
                    </svg>
                  </span>
                  {dealer ? (
                    <span className={s.priceText}>
                      <strong>On your dealer price list</strong>
                      <span>Confirmed for {dealer.store} when Surreal accepts your order.</span>
                    </span>
                  ) : (
                    <>
                      <span className={s.priceText}>
                        <strong>Dealer price</strong>
                        <span>Log in to see your price and availability.</span>
                      </span>
                      <Link href={loginHref} className={s.priceLink}>
                        Log in
                      </Link>
                    </>
                  )}
                </div>

                <div className={s.field}>
                  <p className={s.label}>
                    Metal <span className={s.labelValue}>{metalLabel}</span>
                  </p>
                  <div className={s.metalRow}>
                    {metals
                      .filter((m) => productMetals(product).includes(m.id))
                      .map((m) => (
                        <button key={m.id} type="button" className={s.metalBtn} aria-pressed={selection.metal === m.id} onClick={() => setSelection({ ...selection, metal: m.id })}>
                          <span className={s.metalDot} style={{ background: m.swatch }} aria-hidden />
                          {m.label}
                        </button>
                      ))}
                  </div>
                </div>

                <div className={s.field}>
                  <p className={s.label}>
                    Total carat weight <span className={s.labelValue}>{formatCarat(selection.carat)}</span>
                  </p>
                  <div className={s.chipRow}>
                    {caratOptions[product.category].map((ct) => (
                      <button key={ct} type="button" className={s.chip} aria-pressed={selection.carat === ct} onClick={() => setSelection({ ...selection, carat: ct })}>
                        {formatCarat(ct)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={s.fieldRow}>
                  {sized && (
                    <label className={s.field}>
                      <span className={s.label}>Ring size</span>
                      <span className={s.selectWrap}>
                        <select className={s.select} value={size} onChange={(e) => setSize(e.target.value)}>
                          {RING_SIZES.map((x) => (
                            <option key={x} value={x}>
                              US {x}
                            </option>
                          ))}
                        </select>
                      </span>
                    </label>
                  )}
                  <div className={s.field}>
                    <span className={s.label} id="qty-label">
                      Quantity
                    </span>
                    <span className={s.stepper} role="group" aria-labelledby="qty-label">
                      <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="One fewer" disabled={qty <= 1}>
                        −
                      </button>
                      <span className="tabular" aria-live="polite">
                        {qty}
                      </span>
                      <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="One more">
                        +
                      </button>
                    </span>
                  </div>
                </div>

                <label className={s.field}>
                  <span className={s.label}>Special instructions</span>
                  <textarea className={s.textarea} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Engraving, finger size notes, delivery date" />
                </label>

                <div ref={doorsRef} className={s.doors}>
                  {dealer ? (
                    <button type="button" className={s.primary} onClick={add}>
                      Add to cart
                      <svg aria-hidden viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 5.5h13l-.9 10.5H3.4z" />
                        <path d="M6 5.5V4.8a3 3 0 0 1 6 0v.7" />
                      </svg>
                    </button>
                  ) : (
                    <Link href={loginHref} className={s.primary}>
                      Log in to add to cart
                      <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8h10M9 4l4 4-4 4" />
                      </svg>
                    </Link>
                  )}
                  <button type="button" className={s.secondary} onClick={() => openContactDrawer("other", "contact")}>
                    Ask a question
                  </button>
                </div>
                {!dealer && (
                  <p className={s.apply}>
                    Not a Surreal dealer yet? <Link href={account.apply}>Apply for an account</Link>.
                  </p>
                )}

                <DeliveryCountdown />
                <ul className={s.service}>
                  <li>
                    <span className={s.serviceIcon} aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 4h10l4 5-9 11L3 9Z" />
                        <path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5" />
                      </svg>
                    </span>
                    <span>
                      <strong>Grown by Surreal</strong>, the largest CVD grower
                    </span>
                  </li>
                  <li>
                    <span className={s.serviceIcon} aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="3.5" width="16" height="12" rx="1" />
                        <path d="M8 8h8M8 11h5" />
                        <path d="m9 15.5-1 5 4-2 4 2-1-5" />
                      </svg>
                    </span>
                    <span>
                      <strong>Certificates</strong> can be provided on request
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Details product={product} selection={selection} ringSize={sized ? size : null} />
      <ProgramBanners product={product} />

      <div className={s.bar} data-on={barOn ? "true" : undefined} aria-hidden={!barOn} inert={!barOn}>
        <div className={s.barInner}>
          <span className={s.barThumb}>
            <Image src={renderSrc(renderForSelection(product, selection) ?? product.image)} alt="" width={96} height={96} sizes="48px" />
          </span>
          <span className={s.barText}>
            <span className={s.barName}>{product.name}</span>
            <span className={s.barMeta}>
              {metalLabel}, {formatCarat(selection.carat)}
              {sized ? `, size ${size}` : ""}, qty {qty}
            </span>
          </span>
          {dealer ? (
            <button type="button" className={s.primary} onClick={add}>
              Add to cart
            </button>
          ) : (
            <Link href={loginHref} className={s.primary}>
              Log in to add to cart
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
