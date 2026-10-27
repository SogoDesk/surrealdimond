"use client";

/**
 * What happens to an order after checkout: the console's Orders and
 * payments module writes it, and the dealer's Orders and Invoices pages read
 * it, so a status Surreal sets is the status the dealer sees.
 *
 * - Status: Received (placed on the site), Confirmed (Surreal accepted it,
 *   confirming prices from the dealer's price list), Shipped (carrier and
 *   tracking), Delivered; or Cancelled, with a reason the dealer sees.
 * - Payment (B-05), by method: a card is authorized at checkout and charged
 *   when Surreal confirms the order; an ACH debit is initiated at checkout
 *   and settles a few business days later; a wire is awaited until finance
 *   records it. Cancelling voids what was not collected and refunds what was.
 * - Posting: RightClick has no call to record a payment (docs/RIGHTCLICK.md),
 *   so finance posts each collected payment there by hand and marks it
 *   posted here. Payments dealers make on their invoices post the same way
 *   (lib/invoices.ts).
 * - A timeline per order: dealer-visible events, and staff notes that stay
 *   in the console.
 *
 * Preview: kept in this browser. The console also shows a set of SAMPLE
 * orders from the test dealer accounts (sampleOrders), so the module can be
 * reviewed before real orders exist; they never reach a dealer's pages.
 */

import { TEST_DEALERS } from "@/content/testAccounts";
import type { CartLine, PaymentMethod, PlacedOrder } from "./cart";
import { createLocalStore } from "./localStore";

export type OrderStatus = "received" | "confirmed" | "shipped" | "delivered" | "cancelled";
export const STATUS_STEPS: OrderStatus[] = ["received", "confirmed", "shipped", "delivered"];
export const STATUS_LABEL: Record<OrderStatus, string> = { received: "Received", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

export type PayState = "authorized" | "captured" | "initiated" | "settled" | "awaiting" | "received" | "voided" | "refunded";
export const PAY_LABEL: Record<PayState, string> = {
  authorized: "Card authorized",
  captured: "Card charged",
  initiated: "ACH debit initiated",
  settled: "ACH settled",
  awaiting: "Awaiting wire",
  received: "Wire received",
  voided: "Nothing collected",
  refunded: "Refunded",
};
/** Money that has arrived, and so can be posted in RightClick. */
export const COLLECTED: PayState[] = ["captured", "settled", "received"];
export const METHOD_LABEL: Record<PaymentMethod, string> = { card: "Card", ach: "ACH", wire: "Wire" };

export const CARRIERS = ["FedEx", "UPS", "USPS", "Other"] as const;
export type Carrier = (typeof CARRIERS)[number];

export const CANCEL_REASONS = ["Piece or stone no longer available", "Dealer asked to cancel", "Payment not received", "Duplicate order", "Other"];

export interface OrderEvent {
  at: string;
  by: string;
  text: string;
  /** Shown to the dealer on their Orders page; staff notes stay in the console. */
  dealer: boolean;
}

export interface OrderWork {
  status: OrderStatus;
  pay: PayState;
  /** Amount collected when it differs from the order total (a short or long wire). */
  amount?: number;
  /** Wire reference, or the processor's transaction for a card or ACH. */
  payRef?: string;
  paidAt?: string;
  /** When finance posted the receipt in RightClick. */
  postedAt?: string;
  carrier?: Carrier;
  tracking?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelReason?: string;
  events: OrderEvent[];
}

const isWorkMap = (v: unknown): v is Record<string, OrderWork> => typeof v === "object" && v !== null && !Array.isArray(v);
const store = createLocalStore<Record<string, OrderWork>>("surreal-order-work", {}, isWorkMap);
export const useOrderWorkMap = store.useStore;

export function initialWork(o: PlacedOrder): OrderWork {
  return {
    status: "received",
    pay: o.payment === "card" ? "authorized" : o.payment === "ach" ? "initiated" : "awaiting",
    events: [{ at: o.placedAt, by: o.details.contact || o.details.store, text: "Order placed on the site", dealer: true }],
  };
}

/** The order's state: what the console saved, else the sample's own, else just placed. */
export const workOf = (map: Record<string, OrderWork>, o: PlacedOrder, base?: OrderWork): OrderWork => map[o.number] ?? base ?? initialWork(o);

export function trackingUrl(carrier: Carrier | undefined, tracking: string | undefined): string | null {
  if (!tracking) return null;
  const t = encodeURIComponent(tracking.trim());
  if (carrier === "FedEx") return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
  if (carrier === "UPS") return `https://www.ups.com/track?tracknum=${t}`;
  if (carrier === "USPS") return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`;
  return null;
}

/* Actions (the console) */

const now = () => new Date().toISOString();
const event = (by: string, text: string, dealer = true): OrderEvent => ({ at: now(), by, text, dealer });

function update(o: PlacedOrder, base: OrderWork | undefined, fn: (w: OrderWork) => OrderWork) {
  store.set((all) => ({ ...all, [o.number]: fn(all[o.number] ?? base ?? initialWork(o)) }));
}

/** Surreal accepts the order: prices confirmed from the dealer's price list; a card authorization is charged now. */
export function confirmOrder(o: PlacedOrder, base: OrderWork | undefined, by: string, note: string) {
  update(o, base, (w) => ({
    ...w,
    status: "confirmed",
    ...(w.pay === "authorized" ? { pay: "captured" as PayState, paidAt: now(), payRef: w.payRef ?? `TXN-${o.number.slice(-4)}` } : {}),
    events: [...w.events, event(by, "Confirmed by Surreal, prices from your price list"), ...(w.pay === "authorized" ? [event(by, "Card charged")] : []), ...(note.trim() ? [event(by, note.trim(), false)] : [])],
  }));
}

export function shipOrder(o: PlacedOrder, base: OrderWork | undefined, by: string, carrier: Carrier, tracking: string) {
  update(o, base, (w) => ({
    ...w,
    status: "shipped",
    carrier,
    tracking: tracking.trim(),
    shippedAt: now(),
    events: [...w.events, event(by, `Shipped by ${carrier}${tracking.trim() ? `, tracking ${tracking.trim()}` : ""}`)],
  }));
}

export function deliverOrder(o: PlacedOrder, base: OrderWork | undefined, by: string) {
  update(o, base, (w) => ({ ...w, status: "delivered", deliveredAt: now(), events: [...w.events, event(by, "Delivered")] }));
}

export function cancelOrder(o: PlacedOrder, base: OrderWork | undefined, by: string, reason: string, note: string) {
  update(o, base, (w) => {
    const collected = COLLECTED.includes(w.pay);
    return {
      ...w,
      status: "cancelled",
      pay: collected ? "refunded" : "voided",
      cancelReason: reason,
      events: [
        ...w.events,
        event(by, `Cancelled: ${reason}`),
        event(by, collected ? "Refund issued to the original payment" : w.pay === "authorized" ? "Card authorization released" : "Nothing was collected"),
        ...(note.trim() ? [event(by, note.trim(), false)] : []),
      ],
    };
  });
}

export function capturePayment(o: PlacedOrder, base: OrderWork | undefined, by: string) {
  update(o, base, (w) => ({ ...w, pay: "captured", paidAt: now(), payRef: w.payRef ?? `TXN-${o.number.slice(-4)}`, events: [...w.events, event(by, "Card charged")] }));
}

export function settleAch(o: PlacedOrder, base: OrderWork | undefined, by: string) {
  update(o, base, (w) => ({ ...w, pay: "settled", paidAt: now(), events: [...w.events, event(by, "ACH payment settled")] }));
}

export function recordWire(o: PlacedOrder, base: OrderWork | undefined, by: string, reference: string, amount: number) {
  update(o, base, (w) => ({ ...w, pay: "received", amount, payRef: reference.trim(), paidAt: now(), events: [...w.events, event(by, "Wire received, thank you"), event(by, `Wire reference ${reference.trim()}`, false)] }));
}

export function markPosted(o: PlacedOrder, base: OrderWork | undefined, by: string) {
  update(o, base, (w) => ({ ...w, postedAt: now(), events: [...w.events, event(by, "Payment posted in RightClick", false)] }));
}

export function addStaffNote(o: PlacedOrder, base: OrderWork | undefined, by: string, text: string) {
  if (!text.trim()) return;
  update(o, base, (w) => ({ ...w, events: [...w.events, event(by, text.trim(), false)] }));
}

/** Back to the sample's own state, or to just placed (the preview's reset). */
export function resetOrder(o: PlacedOrder) {
  store.set((all) => {
    const next = { ...all };
    delete next[o.number];
    return next;
  });
}

/* Sample orders for the console */

export interface SampleOrder {
  order: PlacedOrder;
  work: OrderWork;
}

const DAY = 864e5;
const ADDRESS: Record<string, { address: string; zip: string }> = {
  "HFJ-001": { address: "10 Example Wharf", zip: "02110" },
  "LDC-014": { address: "200 Sample Avenue, Suite 4", zip: "60601" },
  "WGJ-022": { address: "88 Test Street", zip: "94105" },
};

type Plan = [person: number, daysAgo: number, payment: PaymentMethod, lines: [id: string, carat: number, qty: number, size: string | null][], status: OrderStatus, pay: PayState, extra?: Partial<OrderWork> & { posted?: boolean }];

/** Nine orders across the three test store accounts, every status and payment state represented. */
const PLANS: Plan[] = [
  [0, 0.1, "card", [["oval-halo", 1.5, 1, "6"], ["contour-band", 0.5, 1, "6"]], "received", "authorized"],
  [2, 0.3, "wire", [["oval-tennis-necklace", 3, 1, null], ["oval-halo-studs", 1, 2, null]], "received", "awaiting"],
  [3, 1.2, "ach", [["eternity-band", 1, 3, "6.5"], ["classic-pave-band", 0.5, 2, "7"]], "confirmed", "initiated"],
  [0, 2.4, "card", [["three-stone-round", 2, 1, "5.5"]], "confirmed", "captured", { payRef: "TXN-4471" }],
  [2, 4.2, "wire", [["emerald-tennis-bracelet", 3, 1, null], ["pear-bezel-pendant", 1, 3, null]], "shipped", "received", { payRef: "FW-88213", carrier: "FedEx", tracking: "7712 4490 1183", posted: true }],
  [3, 6.3, "card", [["inside-out-hoops", 1, 2, null], ["toi-et-moi-pendant", 1, 1, null]], "shipped", "captured", { payRef: "TXN-3302", carrier: "UPS", tracking: "1Z 999 AA1 01 2345 6784" }],
  [0, 12.5, "ach", [["bridal-set-halo", 1.5, 1, "6"], ["oval-five-stone", 1, 1, "6"]], "delivered", "settled", { carrier: "FedEx", tracking: "7712 4402 9917", posted: true }],
  [2, 19.4, "card", [["bezel-tennis-bracelet", 2, 2, null]], "delivered", "captured", { payRef: "TXN-1180", carrier: "UPS", tracking: "1Z 999 AA1 01 2345 1120", posted: true }],
  [3, 26.2, "wire", [["round-solitaire", 1, 1, "7"]], "cancelled", "voided", { cancelReason: "Payment not received" }],
];

const stampOf = (t: number) => {
  const d = new Date(t);
  return `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
};

/** The sample orders, dated back from now, placed by the test store owners. */
export function sampleOrders(at: number): SampleOrder[] {
  return PLANS.map(([person, daysAgo, payment, lines, status, pay, extra = {}], i) => {
    const t = TEST_DEALERS[person];
    const { posted, ...more } = extra;
    const placed = at - daysAgo * DAY;
    const number = `SD-${stampOf(placed)}-${String(5100 + i * 37)}`;
    const cartLines: CartLine[] = lines.map(([id, carat, qty, size]) => ({ key: `${id}|wg|${carat}|${size ?? "-"}`, productId: id, metal: "wg", carat, size, qty, note: "" }));
    const order: PlacedOrder = {
      number,
      placedAt: new Date(placed).toISOString(),
      lines: cartLines,
      details: { store: t.company, contact: t.contact, email: t.email, phone: t.phone, address: ADDRESS[t.account]?.address ?? "", city: t.city, state: t.state, zip: ADDRESS[t.account]?.zip ?? "", po: `PO-${2200 + i * 13}`, deadline: "", notes: "" },
      payment,
      beforeCutoff: i % 3 !== 1,
    };
    const step = (k: number) => new Date(placed + k * 0.3 * DAY).toISOString();
    const by = "Surreal";
    const events: OrderEvent[] = [{ at: order.placedAt, by: t.contact, text: "Order placed on the site", dealer: true }];
    if (STATUS_STEPS.indexOf(status) >= 1) events.push({ at: step(1), by, text: "Confirmed by Surreal, prices from your price list", dealer: true });
    if (COLLECTED.includes(pay)) events.push({ at: step(1.5), by, text: payment === "card" ? "Card charged" : payment === "ach" ? "ACH payment settled" : "Wire received, thank you", dealer: true });
    if (STATUS_STEPS.indexOf(status) >= 2) events.push({ at: step(2), by, text: `Shipped by ${more.carrier}, tracking ${more.tracking}`, dealer: true });
    if (posted) events.push({ at: step(3), by: "Accounts", text: "Payment posted in RightClick", dealer: false });
    if (status === "delivered") events.push({ at: step(5), by, text: "Delivered", dealer: true });
    if (status === "cancelled") events.push({ at: step(8), by, text: `Cancelled: ${more.cancelReason}`, dealer: true }, { at: step(8), by, text: "Nothing was collected", dealer: true });
    const work: OrderWork = {
      status,
      pay,
      ...more,
      paidAt: COLLECTED.includes(pay) ? step(1.5) : undefined,
      shippedAt: STATUS_STEPS.indexOf(status) >= 2 ? step(2) : undefined,
      deliveredAt: status === "delivered" ? step(5) : undefined,
      postedAt: posted ? step(3) : undefined,
      events: events.sort((a, b) => a.at.localeCompare(b.at)),
    };
    return { order, work };
  });
}
