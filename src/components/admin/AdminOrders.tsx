"use client";

/**
 * Orders and payments: every dealer order from checkout to delivery, and
 * every payment from collection to posting in RightClick.
 *
 * Orders tab
 * - Figures: to confirm, to ship, awaiting wire, to post, order value over
 *   the last 30 days.
 * - The list: search (order, store, PO, piece, stock ID), status (to
 *   confirm, to ship, shipped, delivered, cancelled), payment method, CSV.
 *   Each row offers its next step (Confirm, Ship, Delivered) and opens the
 *   order.
 * - The order: next step (confirm with an optional note; ship with carrier
 *   and tracking; mark delivered; cancel with a reason), the payment (charge
 *   a card authorization, mark an ACH debit settled, record a wire with its
 *   reference and amount, mark the receipt posted in RightClick), the lines
 *   at dealer prices, the store's details, and the timeline with staff notes.
 *   What the dealer sees on their Orders page is marked.
 *
 * Payments tab: money in from checkout and from invoice payments on the
 * dashboard, with what is awaited, collected, posted and refunded; posting
 * a payment clears "pending posting" on the dealer's invoices.
 *
 * Preview: orders placed in this browser, plus sample orders from the test
 * dealer accounts (labelled, and they can be hidden). The workflow is in
 * lib/orderStatus.ts. Administrator, Accounts / Finance and Manager edit;
 * Sales views; HR has no access.
 */

import Link from "next/link";
import { useMemo, useRef, useState, type FormEvent } from "react";
import ShapeIcon from "@/components/brand/ShapeIcon";
import { trapTab, useDrawer } from "@/components/shop/useDrawer";
import { ROLE_LABEL } from "@/content/admin";
import { formatCarat, metals, productById, productHref } from "@/content/catalog";
import { stoneById, stoneTitle } from "@/content/diamonds";
import { caratTotal, pieceCount, useOrders, type CartLine, type PaymentMethod, type PlacedOrder } from "@/lib/cart";
import { downloadCsv } from "@/lib/csv";
import { useCustomers } from "@/lib/customers";
import { formatMoney, postInvoicePayment, useInvoicePayments } from "@/lib/invoices";
import {
  CANCEL_REASONS,
  CARRIERS,
  COLLECTED,
  METHOD_LABEL,
  PAY_LABEL,
  STATUS_LABEL,
  addStaffNote,
  cancelOrder,
  capturePayment,
  confirmOrder,
  deliverOrder,
  markPosted,
  recordWire,
  resetOrder,
  sampleOrders,
  settleAch,
  shipOrder,
  trackingUrl,
  useOrderWorkMap,
  workOf,
  type Carrier,
  type OrderStatus,
  type OrderWork,
  type PayState,
} from "@/lib/orderStatus";
import { linePrice, linesTotal } from "@/lib/pricing";
import { useStaff } from "@/lib/staff";
import { useNow } from "@/lib/useNow";
import { useAdminAccess } from "./AdminShell";
import s from "./admin.module.css";

interface Row {
  order: PlacedOrder;
  /** The sample order's own state, before any console change. */
  base?: OrderWork;
  work: OrderWork;
  sample: boolean;
  total: number;
  account: string;
}

type StatusFilter = "all" | OrderStatus;
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "received", label: "To confirm" },
  { id: "confirmed", label: "To ship" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const DAY = 864e5;
const dateTime = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const metalLabel = (m: string) => metals.find((x) => x.id === m)?.label ?? m;
const PAY_TONE: Record<PayState, string> = { authorized: "pending", initiated: "pending", awaiting: "waiting", captured: "ok", settled: "ok", received: "ok", voided: "off", refunded: "off" };

function lineText(l: CartLine) {
  if (l.stoneId) {
    const st = stoneById(l.stoneId);
    return { name: st ? `${stoneTitle(st)} loose diamond` : `Stone ${l.stoneId}`, meta: st ? `${st.color} ${st.clarity}, ${st.lab} ${st.certificate}, stock ${st.id}` : `Stock ${l.stoneId}`, href: `/diamonds?stone=${l.stoneId}`, shape: st?.shape };
  }
  const p = productById(l.productId);
  return { name: p?.name ?? l.productId, meta: [metalLabel(l.metal), formatCarat(l.carat), l.size ? `size ${l.size}` : null].filter(Boolean).join(", "), href: p ? productHref(p) : undefined, shape: undefined };
}

function StatusChip({ status }: { status: OrderStatus }) {
  return (
    <span className={s.orderChip} data-status={status}>
      {STATUS_LABEL[status]}
    </span>
  );
}
function PayChip({ pay, posted }: { pay: PayState; posted?: boolean }) {
  return (
    <span className={s.payChip} data-tone={PAY_TONE[pay]}>
      {PAY_LABEL[pay]}
      {COLLECTED.includes(pay) && !posted ? ", to post" : ""}
    </span>
  );
}

/* The order drawer */

function OrderDrawer({ row, open, onClose, readOnly, by }: { row: Row | null; open: boolean; onClose: () => void; readOnly: boolean; by: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const { onKeyDown } = useDrawer({ open, onClose, rootRef, panelRef, backdropRef, axis: "x" });
  const [note, setNote] = useState("");
  const [carrier, setCarrier] = useState<Carrier>("FedEx");
  const [tracking, setTracking] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [cancelNote, setCancelNote] = useState("");
  const [wireRef, setWireRef] = useState("");
  const [wireAmount, setWireAmount] = useState("");
  const [staffNote, setStaffNote] = useState("");
  const [error, setError] = useState("");

  // A different order clears the forms (adjusted during render).
  const [seen, setSeen] = useState<string | null>(null);
  if (row && row.order.number !== seen) {
    setSeen(row.order.number);
    setNote("");
    setTracking("");
    setCancelling(false);
    setCancelNote("");
    setWireRef("");
    setWireAmount(String(row.total));
    setStaffNote("");
    setError("");
  }

  const o = row?.order;
  const w = row?.work;
  const base = row?.base;

  const ship = (e: FormEvent) => {
    e.preventDefault();
    if (!o) return;
    if (carrier !== "Other" && tracking.trim().length < 6) return setError("Enter the tracking number, so the dealer can follow the parcel.");
    setError("");
    shipOrder(o, base, by, carrier, tracking);
  };
  const wire = (e: FormEvent) => {
    e.preventDefault();
    if (!o) return;
    const amount = Number(wireAmount);
    if (wireRef.trim().length < 3) return setError("Enter the wire's reference from the bank statement.");
    if (!(amount > 0)) return setError("Enter the amount received.");
    setError("");
    recordWire(o, base, by, wireRef, Math.round(amount * 100) / 100);
  };

  return (
    <div ref={rootRef} className={s.drawerRoot} inert={!open} aria-hidden={!open} onKeyDown={onKeyDown}>
      <div ref={backdropRef} className={s.drawerBackdrop} onClick={onClose} />
      <div ref={panelRef} className={s.drawer} role="dialog" aria-modal="true" aria-label={o ? `Order ${o.number}` : "Order"} tabIndex={-1} onKeyDown={(e) => trapTab(e, panelRef.current)}>
        {o && w && row && (
          <>
            <header className={s.drawerHead}>
              <div>
                <p className={s.kicker}>
                  Order {row.sample && <span className={s.sampleTag}>Sample</span>}
                </p>
                <h2 className={s.drawerTitle}>{o.number}</h2>
                <p className={s.muted}>
                  Placed {dateTime(o.placedAt)} · {o.details.store}
                  {row.account ? ` · ${row.account}` : ""}
                </p>
              </div>
              <span className={s.drawerHeadSide}>
                <StatusChip status={w.status} />
                <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close the order">
                  <svg aria-hidden viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                    <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                  </svg>
                </button>
              </span>
            </header>

            <div className={s.drawerBody}>
              {error && (
                <p className={s.error} role="alert">
                  {error}
                </p>
              )}

              {/* Next step */}
              {w.status !== "delivered" && w.status !== "cancelled" && (
                <section className={s.step} aria-labelledby="next-title">
                  <h3 id="next-title" className={s.stepTitle}>
                    Next step
                  </h3>
                  {readOnly ? (
                    <p className={s.muted}>View only for your role. Accounts / Finance, Manager or an Administrator moves the order on.</p>
                  ) : cancelling ? (
                    <form
                      className={s.stepForm}
                      onSubmit={(e) => {
                        e.preventDefault();
                        cancelOrder(o, base, by, reason, cancelNote);
                        setCancelling(false);
                      }}
                    >
                      <label className={s.field}>
                        <span className={s.label}>Reason the dealer sees</span>
                        <select className={s.select} value={reason} onChange={(e) => setReason(e.target.value)}>
                          {CANCEL_REASONS.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </label>
                      <label className={s.field}>
                        <span className={s.label}>Staff note (optional)</span>
                        <input className={s.input} value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} />
                      </label>
                      <p className={s.muted}>
                        {COLLECTED.includes(w.pay) ? `${formatMoney(w.amount ?? row.total)} is refunded to the original payment.` : w.pay === "authorized" ? "The card authorization is released; nothing was charged." : "Nothing was collected."}
                        {o.lines.some((l) => l.stoneId) ? " Loose stones on the order go back on the diamond page." : ""}
                      </p>
                      <span className={s.cardTools}>
                        <button type="submit" className={s.dangerBtn}>
                          Cancel the order
                        </button>
                        <button type="button" className={s.textBtn} onClick={() => setCancelling(false)}>
                          Keep it
                        </button>
                      </span>
                    </form>
                  ) : w.status === "received" ? (
                    <form
                      className={s.stepForm}
                      onSubmit={(e) => {
                        e.preventDefault();
                        confirmOrder(o, base, by, note);
                        setNote("");
                      }}
                    >
                      <p className={s.muted}>Check the pieces and stones, and the prices against the dealer&apos;s price list.{w.pay === "authorized" ? " Confirming charges the card." : ""}</p>
                      <label className={s.field}>
                        <span className={s.label}>Staff note (optional)</span>
                        <input className={s.input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example, stones pulled from the vault" />
                      </label>
                      <span className={s.cardTools}>
                        <button type="submit" className={s.primary}>
                          Confirm the order
                        </button>
                        <button type="button" className={s.textBtn} onClick={() => setCancelling(true)}>
                          Cancel the order
                        </button>
                      </span>
                    </form>
                  ) : w.status === "confirmed" ? (
                    <form className={s.stepForm} onSubmit={ship}>
                      <div className={s.formRow}>
                        <label className={s.field}>
                          <span className={s.label}>Carrier</span>
                          <select className={s.select} value={carrier} onChange={(e) => setCarrier(e.target.value as Carrier)}>
                            {CARRIERS.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </label>
                        <label className={s.field}>
                          <span className={s.label}>Tracking number</span>
                          <input className={s.input} value={tracking} onChange={(e) => setTracking(e.target.value)} />
                        </label>
                      </div>
                      {w.pay === "awaiting" && <p className={s.warnNote}>The wire has not arrived yet. Ship once it is recorded, unless Accounts has agreed terms.</p>}
                      <span className={s.cardTools}>
                        <button type="submit" className={s.primary}>
                          Mark shipped
                        </button>
                        <button type="button" className={s.textBtn} onClick={() => setCancelling(true)}>
                          Cancel the order
                        </button>
                      </span>
                    </form>
                  ) : (
                    <div className={s.stepForm}>
                      <p className={s.muted}>
                        Shipped {w.shippedAt ? shortDate(w.shippedAt) : ""} by {w.carrier}
                        {w.tracking ? `, tracking ${w.tracking}` : ""}.
                      </p>
                      <span className={s.cardTools}>
                        <button type="button" className={s.primary} onClick={() => deliverOrder(o, base, by)}>
                          Mark delivered
                        </button>
                      </span>
                    </div>
                  )}
                </section>
              )}

              {/* Payment */}
              <section className={s.step} aria-labelledby="pay-title">
                <div className={s.stepHead}>
                  <h3 id="pay-title" className={s.stepTitle}>
                    Payment
                  </h3>
                  <PayChip pay={w.pay} posted={Boolean(w.postedAt)} />
                </div>
                <dl className={s.payFacts}>
                  <div>
                    <dt>Method</dt>
                    <dd>{METHOD_LABEL[o.payment]}</dd>
                  </div>
                  <div>
                    <dt>Order total</dt>
                    <dd>{formatMoney(row.total)}</dd>
                  </div>
                  {w.amount !== undefined && w.amount !== row.total && (
                    <div>
                      <dt>Received</dt>
                      <dd>
                        {formatMoney(w.amount)} <span className={s.warnText}>({w.amount < row.total ? "short" : "over"} by {formatMoney(Math.abs(row.total - w.amount))})</span>
                      </dd>
                    </div>
                  )}
                  {w.payRef && (
                    <div>
                      <dt>Reference</dt>
                      <dd>{w.payRef}</dd>
                    </div>
                  )}
                  {w.paidAt && (
                    <div>
                      <dt>Collected</dt>
                      <dd>{shortDate(w.paidAt)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>RightClick</dt>
                    <dd>{w.postedAt ? `Posted ${shortDate(w.postedAt)}` : COLLECTED.includes(w.pay) ? "To post" : "Nothing to post"}</dd>
                  </div>
                </dl>
                {!readOnly && (
                  <>
                    {w.pay === "authorized" && w.status !== "cancelled" && (
                      <button type="button" className={s.secondaryBtn} onClick={() => capturePayment(o, base, by)}>
                        Charge the card now
                      </button>
                    )}
                    {w.pay === "initiated" && (
                      <button type="button" className={s.secondaryBtn} onClick={() => settleAch(o, base, by)}>
                        Mark the ACH debit settled
                      </button>
                    )}
                    {w.pay === "awaiting" && w.status !== "cancelled" && (
                      <form className={s.stepForm} onSubmit={wire}>
                        <div className={s.formRow}>
                          <label className={s.field}>
                            <span className={s.label}>Wire reference</span>
                            <input className={s.input} value={wireRef} onChange={(e) => setWireRef(e.target.value)} placeholder="From the bank statement" />
                          </label>
                          <label className={s.field}>
                            <span className={s.label}>Amount received</span>
                            <input className={s.input} type="number" inputMode="decimal" step="0.01" min="0" value={wireAmount} onChange={(e) => setWireAmount(e.target.value)} />
                          </label>
                        </div>
                        <span className={s.cardTools}>
                          <button type="submit" className={s.secondaryBtn}>
                            Record the wire
                          </button>
                        </span>
                      </form>
                    )}
                    {COLLECTED.includes(w.pay) && !w.postedAt && (
                      <div className={s.postRow}>
                        <p className={s.muted}>RightClick has no call to record payments: post the receipt there, then mark it here.</p>
                        <button type="button" className={s.secondaryBtn} onClick={() => markPosted(o, base, by)}>
                          Mark posted in RightClick
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* Lines */}
              <section className={s.step} aria-labelledby="lines-title">
                <div className={s.stepHead}>
                  <h3 id="lines-title" className={s.stepTitle}>
                    {pieceCount(o.lines)} {pieceCount(o.lines) === 1 ? "piece" : "pieces"}, {caratTotal(o.lines)} ct
                  </h3>
                  <span className={s.muted}>Sample dealer prices</span>
                </div>
                <ul className={s.orderLines}>
                  {o.lines.map((l) => {
                    const t = lineText(l);
                    return (
                      <li key={l.key}>
                        {t.shape && <ShapeIcon shape={t.shape} className={s.shapeIcon} />}
                        <span className={s.personCell}>
                          {t.href ? (
                            <Link href={t.href} className={s.pieceName} target="_blank" rel="noreferrer">
                              {t.name}
                            </Link>
                          ) : (
                            <span className={s.pieceName}>{t.name}</span>
                          )}
                          <span className={s.muted}>
                            {t.meta}
                            {l.note ? ` · Note: ${l.note}` : ""}
                          </span>
                        </span>
                        <span className={s.lineQty}>× {l.qty}</span>
                        <span className={s.lineAmount}>{formatMoney(linePrice(l) ?? 0)}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className={s.orderTotal}>
                  <span>Total</span>
                  <strong>{formatMoney(row.total)}</strong>
                </p>
              </section>

              {/* Store */}
              <section className={s.step} aria-labelledby="store-title">
                <h3 id="store-title" className={s.stepTitle}>
                  Store
                </h3>
                <dl className={s.payFacts}>
                  <div>
                    <dt>Ship to</dt>
                    <dd>
                      {o.details.store}
                      <br />
                      {o.details.address}
                      <br />
                      {[o.details.city, o.details.state, o.details.zip].filter(Boolean).join(", ")}
                    </dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>
                      {o.details.contact}
                      <br />
                      <a href={`mailto:${o.details.email}`} className={s.textBtn}>
                        {o.details.email}
                      </a>
                      <br />
                      {o.details.phone}
                    </dd>
                  </div>
                  <div>
                    <dt>PO</dt>
                    <dd>{o.details.po || "None"}</dd>
                  </div>
                  <div>
                    <dt>Delivery</dt>
                    <dd>
                      {o.beforeCutoff ? "Before the 4:00pm cutoff: next day" : "After the cutoff"}
                      {o.details.deadline ? `; in store by ${shortDate(o.details.deadline)}` : ""}
                    </dd>
                  </div>
                  {o.details.notes && (
                    <div className={s.wideFact}>
                      <dt>Dealer notes</dt>
                      <dd>{o.details.notes}</dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* Timeline */}
              <section className={s.step} aria-labelledby="time-title">
                <h3 id="time-title" className={s.stepTitle}>
                  Timeline
                </h3>
                <ol className={s.timeline}>
                  {[...w.events].reverse().map((e, i) => (
                    <li key={`${e.at}-${i}`}>
                      <span className={s.timelineText}>
                        <strong>{e.text}</strong>
                        <span className={s.muted}>
                          {dateTime(e.at)} · {e.by}
                        </span>
                      </span>
                      <span className={s.seenTag} data-dealer={e.dealer || undefined}>
                        {e.dealer ? "Dealer sees" : "Staff only"}
                      </span>
                    </li>
                  ))}
                </ol>
                {!readOnly && (
                  <form
                    className={s.noteForm}
                    onSubmit={(e) => {
                      e.preventDefault();
                      addStaffNote(o, base, by, staffNote);
                      setStaffNote("");
                    }}
                  >
                    <input className={s.input} value={staffNote} onChange={(e) => setStaffNote(e.target.value)} placeholder="Add a staff note" aria-label="Staff note" />
                    <button type="submit" className={s.secondaryBtn} disabled={!staffNote.trim()}>
                      Add
                    </button>
                  </form>
                )}
                <p className={s.muted}>
                  The dealer&apos;s Orders page shows the status, tracking, payment and the events marked Dealer sees.{" "}
                  {!readOnly && (
                    <button type="button" className={s.textBtn} onClick={() => resetOrder(o)}>
                      Reset this order (preview)
                    </button>
                  )}
                </p>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* Page */

export default function AdminOrders() {
  const access = useAdminAccess();
  const readOnly = access !== "edit";
  const staff = useStaff();
  const now = useNow();
  const siteOrders = useOrders();
  const workMap = useOrderWorkMap();
  const customers = useCustomers();
  const invoicePayments = useInvoicePayments();
  const [tab, setTab] = useState<"orders" | "payments">("orders");
  const [withSample, setWithSample] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");
  const [payFilter, setPayFilter] = useState<"all" | "post" | "awaiting" | "posted" | "refunds">("all");
  const [openNumber, setOpenNumber] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const by = staff?.name ? `${staff.name}, ${ROLE_LABEL[staff.role]}` : staff ? ROLE_LABEL[staff.role] : "Surreal";

  // Sample orders are dated back from the top of the hour, so their numbers hold steady through the day.
  const hour = Math.floor(now / 36e5) * 36e5;
  const samples = useMemo(() => (hour ? sampleOrders(hour) : []), [hour]);

  const rows: Row[] = useMemo(() => {
    const accountOf = (email: string) => customers.find((c) => c.email.toLowerCase() === email.toLowerCase())?.account ?? "";
    const site = siteOrders.map((o) => ({ order: o, base: undefined, sample: false }));
    const sample = withSample ? samples.map((x) => ({ order: x.order, base: x.work, sample: true })) : [];
    return [...site, ...sample]
      .map((r) => ({ ...r, work: workOf(workMap, r.order, r.base), total: linesTotal(r.order.lines), account: accountOf(r.order.details.email) }))
      .sort((a, b) => b.order.placedAt.localeCompare(a.order.placedAt));
  }, [siteOrders, samples, withSample, workMap, customers]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.work.status !== status) return false;
      if (method !== "all" && r.order.payment !== method) return false;
      if (!term) return true;
      const hay = [r.order.number, r.order.details.store, r.order.details.po, r.account, ...r.order.lines.map((l) => (l.stoneId ? l.stoneId : (productById(l.productId)?.name ?? "")))].join(" ").toLowerCase();
      return hay.includes(term);
    });
  }, [rows, q, status, method]);

  // Payments: one line per order payment, and each payment dealers made on their invoices.
  const payments = useMemo(() => {
    const fromOrders = rows.map((r) => ({
      id: `ord-${r.order.number}`,
      date: r.work.paidAt ?? r.order.placedAt,
      ref: r.work.payRef ?? "",
      store: r.order.details.store,
      method: METHOD_LABEL[r.order.payment],
      amount: r.work.amount ?? r.total,
      applies: `Order ${r.order.number}`,
      state: PAY_LABEL[r.work.pay],
      tone: PAY_TONE[r.work.pay],
      collected: COLLECTED.includes(r.work.pay),
      awaiting: (["authorized", "initiated", "awaiting"] as PayState[]).includes(r.work.pay) && r.work.status !== "cancelled",
      refunded: r.work.pay === "refunded",
      posted: r.work.postedAt,
      sample: r.sample,
      row: r as Row | null,
      invoiceId: null as string | null,
    }));
    const fromInvoices = invoicePayments.map((p) => ({
      id: p.id,
      date: p.date,
      ref: p.id,
      store: p.payer ?? "Dealer",
      method: p.method,
      amount: p.amount,
      applies: `${p.allocations.length} ${p.allocations.length === 1 ? "invoice" : "invoices"}`,
      state: p.kind === "wire" ? "Wire sent by the dealer" : "Paid on the dashboard",
      tone: "ok",
      collected: true,
      awaiting: false,
      refunded: false,
      posted: p.pending ? undefined : (p.postedAt ?? p.date),
      sample: false,
      row: null as Row | null,
      invoiceId: p.id as string | null,
    }));
    return [...fromInvoices, ...fromOrders].sort((a, b) => b.date.localeCompare(a.date));
  }, [rows, invoicePayments]);

  // "All" leaves out cancelled orders that never took money.
  const shownPayments = payments.filter((p) =>
    payFilter === "post" ? p.collected && !p.posted : payFilter === "awaiting" ? p.awaiting : payFilter === "posted" ? Boolean(p.posted) : payFilter === "refunds" ? p.refunded : p.state !== PAY_LABEL.voided,
  );

  const live = rows.filter((r) => r.work.status !== "cancelled");
  const sum = (list: { total: number }[]) => list.reduce((n, r) => n + r.total, 0);
  const toConfirm = live.filter((r) => r.work.status === "received");
  const toShip = live.filter((r) => r.work.status === "confirmed");
  const awaitingWire = live.filter((r) => r.work.pay === "awaiting");
  const toPost = payments.filter((p) => p.collected && !p.posted);
  const last30 = live.filter((r) => new Date(r.order.placedAt).getTime() >= now - 30 * DAY);
  const collected30 = payments.filter((p) => p.collected && new Date(p.date).getTime() >= now - 30 * DAY).reduce((n, p) => n + p.amount, 0);

  const openRow = openNumber ? (rows.find((r) => r.order.number === openNumber) ?? null) : null;
  const openOrder = (n: string) => {
    setOpenNumber(n);
    setDrawerOpen(true);
  };

  const quick = (r: Row) => {
    if (readOnly) return null;
    if (r.work.status === "received")
      return (
        <button type="button" className={s.rowBtn} onClick={() => confirmOrder(r.order, r.base, by, "")}>
          Confirm
        </button>
      );
    if (r.work.status === "confirmed")
      return (
        <button type="button" className={s.rowBtn} onClick={() => openOrder(r.order.number)}>
          Ship
        </button>
      );
    if (r.work.status === "shipped")
      return (
        <button type="button" className={s.rowBtn} onClick={() => deliverOrder(r.order, r.base, by)}>
          Delivered
        </button>
      );
    return null;
  };

  const exportOrders = () =>
    downloadCsv(`surreal-orders-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Order", "Placed", "Store", "Account", "PO", "Pieces", "Carats", "Total", "Payment", "Payment state", "Status", "Carrier", "Tracking", "Posted in RightClick", "Sample"],
      ...shown.map((r) => [r.order.number, r.order.placedAt.slice(0, 10), r.order.details.store, r.account, r.order.details.po, pieceCount(r.order.lines), caratTotal(r.order.lines), r.total.toFixed(2), METHOD_LABEL[r.order.payment], PAY_LABEL[r.work.pay], STATUS_LABEL[r.work.status], r.work.carrier ?? "", r.work.tracking ?? "", r.work.postedAt ? r.work.postedAt.slice(0, 10) : "", r.sample ? "Yes" : ""]),
    ]);
  const exportPayments = () =>
    downloadCsv(`surreal-payments-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Date", "Reference", "Store", "Method", "Amount", "Applies to", "State", "Posted in RightClick", "Sample"],
      ...shownPayments.map((p) => [p.date.slice(0, 10), p.ref, p.store, p.method, p.amount.toFixed(2), p.applies, p.state, p.posted ? p.posted.slice(0, 10) : "", p.sample ? "Yes" : ""]),
    ]);

  if (!now) return null;

  return (
    <div className={s.page}>
      <header className={s.pageHead}>
        <div>
          <p className={s.kicker}>Orders and payments</p>
          <h1 className={s.pageTitle}>From checkout to delivery</h1>
          <p className={s.pageLine}>Confirm, ship and deliver dealer orders, collect card, ACH and wire payments, and keep RightClick posted. Dealers see each status and tracking number on their Orders page.</p>
        </div>
        <label className={s.switchRow}>
          <input type="checkbox" checked={withSample} onChange={(e) => setWithSample(e.target.checked)} />
          <span>Include sample orders</span>
        </label>
      </header>

      <dl className={`${s.stats} ${s.statsFive}`}>
        <div className={s.stat}>
          <dt>To confirm</dt>
          <dd className={s.statFigure}>{toConfirm.length}</dd>
          <span>{formatMoney(sum(toConfirm))}</span>
        </div>
        <div className={s.stat}>
          <dt>To ship</dt>
          <dd className={s.statFigure}>{toShip.length}</dd>
          <span>{formatMoney(sum(toShip))}</span>
        </div>
        <div className={s.stat}>
          <dt>Awaiting wire</dt>
          <dd className={s.statFigure}>{awaitingWire.length}</dd>
          <span>{formatMoney(sum(awaitingWire))}</span>
        </div>
        <div className={s.stat}>
          <dt>To post in RightClick</dt>
          <dd className={s.statFigure}>{toPost.length}</dd>
          <span>{formatMoney(toPost.reduce((n, p) => n + p.amount, 0))}</span>
        </div>
        <div className={s.stat}>
          <dt>Last 30 days</dt>
          <dd className={s.statFigure}>{formatMoney(sum(last30)).replace(/\.\d\d$/, "")}</dd>
          <span>
            {last30.length} orders · {formatMoney(collected30).replace(/\.\d\d$/, "")} collected
          </span>
        </div>
      </dl>

      <div className={s.tabs} role="tablist" aria-label="Orders and payments">
        <button type="button" role="tab" aria-selected={tab === "orders"} className={s.tab} onClick={() => setTab("orders")}>
          Orders <span>{rows.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "payments"} className={s.tab} onClick={() => setTab("payments")}>
          Payments <span>{payments.length}</span>
        </button>
      </div>

      {tab === "orders" ? (
        <>
          <div className={s.toolbar}>
            <label className={s.search}>
              <span className={s.srOnly}>Search orders</span>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order, store, PO, piece or stock ID" />
            </label>
            <div className={s.seg} role="radiogroup" aria-label="Status">
              {STATUS_FILTERS.map((f) => {
                const n = f.id === "all" ? rows.length : rows.filter((r) => r.work.status === f.id).length;
                return (
                  <button key={f.id} type="button" role="radio" aria-checked={status === f.id} className={s.segBtn} onClick={() => setStatus(f.id)}>
                    {f.label} {n > 0 && <span className={s.segCount}>{n}</span>}
                  </button>
                );
              })}
            </div>
            <select className={s.select} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod | "all")} aria-label="Payment method">
              <option value="all">Any payment</option>
              <option value="card">Card</option>
              <option value="ach">ACH</option>
              <option value="wire">Wire</option>
            </select>
            <button type="button" className={s.textBtn} onClick={exportOrders} disabled={shown.length === 0}>
              Download CSV
            </button>
          </div>

          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Store</th>
                  <th scope="col">Items</th>
                  <th scope="col">Total</th>
                  <th scope="col">Payment</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className={s.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.order.number} data-selected={openNumber === r.order.number && drawerOpen ? "" : undefined}>
                    <th scope="row">
                      <span className={s.personCell}>
                        <button type="button" className={s.orderLink} onClick={() => openOrder(r.order.number)}>
                          {r.order.number}
                        </button>
                        <span className={s.muted}>
                          {dateTime(r.order.placedAt)}
                          {r.sample ? " · sample" : ""}
                        </span>
                      </span>
                    </th>
                    <td>
                      <span className={s.personCell}>
                        <span>{r.order.details.store}</span>
                        <span className={s.muted}>
                          {[r.account, [r.order.details.city, r.order.details.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </td>
                    <td className="tabular">
                      {pieceCount(r.order.lines)} {pieceCount(r.order.lines) === 1 ? "piece" : "pcs"} · {caratTotal(r.order.lines)} ct
                    </td>
                    <td className="tabular">{formatMoney(r.total)}</td>
                    <td>
                      <span className={s.personCell}>
                        <span>{METHOD_LABEL[r.order.payment]}</span>
                        <PayChip pay={r.work.pay} posted={Boolean(r.work.postedAt)} />
                      </span>
                    </td>
                    <td>
                      <span className={s.personCell}>
                        <StatusChip status={r.work.status} />
                        {r.work.tracking && (r.work.status === "shipped" || r.work.status === "delivered") && (
                          <a href={trackingUrl(r.work.carrier, r.work.tracking) ?? undefined} className={s.muted} target="_blank" rel="noreferrer">
                            {r.work.carrier} {r.work.tracking}
                          </a>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={s.cardTools}>
                        {quick(r)}
                        <button type="button" className={s.textBtn} onClick={() => openOrder(r.order.number)}>
                          Open
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={7}>{rows.length ? "No orders match." : "No orders yet. Orders placed at checkout appear here."}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <p className={s.note}>
            Card and ACH payments go through Surreal&apos;s card processor (C-10); wires arrive at the bank and are recorded here. RightClick has no call to record a payment, so
            Accounts posts each one there and marks it posted: dealers then stop seeing &ldquo;pending posting&rdquo; on their invoices.
          </p>
          <div className={s.toolbar}>
            <div className={s.seg} role="radiogroup" aria-label="Payments">
              {(
                [
                  ["all", "All"],
                  ["post", "To post"],
                  ["awaiting", "Not yet collected"],
                  ["posted", "Posted"],
                  ["refunds", "Refunds"],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" role="radio" aria-checked={payFilter === id} className={s.segBtn} onClick={() => setPayFilter(id)}>
                  {label}
                </button>
              ))}
            </div>
            <span className={s.count}>
              {shownPayments.length} payments · {formatMoney(shownPayments.reduce((n, p) => n + p.amount, 0))}
            </span>
            <button type="button" className={s.textBtn} onClick={exportPayments} disabled={shownPayments.length === 0}>
              Download CSV
            </button>
          </div>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Store</th>
                  <th scope="col">Method</th>
                  <th scope="col">Amount</th>
                  <th scope="col">For</th>
                  <th scope="col">State</th>
                  <th scope="col">RightClick</th>
                </tr>
              </thead>
              <tbody>
                {shownPayments.map((p) => (
                  <tr key={p.id}>
                    <th scope="row">
                      <span className={s.personCell}>
                        <span>{shortDate(p.date)}</span>
                        <span className={s.muted}>
                          {p.ref || "No reference yet"}
                          {p.sample ? " · sample" : ""}
                        </span>
                      </span>
                    </th>
                    <td>{p.store}</td>
                    <td>{p.method}</td>
                    <td className="tabular">{formatMoney(p.amount)}</td>
                    <td>
                      {p.row ? (
                        <button type="button" className={s.orderLink} onClick={() => openOrder(p.row!.order.number)}>
                          {p.applies}
                        </button>
                      ) : (
                        p.applies
                      )}
                    </td>
                    <td>
                      <span className={s.payChip} data-tone={p.tone}>
                        {p.state}
                      </span>
                    </td>
                    <td>
                      {p.posted ? (
                        <span className={s.muted}>Posted {shortDate(p.posted)}</span>
                      ) : p.collected && !readOnly ? (
                        <button
                          type="button"
                          className={s.rowBtn}
                          onClick={() => {
                            if (p.invoiceId) postInvoicePayment(p.invoiceId);
                            else if (p.row) markPosted(p.row.order, p.row.base, by);
                          }}
                        >
                          Mark posted
                        </button>
                      ) : (
                        <span className={s.muted}>{p.collected ? "To post" : "Not collected"}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {shownPayments.length === 0 && (
                  <tr>
                    <td colSpan={7}>No payments here.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <OrderDrawer row={openRow} open={drawerOpen && Boolean(openRow)} onClose={() => setDrawerOpen(false)} readOnly={readOnly} by={by} />
    </div>
  );
}
