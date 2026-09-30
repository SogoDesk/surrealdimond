"use client";

/**
 * The signed-in dealer's homepage band (BRD R-08, R-30, B-03), in the WB
 * Mason account-home manner: it sits under the hero in place of the dealer
 * pitch. A greeting with the store name and the time of day in New York,
 * quick doors (cart, dashboard, diamond search, custom request,
 * appointment), then three cards: quick reorder from past orders (one click
 * per line, or the whole last order; loose stones are one of a kind and never
 * reorder), recently viewed pieces, and the
 * account card (cart, delivery countdown, last order). Signed out it renders
 * nothing.
 */

import Image from "next/image";
import Link from "next/link";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import DeliveryCountdown from "@/components/product/DeliveryCountdown";
import { formatCarat, metals, productById, productHref, renderSrc, type Product } from "@/content/catalog";
import { groundStyle } from "@/content/grounds";
import { account } from "@/content/site";
import { addToCart, pieceCount, useCart, useOrders, type CartLine } from "@/lib/cart";
import { useDealer } from "@/lib/dealer";
import { useRecent } from "@/lib/recent";
import s from "./DealerHome.module.css";

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

const reorder = (l: CartLine) => addToCart({ productId: l.productId, metal: l.metal, carat: l.carat, size: l.size, qty: l.qty, note: l.note });

function Thumb({ p, metal }: { p: Product; metal?: string }) {
  const slug = (metal && p.variants?.[metal as keyof typeof p.variants]) || p.image;
  return (
    <span className={s.thumb} style={groundStyle(p.category)}>
      <Image src={renderSrc(slug)} alt="" width={160} height={160} sizes="64px" />
    </span>
  );
}

export default function DealerHome() {
  const dealer = useDealer();
  const orders = useOrders();
  const recent = useRecent();
  const cart = useCart();
  if (!dealer) return null;

  const last = orders[0];
  const seen = new Set<string>();
  const reorderLines = orders
    .flatMap((o) => o.lines)
    .filter((l) => !l.stoneId)
    .filter((l) => (seen.has(l.key) ? false : (seen.add(l.key), true)))
    .slice(0, 4);
  const viewed = recent.map((id) => productById(id)).filter((p): p is Product => Boolean(p)).slice(0, 4);
  const inCart = pieceCount(cart);

  return (
    <section className={s.section} aria-labelledby="dealer-home-title">
      <div className={s.wrap}>
        <div className={s.head}>
          <div className={s.hello}>
            <span className={s.avatar} aria-hidden>
              {dealer.store
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase())
                .join("")}
            </span>
            <div>
              <p className={s.kicker}>Your store at a glance</p>
              <h2 id="dealer-home-title" className={s.title}>
                {greeting()}, <em>{dealer.store}</em>
              </h2>
            </div>
          </div>
          <nav className={s.doors} aria-label="Quick links">
            <Link href={account.cart} className={s.door}>
              Cart <span className={s.doorCount}>{inCart}</span>
            </Link>
            <Link href={account.dashboard} className={s.door}>
              Retailer Dashboard
            </Link>
            <Link href="/diamonds" className={s.door}>
              Diamond Search
            </Link>
            <Link href="/custom" className={s.door}>
              Custom request
            </Link>
            <button type="button" className={s.door} onClick={() => openContactDrawer("other", "visit")}>
              Appointment
            </button>
          </nav>
        </div>

        <div className={s.grid}>
          <article className={s.card}>
            <div className={s.cardHead}>
              <p className={s.cardTitle}>Quick reorder</p>
              {last && (
                <button type="button" className={s.textBtn} onClick={() => last.lines.filter((l) => !l.stoneId).forEach(reorder)}>
                  Reorder all of {last.number}
                </button>
              )}
            </div>
            {reorderLines.length === 0 ? (
              <div className={s.empty}>
                <p>Pieces from your orders appear here, ready to reorder in one click.</p>
                <Link href="/jewelry" className={s.emptyLink}>
                  Browse the catalog
                </Link>
              </div>
            ) : (
              <ul className={s.list}>
                {reorderLines.map((l) => {
                  const p = productById(l.productId);
                  if (!p) return null;
                  return (
                    <li key={l.key} className={s.row}>
                      <Thumb p={p} metal={l.metal} />
                      <span className={s.rowText}>
                        <Link href={`${productHref(p)}?metal=${l.metal}&ct=${l.carat}`} className={s.rowName}>
                          {p.name}
                        </Link>
                        <span className={s.rowMeta}>
                          {metals.find((m) => m.id === l.metal)?.label}, {formatCarat(l.carat)}
                          {l.size ? `, size ${l.size}` : ""}, qty {l.qty}
                        </span>
                      </span>
                      <button type="button" className={s.reorder} onClick={() => reorder(l)}>
                        Reorder
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className={s.card}>
            <div className={s.cardHead}>
              <p className={s.cardTitle}>Recently viewed</p>
              <Link href="/jewelry" className={s.textBtn}>
                Catalog
              </Link>
            </div>
            {viewed.length === 0 ? (
              <div className={s.empty}>
                <p>Pieces you open appear here, so you can get back to them quickly.</p>
                <Link href="/jewelry/engagement" className={s.emptyLink}>
                  Start with engagement rings
                </Link>
              </div>
            ) : (
              <ul className={s.viewed}>
                {viewed.map((p) => (
                  <li key={p.id}>
                    <Link href={productHref(p)} className={s.viewedLink}>
                      <span className={s.viewedWell} style={groundStyle(p.category)}>
                        <Image src={renderSrc(p.image)} alt="" width={300} height={300} sizes="120px" />
                      </span>
                      <span className={s.viewedName}>{p.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className={`${s.card} ${s.cardAccount}`}>
            <div className={s.cardHead}>
              <p className={s.cardTitle}>Your account</p>
              {dealer.demo && <span className={s.previewTag}>Preview</span>}
            </div>
            <dl className={s.stats}>
              <div>
                <dt>In your cart</dt>
                <dd className="tabular">
                  {inCart} {inCart === 1 ? "piece" : "pieces"}
                </dd>
              </div>
              <div>
                <dt>Orders placed</dt>
                <dd className="tabular">{orders.length}</dd>
              </div>
              <div>
                <dt>Last order</dt>
                <dd className="tabular">{last ? last.number : "None yet"}</dd>
              </div>
            </dl>
            <DeliveryCountdown />
            <Link href={inCart ? "/checkout" : "/jewelry"} className={s.primary}>
              {inCart ? "Checkout" : "Shop the catalog"}
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
