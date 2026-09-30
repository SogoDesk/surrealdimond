"use client";

/**
 * Orders (BRD R-25, inside the dashboard shell): the dealer's order history
 * with reorder in a couple of clicks, in the WB Mason manner.
 *
 * - Frequently reordered: the pieces the store orders most, each back in the
 *   cart in one click with the same metal, carat weight, size and quantity.
 * - A toolbar: search by order number, piece, stock ID or PO; placed in the
 *   last 30 or 90 days or this year; download the history as CSV.
 * - One card per order: number, date, pieces and carats, payment, status,
 *   Reorder all. Opening it shows the status steps, every line with its own
 *   Reorder (or Change and reorder on the product page), and the store
 *   details the order was placed with. Loose stones are one of a kind (B-01),
 *   so their lines offer the diamond search instead.
 *
 * Orders come from this browser's checkout until the order system connects;
 * status beyond Received arrives with it.
 */

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import ShapeIcon from "@/components/brand/ShapeIcon";
import { formatCarat, metals, productById, productHref, renderSrc, type Product } from "@/content/catalog";
import { stoneById, stoneTitle } from "@/content/diamonds";
import { groundStyle } from "@/content/grounds";
import { account } from "@/content/site";
import { addToCart, caratTotal, pieceCount, useOrders, type CartLine, type PlacedOrder } from "@/lib/cart";
import { downloadCsv } from "@/lib/csv";
import { useNow } from "@/lib/useNow";
import s from "./pages.module.css";

const PAYMENT: Record<PlacedOrder["payment"], string> = { card: "Credit or debit card", ach: "ACH", wire: "Wire transfer" };
const STEPS = ["Received", "Confirmed", "Shipped", "Delivered"];
const RANGES = [
  { id: "all", label: "All time" },
  { id: "30", label: "Last 30 days" },
  { id: "90", label: "Last 90 days" },
  { id: "year", label: "This year" },
] as const;
type Range = (typeof RANGES)[number]["id"];

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const metalLabel = (m: string) => metals.find((x) => x.id === m)?.label ?? m;
const again = (l: CartLine) => addToCart({ productId: l.productId, metal: l.metal, carat: l.carat, size: l.size, qty: l.qty, note: l.note });

function Thumb({ line }: { line: CartLine }) {
  if (line.stoneId) {
    const st = stoneById(line.stoneId);
    return <span className={s.thumbStone}>{st && <ShapeIcon shape={st.shape} detail />}</span>;
  }
  const p = productById(line.productId);
  if (!p) return <span className={s.thumb} />;
  const slug = p.variants?.[line.metal] ?? p.image;
  return (
    <span className={s.thumb} style={groundStyle(p.category)}>
      <Image src={renderSrc(slug)} alt="" width={160} height={160} sizes="64px" />
    </span>
  );
}

function lineName(l: CartLine): { name: string; meta: string; product?: Product } {
  if (l.stoneId) {
    const st = stoneById(l.stoneId);
    return { name: st ? `${stoneTitle(st)} loose diamond` : `Stone ${l.stoneId}`, meta: st ? `${st.color} ${st.clarity}, ${st.lab} ${st.certificate}, stock ${st.id}` : `Stock ${l.stoneId}` };
  }
  const p = productById(l.productId);
  return { name: p?.name ?? l.productId, meta: [metalLabel(l.metal), formatCarat(l.carat), l.size ? `size ${l.size}` : null].filter(Boolean).join(", "), product: p };
}

export default function OrdersPage() {
  const orders = useOrders();
  const now = useNow();
  const [q, setQ] = useState("");
  const [range, setRange] = useState<Range>("all");
  const [open, setOpen] = useState<Set<string>>(() => new Set(orders[0] ? [orders[0].number] : []));
  const [added, setAdded] = useState<string | null>(null);

  const frequent = useMemo(() => {
    const map = new Map<string, { line: CartLine; times: number; last: string }>();
    orders.forEach((o) =>
      o.lines
        .filter((l) => !l.stoneId)
        .forEach((l) => {
          const hit = map.get(l.key);
          if (hit) {
            hit.times += 1;
            if (o.placedAt > hit.last) hit.last = o.placedAt;
          } else map.set(l.key, { line: l, times: 1, last: o.placedAt });
        }),
    );
    return [...map.values()].sort((a, b) => b.times - a.times || b.last.localeCompare(a.last)).slice(0, 4);
  }, [orders]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const since = range === "30" ? now - 30 * 864e5 : range === "90" ? now - 90 * 864e5 : range === "year" ? new Date(new Date(now).getFullYear(), 0, 1).getTime() : 0;
    return orders.filter((o) => {
      if (new Date(o.placedAt).getTime() < since) return false;
      if (!term) return true;
      const hay = [o.number, o.details.po, ...o.lines.map((l) => (l.stoneId ? l.stoneId : productById(l.productId)?.name ?? ""))].join(" ").toLowerCase();
      return hay.includes(term);
    });
  }, [orders, q, range, now]);

  const toggle = (n: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  const reorderLine = (l: CartLine) => {
    again(l);
    setAdded(`${lineName(l).name}, qty ${l.qty}, is in your cart.`);
  };
  const reorderAll = (o: PlacedOrder) => {
    const lines = o.lines.filter((l) => !l.stoneId);
    lines.forEach(again);
    setAdded(`${pieceCount(lines)} ${pieceCount(lines) === 1 ? "piece" : "pieces"} from ${o.number} ${pieceCount(lines) === 1 ? "is" : "are"} in your cart.`);
  };
  const exportCsv = () =>
    downloadCsv(`surreal-orders-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Order", "Placed", "Item", "Details", "Qty", "Note", "Payment", "PO"],
      ...shown.flatMap((o) => o.lines.map((l) => [o.number, o.placedAt.slice(0, 10), lineName(l).name, lineName(l).meta, l.qty, l.note, PAYMENT[o.payment], o.details.po])),
    ]);

  return (
    <div className={s.page}>
      <nav aria-label="Breadcrumb" className={s.crumbs}>
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden>/</span>
        <span aria-current="page">Orders</span>
      </nav>
      <header className={s.head}>
        <div>
          <p className={s.kicker}>Orders and reorder</p>
          <h1 className={s.title}>
            Your <em>orders</em>
          </h1>
          <p className={s.lead}>
            {orders.length} {orders.length === 1 ? "order" : "orders"}. Reorder any piece exactly as before, in one click.
          </p>
        </div>
        <Link href={account.cart} className={s.secondary}>
          Go to the cart
        </Link>
      </header>

      {added && (
        <p className={s.notice} role="status">
          {added}{" "}
          <Link href={account.cart} className={s.textLink}>
            Review the cart
          </Link>
        </p>
      )}

      {orders.length === 0 ? (
        <div className={s.emptyBig}>
          <p className={s.emptyTitle}>No orders yet</p>
          <p>Orders you place appear here, with every piece ready to reorder in one click.</p>
          <Link href="/jewelry" className={s.primary}>
            Shop the catalog
          </Link>
        </div>
      ) : (
        <>
          {frequent.length > 0 && (
            <section className={s.panel} aria-labelledby="frequent-title">
              <div className={s.panelHead}>
                <h2 id="frequent-title" className={s.panelTitle}>
                  Frequently reordered
                </h2>
              </div>
              <ul className={s.frequent}>
                {frequent.map(({ line, times }) => {
                  const n = lineName(line);
                  return (
                    <li key={line.key} className={s.freqCard}>
                      <Thumb line={line} />
                      <span className={s.freqText}>
                        <strong>{n.name}</strong>
                        {n.meta}, qty {line.qty}
                        <span className={s.freqTimes}>
                          Ordered {times} {times === 1 ? "time" : "times"}
                        </span>
                      </span>
                      <button type="button" className={s.reorder} onClick={() => reorderLine(line)}>
                        Reorder
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className={s.toolbar}>
            <label className={s.searchBox}>
              <span className={s.srOnly}>Search orders</span>
              <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <circle cx="9" cy="9" r="5.5" />
                <path d="m13.5 13.5 3.5 3.5" />
              </svg>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order number, piece, stock ID or PO" />
            </label>
            <div className={s.chips} role="group" aria-label="Placed">
              {RANGES.map((r) => (
                <button key={r.id} type="button" className={s.chip} aria-pressed={range === r.id} onClick={() => setRange(r.id)}>
                  {r.label}
                </button>
              ))}
            </div>
            <button type="button" className={s.textBtn} onClick={exportCsv} disabled={shown.length === 0}>
              Download CSV
            </button>
          </div>

          <p className={s.count} aria-live="polite">
            {shown.length === orders.length ? `Showing all ${orders.length}` : `${shown.length} of ${orders.length} orders`}
          </p>

          {shown.length === 0 ? (
            <div className={s.emptyBig}>
              <p className={s.emptyTitle}>No orders match</p>
              <button
                type="button"
                className={s.secondary}
                onClick={() => {
                  setQ("");
                  setRange("all");
                }}
              >
                Clear the search
              </button>
            </div>
          ) : (
            <ul className={s.orders}>
              {shown.map((o) => {
                const isOpen = open.has(o.number);
                const jewelry = o.lines.filter((l) => !l.stoneId);
                const d = o.details;
                return (
                  <li key={o.number} className={s.order} data-open={isOpen ? "" : undefined}>
                    <div className={s.orderHead}>
                      <button type="button" className={s.orderToggle} aria-expanded={isOpen} aria-controls={`order-${o.number}`} onClick={() => toggle(o.number)}>
                        <span className={s.orderNumber}>{o.number}</span>
                        <span className={s.orderMeta}>
                          {longDate(o.placedAt)} · {pieceCount(o.lines)} {pieceCount(o.lines) === 1 ? "piece" : "pieces"}, {caratTotal(o.lines)} ct · {PAYMENT[o.payment]}
                        </span>
                        <svg aria-hidden className={s.chev} viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                          <path d="M2 4.5l4 4 4-4" />
                        </svg>
                      </button>
                      <span className={s.status}>Received</span>
                      <button type="button" className={s.reorderAll} disabled={jewelry.length === 0} onClick={() => reorderAll(o)}>
                        Reorder all
                      </button>
                    </div>

                    <div id={`order-${o.number}`} className={s.orderBody} hidden={!isOpen}>
                      <ol className={s.steps} aria-label="Order status">
                        {STEPS.map((step, i) => (
                          <li key={step} data-done={i === 0 ? "" : undefined}>
                            <span className={s.stepDot} aria-hidden />
                            {step}
                          </li>
                        ))}
                      </ol>
                      <p className={s.stepNote}>
                        {o.beforeCutoff ? "Placed before the 4:00pm EST cutoff for next day delivery. " : ""}Status updates connect with the order system.
                      </p>

                      <ul className={s.lines}>
                        {o.lines.map((l) => {
                          const n = lineName(l);
                          return (
                            <li key={l.key} className={s.line}>
                              <Thumb line={l} />
                              <span className={s.lineText}>
                                {n.product ? (
                                  <Link href={productHref(n.product)} className={s.lineName}>
                                    {n.name}
                                  </Link>
                                ) : (
                                  <span className={s.lineName}>{n.name}</span>
                                )}
                                <span>{n.meta}</span>
                                {l.note && <span className={s.lineNote}>Note: {l.note}</span>}
                              </span>
                              <span className={s.lineQty}>Qty {l.qty}</span>
                              <span className={s.lineDoors}>
                                {l.stoneId ? (
                                  <>
                                    <span className={s.oneOff}>One of a kind</span>
                                    <Link href="/diamonds" className={s.textLink}>
                                      Find a similar stone
                                    </Link>
                                  </>
                                ) : (
                                  <>
                                    <button type="button" className={s.reorder} onClick={() => reorderLine(l)}>
                                      Reorder
                                    </button>
                                    {n.product && (
                                      <Link href={`${productHref(n.product)}?metal=${l.metal}&ct=${l.carat}`} className={s.textLink}>
                                        Change and reorder
                                      </Link>
                                    )}
                                  </>
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      <dl className={s.details}>
                        <div>
                          <dt>Ship to</dt>
                          <dd>
                            {d.store}
                            <br />
                            {d.address}
                            <br />
                            {[d.city, d.state, d.zip].filter(Boolean).join(", ")}
                          </dd>
                        </div>
                        <div>
                          <dt>Contact</dt>
                          <dd>
                            {d.contact}
                            <br />
                            {d.email}
                            <br />
                            {d.phone}
                          </dd>
                        </div>
                        <div>
                          <dt>References</dt>
                          <dd>
                            PO {d.po || "none"}
                            <br />
                            In-store deadline {d.deadline ? longDate(d.deadline) : "none"}
                          </dd>
                        </div>
                        {d.notes && (
                          <div>
                            <dt>Notes</dt>
                            <dd>{d.notes}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
