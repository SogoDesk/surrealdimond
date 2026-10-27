"use client";

/**
 * Invoices, payments and reconciliation for the Retailer Dashboard (client
 * feedback 27 October 2026, moved into Phase 1 from the Phase 2 payment
 * portal). The shapes follow RightClick, which will supply the real data
 * (docs/RIGHTCLICK.md): the customer balance (account balance, aging buckets,
 * credit limit, memo balance, last payment), open invoices (invoice number,
 * PO, date, due date, terms, total, payments and credits applied, balance)
 * and the statement (invoices, credits and cash receipts in date order).
 *
 * Until then every signed-in dealer sees SAMPLE invoices, generated from a
 * seed of their email so test accounts differ, priced from the sample price
 * list and labelled Sample on the page. Three live sources join them:
 *
 * - memo items the dealer reported sold become invoices awaiting issue;
 * - orders placed on the site by wire transfer become invoices due on
 *   receipt (card and ACH orders were paid at checkout and show as paid);
 * - payments made here settle invoices at once, marked "pending posting":
 *   RightClick has no call to record a payment, so finance posts the cash
 *   receipt there and the next sync clears the flag.
 *
 * Reconciliations (the dealer confirms the statement or flags invoices that
 * differ) are kept in this browser with an RC number, like memo
 * reconciliations, until the console's inbox takes them.
 */

import { useMemo } from "react";
import { caratOptions, defaultMetalOf, metals, productById, products, styleRef, type Product } from "@/content/catalog";
import { SHAPE_LABEL, stones, type Stone } from "@/content/diamonds";
import { useOrders, type PlacedOrder } from "./cart";
import { useDealer, type DealerSession } from "./dealer";
import { createLocalStore } from "./localStore";
import { useMemoReports } from "./memo";
import { useMemoLines, type MemoLine } from "./memoLines";
import { jewelryPrice, linePrice, stonePrice } from "./pricing";
import { useNow } from "./useNow";

/* Types */

export interface InvoiceLine {
  description: string;
  /** Stock or style reference, when there is one. */
  ref?: string;
  qty: number;
  /** Unit price in US dollars. */
  unit: number;
}

/** open: on the account and payable · awaiting: reported sold, Surreal has not issued it yet · paid: settled. */
export type InvoiceState = "open" | "awaiting" | "paid";

export interface Invoice {
  id: string;
  /** RightClick's invoice_no; awaiting invoices have none yet. */
  number: number | null;
  date: string;
  due: string;
  terms: string;
  po: string;
  /** What it bills for: an order, memo items sold, or a sample charge. */
  source: "order" | "memo" | "account";
  reference: string;
  lines: InvoiceLine[];
  shipping: number;
  tax: number;
  total: number;
  /** Payments and credits applied before today, from the account (sample). */
  applied: number;
  sample: boolean;
}

/** An invoice as the dealer sees it today, after their payments and reconciliations. */
export interface InvoiceView extends Invoice {
  paidHere: number;
  balance: number;
  state: InvoiceState;
  /** Days past due, 0 when not yet due. */
  overdue: number;
  bucket: AgingBucket;
  /** Flagged in a reconciliation and not yet resolved. */
  inReview: boolean;
  /** Paid on the site; finance has not posted the receipt yet. */
  pendingPosting: boolean;
}

export type AgingBucket = "current" | "d30" | "d60" | "d90" | "d90plus";
export const AGING_LABEL: Record<AgingBucket, string> = { current: "Current", d30: "1 to 30 days", d60: "31 to 60 days", d90: "61 to 90 days", d90plus: "Over 90 days" };
export const AGING_ORDER: AgingBucket[] = ["current", "d30", "d60", "d90", "d90plus"];

export type PayKind = "card" | "ach" | "wire";

export interface Payment {
  id: string;
  date: string;
  amount: number;
  kind: PayKind | "check";
  /** The method as shown, e.g. "Visa ending 4242" or "Wire transfer". */
  method: string;
  allocations: { invoiceId: string; amount: number }[];
  /** Received on the site and waiting for finance to post it in RightClick. */
  pending: boolean;
  sample: boolean;
}

export interface Credit {
  id: string;
  date: string;
  amount: number;
  reason: string;
  sample: boolean;
}

export type DisputeReason = "Amount differs" | "Already paid" | "Items not received" | "Items returned" | "Other";
export const DISPUTE_REASONS: DisputeReason[] = ["Amount differs", "Already paid", "Items not received", "Items returned", "Other"];

export interface InvoiceReconciliation {
  number: string;
  sentAt: string;
  /** Statement period the dealer reviewed. */
  through: string;
  confirmed: boolean;
  matched: string[];
  disputes: { invoiceId: string; reason: DisputeReason; note: string }[];
}

export interface StatementEntry {
  date: string;
  kind: "Invoice" | "Payment" | "Credit";
  ref: string;
  description: string;
  charge: number;
  creditAmount: number;
  balance: number;
  sample: boolean;
}

export interface AccountSummary {
  balance: number;
  pastDue: number;
  dueSoon: number;
  aging: Record<AgingBucket, number>;
  creditLimit: number;
  available: number;
  memoBalance: number;
  awaiting: number;
  unappliedCredit: number;
  openCount: number;
  oldestOverdue: number;
  nextDue: string | null;
  lastPayment: Payment | null;
}

/* Money */

const cents = (n: number) => Math.round(n * 100) / 100;
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Dollars and cents, e.g. $12,450.00. */
export const formatMoney = (n: number) => money.format(cents(n));
export const invoiceTotal = (lines: InvoiceLine[], shipping = 0, tax = 0) => cents(lines.reduce((s, l) => s + l.qty * l.unit, 0) + shipping + tax);

/* Stores */

const isPayments = (v: unknown): v is Payment[] => Array.isArray(v);
const isRecons = (v: unknown): v is InvoiceReconciliation[] => Array.isArray(v);
const paymentsStore = createLocalStore<Payment[]>("surreal-invoice-payments", [], isPayments);
const reconStore = createLocalStore<InvoiceReconciliation[]>("surreal-invoice-recons", [], isRecons);

export const useInvoicePayments = paymentsStore.useStore;
export const useInvoiceReconciliations = reconStore.useStore;

/** Record a payment made on the site against invoices (full balances). */
export function payInvoices(invoices: InvoiceView[], kind: PayKind, method: string): Payment {
  const now = new Date();
  const allocations = invoices.filter((i) => i.state === "open" && i.balance > 0).map((i) => ({ invoiceId: i.id, amount: i.balance }));
  const payment: Payment = {
    id: `PMT-${String(now.getTime()).slice(-6)}`,
    date: now.toISOString(),
    amount: cents(allocations.reduce((s, a) => s + a.amount, 0)),
    kind,
    method,
    allocations,
    pending: true,
    sample: false,
  };
  paymentsStore.set((list) => [payment, ...list]);
  return payment;
}

export function sendInvoiceReconciliation(r: Omit<InvoiceReconciliation, "number" | "sentAt">): InvoiceReconciliation {
  const now = new Date();
  const sent: InvoiceReconciliation = { ...r, number: `RC-${String(now.getTime()).slice(-6)}`, sentAt: now.toISOString() };
  reconStore.set((list) => [sent, ...list]);
  return sent;
}

/* Sample account (seeded per dealer) */

const DAY = 864e5;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const metalLabel = (id: string) => metals.find((m) => m.id === id)?.label ?? id;

function jewelryLine(p: Product, qty: number): InvoiceLine {
  const metal = defaultMetalOf(p);
  const carat = caratOptions[p.category][0];
  return { description: `${p.name}, ${metalLabel(metal)}, ${carat} ct`, ref: styleRef(p) ?? undefined, qty, unit: jewelryPrice(p, metal, carat) };
}
function stoneLine(st: Stone): InvoiceLine {
  return { description: `${st.carat.toFixed(2)} ct ${SHAPE_LABEL[st.shape]} ${st.color} ${st.clarity}, ${st.lab} ${st.certificate}`, ref: st.id, qty: 1, unit: stonePrice(st) };
}

interface SampleAccount {
  invoices: Invoice[];
  payments: Payment[];
  credits: Credit[];
  creditLimit: number;
}

/** The sample ledger: open invoices across every aging bucket, paid history, a credit and cash receipts. */
function sampleAccount(dealer: DealerSession, now: number): SampleAccount {
  const r = rng(seedOf(dealer.email.toLowerCase()));
  const pick = <T,>(list: T[]) => list[Math.floor(r() * list.length)];
  const jewelry = products.filter((p) => p.category !== "sterling-silver");
  const gems = stones.filter((s) => s.carat >= 0.9);
  const base = 10200 + Math.floor(r() * 600);
  const po = () => `PO-${1100 + Math.floor(r() * 800)}`;

  // [days ago, lines, already applied share, terms]
  const plan: [number, () => InvoiceLine[], number][] = [
    [6, () => [jewelryLine(pick(jewelry), 2), jewelryLine(pick(jewelry), 1)], 0],
    [17, () => [stoneLine(pick(gems))], 0],
    [41, () => [jewelryLine(pick(jewelry), 3)], 0],
    [58, () => [stoneLine(pick(gems)), jewelryLine(pick(jewelry), 1)], 0.4],
    [79, () => [jewelryLine(pick(jewelry), 2)], 0],
    [104, () => [stoneLine(pick(gems))], 0],
    [141, () => [jewelryLine(pick(jewelry), 1)], 0],
    [35, () => [jewelryLine(pick(jewelry), 2)], 1],
    [66, () => [stoneLine(pick(gems))], 1],
    [96, () => [jewelryLine(pick(jewelry), 4)], 1],
  ];

  const invoices: Invoice[] = plan.map(([ago, make, share], i) => {
    const lines = make();
    const shipping = r() > 0.5 ? 35 : 0;
    const total = invoiceTotal(lines, shipping);
    const date = now - ago * DAY;
    const number = base + (plan.length - i) * 7 + Math.floor(r() * 5);
    return {
      id: `inv-${number}`,
      number,
      date: iso(date),
      due: iso(date + 30 * DAY),
      terms: "Net 30 Days",
      po: r() > 0.3 ? po() : "",
      source: "account",
      reference: `Order ${number - 9000}`,
      lines,
      shipping,
      tax: 0,
      total,
      applied: cents(total * share),
      sample: true,
    };
  });

  // Cash receipts for the paid and part-paid invoices.
  const kinds: Payment["kind"][] = ["ach", "check", "wire", "card"];
  const payments: Payment[] = invoices
    .filter((inv) => inv.applied > 0)
    .map((inv, i) => {
      const kind = kinds[i % kinds.length];
      const date = Math.min(now - 2 * DAY, new Date(inv.date).getTime() + (20 + Math.floor(r() * 12)) * DAY);
      return {
        id: `CR-${4400 + i * 13}`,
        date: new Date(date).toISOString(),
        amount: inv.applied,
        kind,
        method: kind === "check" ? `Check ${2200 + i * 17}` : kind === "wire" ? "Wire transfer" : kind === "ach" ? "ACH bank transfer" : "Card payment",
        allocations: [{ invoiceId: inv.id, amount: inv.applied }],
        pending: false,
        sample: true,
      };
    });

  const credits: Credit[] = [{ id: `CM-${2200 + Math.floor(r() * 90)}`, date: iso(now - 24 * DAY), amount: cents(180 + Math.floor(r() * 9) * 20), reason: "Return credit, one piece sent back", sample: true }];

  return { invoices, payments, credits, creditLimit: 150000 + Math.floor(r() * 4) * 25000 };
}

/* Live sources */

function memoInvoices(lines: MemoLine[], reports: ReturnType<typeof useMemoReports>): Invoice[] {
  const byId = new Map(lines.map((l) => [l.id, l]));
  return reports
    .filter((rep) => rep.sold.length > 0)
    .map((rep) => {
      const sold = rep.sold.map((id) => byId.get(id)).filter((l): l is MemoLine => Boolean(l));
      const invLines: InvoiceLine[] = sold.map((l) => ({ description: `${l.title}${l.color && l.clarity ? ` ${l.color} ${l.clarity}` : ""}, from memo ${l.memo}`, ref: l.stock, qty: 1, unit: l.price ?? 0 }));
      const date = rep.sentAt.slice(0, 10);
      return {
        id: `memo-${rep.number}`,
        number: null,
        date,
        due: iso(new Date(rep.sentAt).getTime() + 30 * DAY),
        terms: "Net 30 Days",
        po: "",
        source: "memo",
        reference: `Memo reconciliation ${rep.number}`,
        lines: invLines,
        shipping: 0,
        tax: 0,
        total: invoiceTotal(invLines),
        applied: 0,
        sample: sold.some((l) => l.sample),
      };
    });
}

function orderInvoices(orders: PlacedOrder[]): Invoice[] {
  return orders.map((o) => {
    const lines: InvoiceLine[] = o.lines.map((l) => ({
      description: l.stoneId ? `Loose diamond, stock ${l.stoneId}` : `${productById(l.productId)?.name ?? l.productId}, ${metalLabel(l.metal)}, ${l.carat} ct${l.size ? `, size ${l.size}` : ""}`,
      ref: l.stoneId ?? (productById(l.productId) ? (styleRef(productById(l.productId)!) ?? undefined) : undefined),
      qty: l.qty,
      unit: cents((linePrice(l) ?? 0) / (l.stoneId ? 1 : l.qty)),
    }));
    const total = invoiceTotal(lines);
    const number = 50000 + (seedOf(o.number) % 9000);
    return {
      id: `ord-${o.number}`,
      number,
      date: o.placedAt.slice(0, 10),
      due: o.payment === "wire" ? o.placedAt.slice(0, 10) : iso(new Date(o.placedAt).getTime() + 30 * DAY),
      terms: o.payment === "wire" ? "Due on receipt" : "Paid at checkout",
      po: o.details.po,
      source: "order",
      reference: `Order ${o.number}`,
      lines,
      shipping: 0,
      tax: 0,
      total,
      applied: o.payment === "wire" ? 0 : total,
      sample: false,
    };
  });
}

/* The account, as the dealer sees it */

export interface Account {
  invoices: InvoiceView[];
  payments: Payment[];
  credits: Credit[];
  statement: StatementEntry[];
  summary: AccountSummary;
  reconciliations: InvoiceReconciliation[];
}

function bucketOf(overdue: number, state: InvoiceState): AgingBucket {
  if (state !== "open" || overdue <= 0) return "current";
  if (overdue <= 30) return "d30";
  if (overdue <= 60) return "d60";
  if (overdue <= 90) return "d90";
  return "d90plus";
}

/** One dealer account's receivable, as the console sees it. */
export interface Receivable {
  account: string;
  company: string;
  balance: number;
  pastDue: number;
  aging: Record<AgingBucket, number>;
  /** Days the oldest unpaid invoice is past due; 0 when nothing is. */
  oldest: number;
}

/**
 * Receivables across dealer accounts for the console overview: each
 * account's sample ledger (the one its owner sees on the dashboard), open
 * balances bucketed by age, credits netted off. RightClick's customer
 * transactions replace the sample with one bulk call (docs/RIGHTCLICK.md).
 */
export function sampleReceivables(accounts: { email: string; company: string; account: string }[], now: number): Receivable[] {
  const today = iso(now);
  return accounts.map((a) => {
    const { invoices, credits } = sampleAccount({ email: a.email, store: a.company, contact: "", demo: false }, now);
    const aging = Object.fromEntries(AGING_ORDER.map((b) => [b, 0])) as Record<AgingBucket, number>;
    let gross = 0;
    let pastDue = 0;
    let oldest = 0;
    for (const inv of invoices) {
      const open = cents(inv.total - inv.applied);
      if (inv.number === null || open <= 0) continue;
      const overdue = inv.due < today ? Math.floor((now - new Date(inv.due + "T12:00:00").getTime()) / DAY) : 0;
      const bucket = bucketOf(overdue, "open");
      aging[bucket] = cents(aging[bucket] + open);
      gross = cents(gross + open);
      if (overdue > 0) {
        pastDue = cents(pastDue + open);
        oldest = Math.max(oldest, overdue);
      }
    }
    const credit = cents(credits.reduce((s, c) => s + c.amount, 0));
    return { account: a.account, company: a.company, balance: cents(Math.max(0, gross - credit)), pastDue, aging, oldest };
  });
}

export function useAccount(): Account | null {
  const dealer = useDealer();
  const now = useNow();
  const orders = useOrders();
  const memoLines = useMemoLines();
  const memoReports = useMemoReports();
  const sitePayments = useInvoicePayments();
  const reconciliations = useInvoiceReconciliations();

  return useMemo(() => {
    if (!dealer || !now) return null;
    const sample = sampleAccount(dealer, now);
    const all: Invoice[] = [...sample.invoices, ...orderInvoices(orders), ...memoInvoices(memoLines, memoReports)];

    const paidHere = new Map<string, number>();
    sitePayments.forEach((p) => p.allocations.forEach((a) => paidHere.set(a.invoiceId, cents((paidHere.get(a.invoiceId) ?? 0) + a.amount))));
    const inReview = new Set<string>();
    reconciliations.forEach((rc) => rc.disputes.forEach((d) => inReview.add(d.invoiceId)));

    const today = new Date(now).toISOString().slice(0, 10);
    const views: InvoiceView[] = all
      .map((inv) => {
        const here = paidHere.get(inv.id) ?? 0;
        const balance = cents(Math.max(0, inv.total - inv.applied - here));
        const state: InvoiceState = inv.number === null ? "awaiting" : balance <= 0 ? "paid" : "open";
        const overdue = state === "open" && inv.due < today ? Math.floor((now - new Date(inv.due + "T12:00:00").getTime()) / DAY) : 0;
        return { ...inv, paidHere: here, balance, state, overdue: Math.max(0, overdue), bucket: bucketOf(overdue, state), inReview: inReview.has(inv.id), pendingPosting: here > 0 };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const open = views.filter((v) => v.state === "open");
    const aging = Object.fromEntries(AGING_ORDER.map((b) => [b, 0])) as Record<AgingBucket, number>;
    open.forEach((v) => (aging[v.bucket] = cents(aging[v.bucket] + v.balance)));
    const unappliedCredit = cents(sample.credits.reduce((s, c) => s + c.amount, 0));
    const gross = cents(open.reduce((s, v) => s + v.balance, 0));
    const balance = cents(Math.max(0, gross - unappliedCredit));
    const pastDue = cents(open.filter((v) => v.overdue > 0).reduce((s, v) => s + v.balance, 0));
    const soon = new Date(now + 7 * DAY).toISOString().slice(0, 10);
    const dueSoon = cents(open.filter((v) => v.overdue === 0 && v.due <= soon).reduce((s, v) => s + v.balance, 0));
    const memoBalance = cents(memoLines.filter((l) => !memoReports.some((rep) => rep.sold.includes(l.id))).reduce((s, l) => s + (l.price ?? 0), 0));
    const awaiting = cents(views.filter((v) => v.state === "awaiting").reduce((s, v) => s + v.total, 0));
    const upcoming = open.filter((v) => v.overdue === 0).map((v) => v.due).sort()[0] ?? null;
    const paymentsAll = [...sitePayments, ...sample.payments].sort((a, b) => b.date.localeCompare(a.date));

    // Statement: charges and credits in date order with a running balance.
    const entries: Omit<StatementEntry, "balance">[] = [
      ...views.filter((v) => v.state !== "awaiting").map((v) => ({ date: v.date, kind: "Invoice" as const, ref: `Invoice ${v.number}`, description: v.reference + (v.po ? `, ${v.po}` : ""), charge: v.total, creditAmount: 0, sample: v.sample })),
      ...paymentsAll.map((p) => ({ date: p.date.slice(0, 10), kind: "Payment" as const, ref: p.id, description: p.method + (p.pending ? ", pending posting" : ""), charge: 0, creditAmount: p.amount, sample: p.sample })),
      ...views.filter((v) => v.terms === "Paid at checkout").map((v) => ({ date: v.date, kind: "Payment" as const, ref: `Checkout ${v.reference.replace("Order ", "")}`, description: "Paid at checkout", charge: 0, creditAmount: v.total, sample: false })),
      ...sample.credits.map((c) => ({ date: c.date, kind: "Credit" as const, ref: c.id, description: c.reason, charge: 0, creditAmount: c.amount, sample: c.sample })),
    ].sort((a, b) => a.date.localeCompare(b.date) || (a.kind === "Invoice" ? -1 : 1));
    let running = 0;
    const statement: StatementEntry[] = entries.map((e) => {
      running = cents(running + e.charge - e.creditAmount);
      return { ...e, balance: running };
    });

    return {
      invoices: views,
      payments: paymentsAll,
      credits: sample.credits,
      statement,
      reconciliations,
      summary: {
        balance,
        pastDue,
        dueSoon,
        aging,
        creditLimit: sample.creditLimit,
        available: cents(Math.max(0, sample.creditLimit - balance - memoBalance)),
        memoBalance,
        awaiting,
        unappliedCredit,
        openCount: open.length,
        oldestOverdue: open.reduce((m, v) => Math.max(m, v.overdue), 0),
        nextDue: upcoming,
        lastPayment: paymentsAll[0] ?? null,
      },
    };
  }, [dealer, now, orders, memoLines, memoReports, sitePayments, reconciliations]);
}

/** Owners see billing; associates order and see orders and memo (E3 role tests). */
export const canSeeBilling = (dealer: DealerSession | null) => Boolean(dealer) && dealer?.role !== "associate";
