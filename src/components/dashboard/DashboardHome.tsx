"use client";

/**
 * The Retailer Dashboard home (BRD 5.7; R-25, R-29, R-30, B-03), trimmed
 * after the client's feedback of 27 October 2026 to put the account first.
 * Everything on it is the signed-in dealer's own:
 *
 * 1. Greeting with the store name and New York time of day, and the
 *    dashboard search (R-29).
 * 2. The account (owner): balance due with its aging, past due, the next due
 *    date and credit available, with Pay invoices and Statement. Associates,
 *    who do not see billing, get their orders and memo figures instead.
 * 3. Open invoices beside recent orders with Reorder (R-25: an exact
 *    previous order back in the cart in one click; loose stones stay out).
 * 4. On memo, and the dealer's M2O and custom requests with their numbers.
 * 5. Quick doors and the next day delivery countdown.
 *
 * Recently viewed and the resource tiles are gone with the trimmed
 * navigation (docs/TASKS.md, F-D3).
 */

import Link from "next/link";
import { useState } from "react";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import { CUSTOM_PORTAL_URL } from "@/content/dashboard";
import DeliveryCountdown from "@/components/product/DeliveryCountdown";
import { stoneById, stoneTitle } from "@/content/diamonds";
import { account } from "@/content/site";
import { addToCart, pieceCount, useOrders, type PlacedOrder } from "@/lib/cart";
import { useDealer } from "@/lib/dealer";
import { useMemos } from "@/lib/memo";
import { AGING_ORDER, canSeeBilling, formatMoney, useAccount } from "@/lib/invoices";
import { m2oSize, useCustomRequests, useM2ORequests } from "@/lib/requests";
import DashSearch from "./DashSearch";
import s from "./dashboard.module.css";

const PAYMENT: Record<PlacedOrder["payment"], string> = { card: "Card", ach: "ACH", wire: "Wire" };
const AGING_TONE = { current: "#2e9e6b", d30: "#c08a1e", d60: "#d0702a", d90: "#c2503a", d90plus: "#8f2626" } as const;
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function nyGreeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardHome() {
  const dealer = useDealer();
  const orders = useOrders();
  const memos = useMemos();
  const acct = useAccount();
  const m2o = useM2ORequests();
  const custom = useCustomRequests();
  const [reordered, setReordered] = useState<string | null>(null);
  if (!dealer) return null;

  const billing = canSeeBilling(dealer) && acct;
  const openInvoices = acct ? acct.invoices.filter((i) => i.state === "open").sort((a, b) => b.overdue - a.overdue || a.due.localeCompare(b.due)) : [];
  const agingTotal = acct ? AGING_ORDER.reduce((sum, b) => sum + acct.summary.aging[b], 0) : 0;
  const reorder = (o: PlacedOrder) => {
    o.lines.filter((l) => !l.stoneId).forEach((l) => addToCart({ productId: l.productId, metal: l.metal, carat: l.carat, size: l.size, qty: l.qty, note: l.note }));
    setReordered(o.number);
  };
  const requests = [
    ...m2o.map((r) => ({ number: r.number, what: `Made to Order, ${m2oSize(r)} ${r.shape === "other" ? "stone" : r.shape}`, at: r.sentAt, href: "/diamonds/made-to-order" })),
    ...custom.map((r) => ({ number: r.number, what: `Custom ${r.item.toLowerCase()}, ${r.carat} ${r.shape.toLowerCase()}`, at: r.sentAt, href: "/custom" })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4);
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

      {billing && acct ? (
        <section className={s.accountBand} aria-labelledby="dash-account">
          <dl className={s.balanceCard}>
            <div>
              <dt id="dash-account">Balance due</dt>
              <dd className="tabular">{formatMoney(acct.summary.balance)}</dd>
            </div>
            <div className={s.miniAging} aria-hidden>
              {AGING_ORDER.filter((b) => acct.summary.aging[b] > 0).map((b) => (
                <span key={b} style={{ flexGrow: agingTotal ? acct.summary.aging[b] / agingTotal : 0, background: AGING_TONE[b] }} />
              ))}
            </div>
            <div className={s.balanceMeta}>
              <span data-alert={acct.summary.pastDue > 0 ? "" : undefined}>
                Past due <strong className="tabular">{formatMoney(acct.summary.pastDue)}</strong>
              </span>
              <span>
                {acct.summary.openCount} open {acct.summary.openCount === 1 ? "invoice" : "invoices"}
              </span>
              {acct.summary.nextDue && <span>Next due {shortDate(acct.summary.nextDue)}</span>}
            </div>
            <div className={s.balanceDoors}>
              <Link href="/dashboard/invoices" className={s.primaryLight}>
                Pay invoices
              </Link>
              <Link href="/dashboard/invoices?tab=statement" className={s.ghostLight}>
                Statement
              </Link>
            </div>
          </dl>
          <dl className={s.sideStats}>
            <div className={s.stat}>
              <dt>Credit available</dt>
              <dd className="tabular">{formatMoney(acct.summary.available)}</dd>
              <span>Of {formatMoney(acct.summary.creditLimit)}</span>
            </div>
            <div className={s.stat}>
              <dt>On memo</dt>
              <dd className="tabular">{formatMoney(acct.summary.memoBalance)}</dd>
              <Link href="/dashboard/memo">Open memo items</Link>
            </div>
            <div className={s.stat}>
              <dt>Last payment</dt>
              <dd className="tabular">{acct.summary.lastPayment ? formatMoney(acct.summary.lastPayment.amount) : "None"}</dd>
              <span>{acct.summary.lastPayment ? `${shortDate(acct.summary.lastPayment.date)}${acct.summary.lastPayment.pending ? ", pending posting" : ""}` : "No payments yet"}</span>
            </div>
            <div className={`${s.stat} ${s.statDelivery}`}>
              <dt>Next day delivery</dt>
              <DeliveryCountdown />
            </div>
          </dl>
        </section>
      ) : (
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
            <dt>Your login</dt>
            <dd className={s.statWord}>Associate</dd>
            <span>Billing is with your account owner</span>
          </div>
          <div className={`${s.stat} ${s.statDelivery}`}>
            <dt>Next day delivery</dt>
            <DeliveryCountdown />
          </div>
        </dl>
      )}

      <div className={s.cols} data-billing={billing ? "" : undefined}>
        {billing && (
          <section className={s.panel} aria-labelledby="dash-invoices">
            <div className={s.panelHead}>
              <h2 id="dash-invoices" className={s.panelTitle}>
                Open invoices
              </h2>
              <Link href="/dashboard/invoices" className={s.textLink}>
                All invoices
              </Link>
            </div>
            {openInvoices.length === 0 ? (
              <div className={s.empty}>
                <p>No open invoices. Your account is up to date.</p>
              </div>
            ) : (
              <ul className={s.invoiceList}>
                {openInvoices.slice(0, 5).map((inv) => (
                  <li key={inv.id}>
                    <Link href={`/dashboard/invoices/${inv.id}`}>Invoice {inv.number}</Link>
                    <strong className="tabular">{formatMoney(inv.balance)}</strong>
                    <span className={s.invoiceDue} data-late={inv.overdue > 0 ? "" : undefined}>
                      <span>{inv.po || inv.reference}</span>
                      <span>{inv.overdue > 0 ? `${inv.overdue} days past due` : `Due ${shortDate(inv.due)}`}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
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
                  <a href={CUSTOM_PORTAL_URL} className={s.textLink} target="_blank" rel="noreferrer">
                    Custom portal
                  </a>
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
        <Link href="/legacy" className={s.quickDoor}>
          Diamond Legacy
        </Link>
        <a href={CUSTOM_PORTAL_URL} className={s.quickDoor} target="_blank" rel="noreferrer">
          Custom jewelry portal
        </a>
        <button type="button" className={s.quickDoor} onClick={() => openContactDrawer("appointment", "visit")}>
          Schedule an appointment
        </button>
      </nav>

      <p className={s.feedback}>
        How are we doing?{" "}
        <Link href="/contact?type=feedback" className={s.textLink}>
          We want to hear from you
        </Link>
      </p>
    </div>
  );
}
