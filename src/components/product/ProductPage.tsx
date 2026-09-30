"use client";

/**
 * Product page, on Tanishq's product pattern in the Surreal system
 * (docs/CONTEXT.md, "UX reference"). Left: the gallery, a two-up grid of
 * square views on white (the turntable first when the piece has one, then
 * the renders); on phones a swipe row with a counter. Right, held in view
 * while the gallery scrolls: category, name, reference, the dealer price box,
 * the selectors (metal, total carat weight, ring size where it applies,
 * quantity), special instructions, the two doors (Log in to add to cart, Ask
 * a question) and service notes. Then the details panel, similar designs,
 * the programs band and the footer. A slim action bar rises from the bottom
 * once the main doors scroll out of view.
 *
 * The metal and carat arrive from the card through ?metal=&ct= and are read
 * inside a Suspense boundary; the fallback renders the piece's defaults.
 */

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer, { openContactDrawer } from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import ProgramsBand from "@/components/shop/ProgramsBand";
import Placeholder from "@/components/shop/Placeholder";
import { defaultSelection, renderForSelection, type PieceSelection } from "@/components/shop/filters";
import StoreCard from "@/components/store/StoreCard";
import { useWishlist } from "@/components/store/useWishlist";
import {
  caratOptions,
  categories,
  categoryLabel,
  formatCarat,
  metals,
  productById,
  productMetals,
  productViews,
  products,
  renderSrc,
  shapes,
  styleRef,
  videoSrc,
  type Metal,
  type Product,
} from "@/content/catalog";
import { account } from "@/content/site";
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
        <Similar product={product} />
        <ProgramsBand />
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
    metal: metals.some((m) => m.id === metal) ? (metal as Metal) : base.metal,
    carat: caratOptions[product.category].includes(ct) ? ct : base.carat,
  };
}

function Gallery({ product, selection }: { product: Product; selection: PieceSelection }) {
  const primary = renderForSelection(product, selection);
  const views = useMemo(() => {
    const rest = productViews(product).filter((v) => v !== primary);
    return primary ? [primary, ...rest] : rest;
  }, [product, primary]);
  const video = product.video ? videoSrc(product.video) : null;
  const rowRef = useRef<HTMLUListElement>(null);
  const [at, setAt] = useState(0);
  const total = views.length + (video ? 1 : 0) + (primary ? 0 : 1);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const onScroll = () => setAt(Math.round(row.scrollLeft / Math.max(1, row.clientWidth)));
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => row.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={s.gallery}>
      <ul ref={rowRef} className={s.views} aria-label={`${product.name}, views`}>
        {!primary && (
          <li className={`${s.view} ${s.viewWide}`}>
            <Placeholder metal={selection.metal} carat={selection.carat} size="stage" className={s.viewPlaceholder} />
          </li>
        )}
        {views.slice(0, 1).map((v) => (
          <li key={v} className={`${s.view} ${primary ? s.viewWide : ""}`}>
            <Image src={renderSrc(v)} alt={`${product.name}, ${product.detail}`} width={1200} height={1200} sizes="(min-width: 1024px) 50vw, 100vw" priority className={s.viewImage} />
          </li>
        ))}
        {video && (
          <li className={s.view}>
            <video className={s.viewVideo} src={video.mp4} poster={video.poster} muted playsInline loop autoPlay preload="metadata" aria-label={`${product.name} turning on the turntable`} />
            <span className={s.viewTag}>360 turntable</span>
          </li>
        )}
        {views.slice(1, 6).map((v) => (
          <li key={v} className={s.view}>
            <Image src={renderSrc(v)} alt="" width={1200} height={1200} sizes="(min-width: 1024px) 25vw, 100vw" className={s.viewImage} />
          </li>
        ))}
      </ul>
      <span className={s.viewCount} aria-hidden>
        {Math.min(at + 1, total)} / {total}
      </span>
    </div>
  );
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
  const shape = shapes.find((x) => x.id === product.shape)?.label;
  const shown = productMetals(product);
  const sized = SIZED.has(product.category);
  const cat = categories.find((c) => c.id === product.category);
  const next = `/jewelry/${product.category}/${product.id}?metal=${selection.metal}&ct=${selection.carat}`;
  const loginHref = `${account.login}?next=${encodeURIComponent(next)}`;
  const metalLabel = metals.find((m) => m.id === selection.metal)?.label ?? "";

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
                    <button type="button" className={s.iconBtn} aria-pressed={has(product.id)} onClick={() => toggle(product.id)} aria-label={has(product.id) ? "Remove from wishlist" : "Save to wishlist"}>
                      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
                        <path d="M10 16.5s-6.5-3.9-6.5-8.6A3.6 3.6 0 0 1 10 5.6a3.6 3.6 0 0 1 6.5 2.3c0 4.7-6.5 8.6-6.5 8.6Z" fill={has(product.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
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
                  <span className={s.priceText}>
                    <strong>Dealer price</strong>
                    <span>Log in to see your price and availability.</span>
                  </span>
                  <Link href={loginHref} className={s.priceLink}>
                    Log in
                  </Link>
                </div>

                <div className={s.field}>
                  <p className={s.label}>
                    Metal <span className={s.labelValue}>{metalLabel}</span>
                  </p>
                  <div className={s.metalRow}>
                    {metals.map((m) => (
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
                  <Link href={loginHref} className={s.primary}>
                    Log in to add to cart
                    <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </Link>
                  <button type="button" className={s.secondary} onClick={() => openContactDrawer("other", "contact")}>
                    Ask a question
                  </button>
                </div>
                <p className={s.apply}>
                  Not a Surreal dealer yet? <Link href={account.apply}>Apply for an account</Link>.
                </p>

                <ul className={s.service}>
                  <li>
                    <ServiceIcon kind="truck" />
                    <span>
                      <strong>Next day delivery</strong> for dealer orders placed before 4:00pm EST
                    </span>
                  </li>
                  <li>
                    <ServiceIcon kind="gem" />
                    <span>
                      <strong>Grown by Surreal</strong>, lab grown CVD diamonds from the largest CVD grower
                    </span>
                  </li>
                  <li>
                    <ServiceIcon kind="cert" />
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

      <section className={s.details} aria-labelledby="details-title">
        <div className={s.wrap}>
          <h2 id="details-title" className={s.sectionTitle}>
            Jewelry <em>details</em>
          </h2>
          <div className={s.detailGrid}>
            <div className={s.detailCard}>
              <p className={s.detailHead}>Piece</p>
              <dl className={s.specs}>
                <div>
                  <dt>Category</dt>
                  <dd>{categoryLabel(product.category)}</dd>
                </div>
                {ref && (
                  <div>
                    <dt>Reference</dt>
                    <dd className="tabular">{ref}</dd>
                  </div>
                )}
                <div>
                  <dt>Design</dt>
                  <dd>{product.detail}</dd>
                </div>
                {shape && (
                  <div>
                    <dt>Center stone</dt>
                    <dd>{shape}</dd>
                  </div>
                )}
                <div>
                  <dt>Turntable</dt>
                  <dd>{product.video ? "360 video" : "Renders"}</dd>
                </div>
              </dl>
            </div>
            <div className={s.detailCard}>
              <p className={s.detailHead}>Metal</p>
              <dl className={s.specs}>
                <div>
                  <dt>Pictured in</dt>
                  <dd>{shown.map((m) => metals.find((x) => x.id === m)?.label).join(", ")}</dd>
                </div>
                <div>
                  <dt>Made to order in</dt>
                  <dd>{metals.map((m) => m.label).join(", ")}</dd>
                </div>
                <div>
                  <dt>Selected</dt>
                  <dd>{metalLabel}</dd>
                </div>
              </dl>
            </div>
            <div className={s.detailCard}>
              <p className={s.detailHead}>Diamonds</p>
              <dl className={s.specs}>
                <div>
                  <dt>Origin</dt>
                  <dd>Lab grown, CVD, by Surreal</dd>
                </div>
                <div>
                  <dt>Total carat weight</dt>
                  <dd>{caratOptions[product.category].map(formatCarat).join(", ")}</dd>
                </div>
                <div>
                  <dt>Selected</dt>
                  <dd>{formatCarat(selection.carat)}</dd>
                </div>
              </dl>
            </div>
            <div className={`${s.detailCard} ${s.detailText}`}>
              <p className={s.detailHead}>Description</p>
              <p>
                {product.name}: {product.detail.toLowerCase()}. {cat?.blurb}
              </p>
              <button type="button" className={s.textLink} onClick={() => openContactDrawer("other", "contact")}>
                Ask about this piece
              </button>
            </div>
          </div>
        </div>
      </section>

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
          <Link href={loginHref} className={s.primary}>
            Log in to add to cart
          </Link>
        </div>
      </div>
    </>
  );
}

function ServiceIcon({ kind }: { kind: "truck" | "gem" | "cert" }) {
  return (
    <span className={s.serviceIcon} aria-hidden>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        {kind === "truck" && (
          <>
            <path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7" />
            <circle cx="7" cy="17.5" r="1.6" />
            <circle cx="17" cy="17.5" r="1.6" />
          </>
        )}
        {kind === "gem" && (
          <>
            <path d="M7 4h10l4 5-9 11L3 9Z" />
            <path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5" />
          </>
        )}
        {kind === "cert" && (
          <>
            <rect x="4" y="3.5" width="16" height="12" rx="1" />
            <path d="M8 8h8M8 11h5" />
            <path d="m9 15.5-1 5 4-2 4 2-1-5" />
          </>
        )}
      </svg>
    </span>
  );
}

function Similar({ product }: { product: Product }) {
  const [mode, setMode] = useState<"category" | "shape">("category");
  const sameCategory = products.filter((p) => p.category === product.category && p.id !== product.id);
  const sameShape = product.shape ? products.filter((p) => p.shape === product.shape && p.id !== product.id) : [];
  const list = (mode === "shape" && sameShape.length ? sameShape : sameCategory).slice(0, 10);
  if (list.length === 0) return null;
  return (
    <section className={s.similar} aria-labelledby="similar-title">
      <div className={s.wrap}>
        <div className={s.similarHead}>
          <h2 id="similar-title" className={s.sectionTitle}>
            You may <em>also like</em>
          </h2>
          <div className={s.tabs} role="tablist" aria-label="Similar pieces">
            <button type="button" role="tab" aria-selected={mode === "category"} className={s.tab} onClick={() => setMode("category")}>
              {categoryLabel(product.category)}
            </button>
            {sameShape.length > 0 && (
              <button type="button" role="tab" aria-selected={mode === "shape"} className={s.tab} onClick={() => setMode("shape")}>
                Same center stone
              </button>
            )}
          </div>
        </div>
      </div>
      <ul className={s.similarRail}>
        {list.map((p) => (
          <li key={p.id} className={s.similarItem}>
            <StoreCard product={p} preferredMetal={null} />
          </li>
        ))}
      </ul>
    </section>
  );
}
