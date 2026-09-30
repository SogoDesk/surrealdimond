"use client";

/**
 * The Retailer Dashboard home (BRD 5.7; R-25, R-29, R-30, B-03), inside the
 * dashboard shell. Everything on it is the signed-in dealer's own:
 *
 * 1. Greeting with the store name and New York time of day, today's date,
 *    and the dashboard search (R-29).
 * 2. Quick doors: shop the catalog, diamond search, Made to Order, custom
 *    request, schedule an appointment.
 * 3. Four figures: orders placed, stones on memo, the cart, and the next day
 *    delivery countdown.
 * 4. Recent orders with Reorder (R-25: an exact previous order back in the
 *    cart in one click; loose stones are one of a kind and stay out).
 * 5. On memo, and your requests (M2O and Custom) with their numbers.
 * 6. Recently viewed pieces.
 * 7. Resources: the Grow your store and Your account sections as tiles.
 * 8. The feedback line to We Want to Hear From You.
 */

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import DeliveryCountdown from "@/components/product/DeliveryCountdown";
import { productById, productHref, renderSrc, type Product } from "@/content/catalog";
import { dashSections } from "@/content/dashboard";
import { stoneById, stoneTitle } from "@/content/diamonds";
import { groundStyle } from "@/content/grounds";
import { account } from "@/content/site";
import { addToCart, caratTotal, pieceCount, useCart, useOrders, type PlacedOrder } from "@/lib/cart";
import { useDealer } from "@/lib/dealer";
import { useMemos } from "@/lib/memo";
import { useRecent } from "@/lib/recent";
import { useCustomRequests, useM2ORequests } from "@/lib/requests";
import DashIcon from "./DashIcon";
import DashSearch from "./DashSearch";
import s from "./dashboard.module.css";

const PAYMENT: Record<PlacedOrder["payment"], string> = { card: "Card", ach: "ACH", wire: "Wire" };
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function nyGreeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardHome() {
  const dealer = useDealer();
  const orders = useOrders();
  const cart = useCart();
  const memos = useMemos();
  const recent = useRecent();
  const m2o = useM2ORequests();
  const custom = useCustomRequests();
  const [reordered, setReordered] = useState<string | null>(null);
  if (!dealer) return null;

  const inCart = pieceCount(cart);
  const reorder = (o: PlacedOrder) => {
    o.lines.filter((l) => !l.stoneId).forEach((l) => addToCart({ productId: l.productId, metal: l.metal, carat: l.carat, size: l.size, qty: l.qty, note: l.note }));
    setReordered(o.number);
  };
  const viewed = recent
    .map((id) => productById(id))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 6);
  const requests = [
    ...m2o.map((r) => ({ number: r.number, what: `Made to Order, ${Number(r.size).toFixed(2)} ct ${r.shape === "other" ? "stone" : r.shape}`, at: r.sentAt, href: "/diamonds/made-to-order" })),
    ...custom.map((r) => ({ number: r.number, what: `Custom ${r.item.toLowerCase()}, ${r.carat} ${r.shape.toLowerCase()}`, at: r.sentAt, href: "/custom" })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4);
  const resources = dashSections.filter((d) => d.group === "Grow your store" || d.group === "Your account");
  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" });

  return (
    <div className={s.home}>
      <header className={s.homeHead}>
        <div>
          <p className={s.kicker}>{today}</p>
          <h1 className={s.homeTitle}>
            {nyGreeting()}, <em>{dealer.store}</em>
          </h1>
        </div>
        <DashSearch />
      </header>

      <nav className={s.quick} aria-label="Quick doors">
        <Link href="/jewelry" className={s.quickDoor}>
          Shop the catalog
        </Link>
        <Link href="/diamonds" className={s.quickDoor}>
          Diamond search
        </Link>
        <Link href="/diamonds/made-to-order" className={s.quickDoor}>
          Made to Order
        </Link>
        <Link href="/custom" className={s.quickDoor}>
          Custom request
        </Link>
        <button type="button" className={s.quickDoor} onClick={() => openContactDrawer("appointment", "visit")}>
          Schedule an appointment
        </button>
      </nav>

      <dl className={s.stats}>
        <div className={s.stat}>
          <dt>Orders placed</dt>
          <dd className="tabular">{orders.length}</dd>
          <span>{orders[0] ? `Last on ${shortDate(orders[0].placedAt)}` : "None yet"}</span>
        </div>
        <div className={s.stat}>
          <dt>Stones on memo</dt>
          <dd className="tabular">{memos.length}</dd>
          <Link href="/dashboard/memo">Open memo items</Link>
        </div>
        <div className={s.stat}>
          <dt>In your cart</dt>
          <dd className="tabular">{inCart}</dd>
          {inCart ? <Link href={account.cart}>{caratTotal(cart)} ct total, check out</Link> : <span>Empty</span>}
        </div>
        <div className={`${s.stat} ${s.statDelivery}`}>
          <dt>Next day delivery</dt>
          <DeliveryCountdown />
        </div>
      </dl>

      <div className={s.cols}>
        <section className={s.panel} id="reorder" aria-labelledby="dash-orders">
          <div className={s.panelHead}>
            <h2 id="dash-orders" className={s.panelTitle}>
              Recent orders
            </h2>
            <Link href="/dashboard/orders" className={s.textLink}>
              All orders
            </Link>
          </div>
          {reordered && (
            <p className={s.notice} role="status">
              {reordered} is back in your cart.{" "}
              <Link href={account.cart} className={s.textLink}>
                Review the cart
              </Link>
            </p>
          )}
          {orders.length === 0 ? (
            <div className={s.empty}>
              <p>Your orders appear here, each ready to reorder in one click.</p>
              <Link href="/jewelry" className={s.secondary}>
                Shop the catalog
              </Link>
            </div>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Placed</th>
                    <th scope="col">Pieces</th>
                    <th scope="col">Payment</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className={s.srOnly}>Reorder</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((o) => {
                    const jewelry = o.lines.filter((l) => !l.stoneId);
                    const stonesIn = o.lines.length - jewelry.length;
                    return (
                      <tr key={o.number}>
                        <th scope="row" className="tabular">
                          {o.number}
                        </th>
                        <td>{shortDate(o.placedAt)}</td>
                        <td className="tabular">
                          {pieceCount(o.lines)}
                          {stonesIn > 0 && <span className={s.cellNote}> incl. {stonesIn} {stonesIn === 1 ? "stone" : "stones"}</span>}
                        </td>
                        <td>{PAYMENT[o.payment]}</td>
                        <td>
                          <span className={s.status}>Received</span>
                        </td>
                        <td className={s.cellAction}>
                          <button type="button" className={s.reorder} disabled={jewelry.length === 0} onClick={() => reorder(o)} title={jewelry.length === 0 ? "Loose stones are one of a kind" : undefined}>
                            Reorder
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className={s.sideCol}>
          <section className={s.panel} aria-labelledby="dash-memo">
            <div className={s.panelHead}>
              <h2 id="dash-memo" className={s.panelTitle}>
                On memo
              </h2>
              <Link href="/dashboard/memo" className={s.textLink}>
                Report
              </Link>
            </div>
            {memos.length === 0 ? (
              <div className={s.empty}>
                <p>Stones you request on memo appear here.</p>
                <Link href="/diamonds" className={s.textLink}>
                  Find a stone
                </Link>
              </div>
            ) : (
              <ul className={s.list}>
                {memos.slice(0, 4).map((m) => {
                  const st = stoneById(m.stoneId);
                  return (
                    <li key={m.number}>
                      <span>
                        <strong>{st ? stoneTitle(st) : m.stoneId}</strong>
                        {st ? `${st.color} ${st.clarity}, stock ${st.id}` : ""}
                      </span>
                      <span className={s.listMeta}>
                        {m.number}
                        <br />
                        {shortDate(m.requestedAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={s.panel} aria-labelledby="dash-requests">
            <div className={s.panelHead}>
              <h2 id="dash-requests" className={s.panelTitle}>
                Your requests
              </h2>
            </div>
            {requests.length === 0 ? (
              <div className={s.empty}>
                <p>Made to Order and custom requests you send appear here with their numbers.</p>
                <span className={s.emptyLinks}>
                  <Link href="/diamonds/made-to-order" className={s.textLink}>
                    Made to Order
                  </Link>
                  <Link href="/custom" className={s.textLink}>
                    Custom Portal
                  </Link>
                </span>
              </div>
            ) : (
              <ul className={s.list}>
                {requests.map((r) => (
                  <li key={r.number}>
                    <span>
                      <strong className="tabular">{r.number}</strong>
                      {r.what}
                    </span>
                    <span className={s.listMeta}>
                      <span className={s.status}>Sent</span>
                      <br />
                      {shortDate(r.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className={s.panel} aria-labelledby="dash-viewed">
        <div className={s.panelHead}>
          <h2 id="dash-viewed" className={s.panelTitle}>
            Recently viewed
          </h2>
          <Link href="/jewelry" className={s.textLink}>
            Catalog
          </Link>
        </div>
        {viewed.length === 0 ? (
          <div className={s.empty}>
            <p>Pieces you open appear here, so you can get back to them quickly.</p>
          </div>
        ) : (
          <ul className={s.viewed}>
            {viewed.map((p) => (
              <li key={p.id}>
                <Link href={productHref(p)} className={s.viewedLink}>
                  <span className={s.viewedWell} style={groundStyle(p.category)}>
                    <Image src={renderSrc(p.image)} alt="" width={300} height={300} sizes="140px" />
                  </span>
                  <span className={s.viewedName}>{p.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="dash-resources">
        <div className={s.panelHead}>
          <h2 id="dash-resources" className={s.sectionTitle}>
            Resources for <em>your store</em>
          </h2>
        </div>
        <ul className={s.tiles}>
          {resources.map((d) => (
            <li key={d.id}>
              <Link href={d.href} className={s.tile}>
                <span className={s.tileIcon}>
                  <DashIcon id={d.icon} />
                </span>
                <span className={s.tileText}>
                  <strong>{d.label}</strong>
                  {d.line}
                </span>
                {d.status !== "live" && <span className={s.tileTag}>{d.status === "next" ? "Next" : "Soon"}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className={s.feedback}>
        How are we doing?{" "}
        <Link href="/contact?type=feedback" className={s.textLink}>
          We want to hear from you
        </Link>
      </p>
    </div>
  );
}
