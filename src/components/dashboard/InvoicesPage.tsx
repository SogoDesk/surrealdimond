"use client";

/**
 * Invoices and payments (client feedback, 27 October 2026: open invoices,
 * outstanding payments and invoice and memo reconciliation, prioritised for
 * Phase 1). In the WB Mason customer portal manner, inside the dashboard
 * shell:
 *
 * - The account at a glance: balance due, past due, due within a week,
 *   credit available, and an aging bar (current, 1 to 30, 31 to 60, 61 to
 *   90, over 90 days) whose segments filter the list.
 * - Open invoices: select some, all past due, or everything, and pay with a
 *   saved card or bank account (or record a wire); each invoice opens its
 *   printable document.
 * - Payments: receipts on the account, and payments made here that finance
 *   has yet to post (RightClick has no call to record a payment).
 * - Statement: invoices, payments and credits in date order with a running
 *   balance, for a period; CSV and print.
 * - Reconcile: confirm the open balance or flag the invoices that differ,
 *   with a reason; memo items are reconciled on Open memo items, and the
 *   ones reported sold arrive here as invoices awaiting issue.
 *
 * Associates do not see billing (F-E3); the account owner does. All figures
 * are sample data until RightClick and the card processor are connected.
 */

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { brand } from "@/content/site";
import { methodLabel, usePaymentMethods } from "@/lib/account";
import { downloadCsv } from "@/lib/csv";
import { useDealer } from "@/lib/dealer";
import { useNow } from "@/lib/useNow";
import {
  AGING_LABEL,
  AGING_ORDER,
  DISPUTE_REASONS,
  canSeeBilling,
  formatMoney,
  payInvoices,
  sendInvoiceReconciliation,
  useAccount,
  type AgingBucket,
  type DisputeReason,
  type InvoiceReconciliation,
  type InvoiceView,
  type Payment,
} from "@/lib/invoices";
import p from "./pages.module.css";
import s from "./invoices.module.css";

type Tab = "open" | "payments" | "statement" | "reconcile";
type Filter = "open" | "pastdue" | "soon" | "awaiting" | "paid";
type Period = "90" | "year" | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "open", label: "Invoices" },
  { id: "payments", label: "Payments" },
  { id: "statement", label: "Statement" },
  { id: "reconcile", label: "Reconcile" },
];
const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "All open" },
  { id: "pastdue", label: "Past due" },
  { id: "soon", label: "Due this week" },
  { id: "awaiting", label: "Awaiting invoice" },
  { id: "paid", label: "Paid" },
];

const longDate = (d: string) => new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function initialTab(): Tab {
  const t = new URLSearchParams(window.location.search).get("tab");
  return TABS.some((x) => x.id === t) ? (t as Tab) : "open";
}

export function StatusChip({ inv }: { inv: InvoiceView }) {
  if (inv.state === "awaiting") return <span className={s.chip} data-tone="info">Awaiting invoice</span>;
  if (inv.state === "paid") return <span className={s.chip} data-tone={inv.pendingPosting ? "info" : "ok"}>{inv.pendingPosting ? "Paid, pending posting" : "Paid"}</span>;
  if (inv.inReview) return <span className={s.chip} data-tone="review">In review</span>;
  if (inv.overdue > 0) return <span className={s.chip} data-tone={inv.bucket}>{`${inv.overdue} ${inv.overdue === 1 ? "day" : "days"} past due`}</span>;
  return <span className={s.chip} data-tone="ok">Due {longDate(inv.due)}</span>;
}

export default function InvoicesPage() {
  const dealer = useDealer();
  const account = useAccount();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [filter, setFilter] = useState<Filter>("open");
  const [bucket, setBucket] = useState<AgingBucket | null>(null);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [paying, setPaying] = useState<InvoiceView[] | null>(null);
  const [receipt, setReceipt] = useState<Payment | null>(null);

  if (!dealer || !account) return null;
  if (!canSeeBilling(dealer)) {
    return (
      <div className={p.page}>
        <header className={p.head}>
          <div>
            <p className={p.kicker}>Invoices and payments</p>
            <h1 className={p.title}>Billing is with your account owner</h1>
            <p className={p.lead}>Your login can order and see orders and memo. Invoices, payments and statements are open to {dealer.store}&apos;s account owner.</p>
          </div>
        </header>
        <Link href="/dashboard" className={p.secondary}>
          Back to the dashboard
        </Link>
      </div>
    );
  }

  const { summary, invoices } = account;
  const open = invoices.filter((i) => i.state === "open");
  const switchTab = (t: Tab) => {
    setTab(t);
    setReceipt(null);
    window.history.replaceState(null, "", t === "open" ? window.location.pathname : `?tab=${t}`);
  };

  return (
    <div className={p.page}>
      <nav aria-label="Breadcrumb" className={p.crumbs}>
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden>/</span>
        <span aria-current="page">Invoices and payments</span>
      </nav>
      <header className={p.head}>
        <div>
          <p className={p.kicker}>Your account with Surreal</p>
          <h1 className={p.title}>
            Invoices and <em>payments</em>
          </h1>
          <p className={p.lead}>Open invoices, what is past due, and your statement. Pay one invoice, a few, or the whole balance.</p>
        </div>
        <span className={s.headDoors}>
          <Link href="/dashboard/payments" className={p.secondary}>
            Payment methods
          </Link>
          <button type="button" className={p.primary} disabled={open.length === 0} onClick={() => setPaying(open)}>
            Pay full balance
          </button>
        </span>
      </header>

      <p className={p.sampleNote}>
        <strong>Sample account.</strong> These invoices, payments and balances are sample data on a placeholder invoice template. Your real account arrives from Surreal&apos;s accounting system.
      </p>

      {receipt && <Receipt payment={receipt} onClose={() => setReceipt(null)} />}

      <section className={s.summary} aria-label="Account summary">
        <dl className={s.figures}>
          <div className={s.figureMain}>
            <dt>Balance due</dt>
            <dd className="tabular">{formatMoney(summary.balance)}</dd>
            <span>
              {summary.openCount} open {summary.openCount === 1 ? "invoice" : "invoices"}
              {summary.unappliedCredit > 0 ? `, less ${formatMoney(summary.unappliedCredit)} credit` : ""}
            </span>
          </div>
          <div data-alert={summary.pastDue > 0 ? "" : undefined}>
            <dt>Past due</dt>
            <dd className="tabular">{formatMoney(summary.pastDue)}</dd>
            <span>{summary.oldestOverdue > 0 ? `Oldest ${summary.oldestOverdue} days` : "Nothing past due"}</span>
          </div>
          <div>
            <dt>Due this week</dt>
            <dd className="tabular">{formatMoney(summary.dueSoon)}</dd>
            <span>{summary.nextDue ? `Next due ${longDate(summary.nextDue)}` : "Nothing due"}</span>
          </div>
          <div>
            <dt>Credit available</dt>
            <dd className="tabular">{formatMoney(summary.available)}</dd>
            <span>
              Of {formatMoney(summary.creditLimit)}, after {formatMoney(summary.memoBalance)} on memo
            </span>
          </div>
        </dl>
        <Aging aging={summary.aging} total={Object.values(summary.aging).reduce((a, b) => a + b, 0)} active={bucket} onPick={(b) => {
          setBucket(b === bucket ? null : b);
          setFilter("open");
          switchTab("open");
        }} />
        <p className={s.lastPayment}>
          {summary.lastPayment ? (
            <>
              Last payment {formatMoney(summary.lastPayment.amount)} on {longDate(summary.lastPayment.date)}, {summary.lastPayment.method}
              {summary.lastPayment.pending ? ", pending posting" : ""}.
            </>
          ) : (
            "No payments yet."
          )}
          {summary.awaiting > 0 && <> {formatMoney(summary.awaiting)} of memo items you reported sold is being invoiced.</>}
        </p>
      </section>

      <div className={s.tabs} role="tablist" aria-label="Billing">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={s.tab} onClick={() => switchTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "open" && (
        <OpenInvoices
          invoices={invoices}
          filter={filter}
          setFilter={(f) => {
            setFilter(f);
            setBucket(null);
            setPicked(new Set());
          }}
          bucket={bucket}
          q={q}
          setQ={setQ}
          picked={picked}
          setPicked={setPicked}
          onPay={setPaying}
        />
      )}
      {tab === "payments" && <Payments payments={account.payments} invoices={invoices} />}
      {tab === "statement" && <Statement account={account} store={dealer.store} />}
      {tab === "reconcile" && <Reconcile invoices={invoices} balance={summary.balance} history={account.reconciliations} />}

      {paying && (
        <PayDialog
          invoices={paying}
          onClose={() => setPaying(null)}
          onPaid={(payment) => {
            setPaying(null);
            setPicked(new Set());
            setReceipt(payment);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
}

function Aging({ aging, total, active, onPick }: { aging: Record<AgingBucket, number>; total: number; active: AgingBucket | null; onPick: (b: AgingBucket) => void }) {
  return (
    <div className={s.aging}>
      <div className={s.agingBar} aria-hidden>
        {AGING_ORDER.filter((b) => aging[b] > 0).map((b) => (
          <span key={b} data-bucket={b} style={{ flexGrow: total ? aging[b] / total : 0 }} />
        ))}
        {total === 0 && <span data-bucket="empty" style={{ flexGrow: 1 }} />}
      </div>
      <ul className={s.agingLegend} aria-label="Open balance by age">
        {AGING_ORDER.map((b) => (
          <li key={b}>
            <button type="button" className={s.agingKey} data-bucket={b} aria-pressed={active === b} onClick={() => onPick(b)} disabled={aging[b] === 0}>
              <span className={s.agingDot} aria-hidden />
              <span>{AGING_LABEL[b]}</span>
              <strong className="tabular">{formatMoney(aging[b])}</strong>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpenInvoices({
  invoices,
  filter,
  setFilter,
  bucket,
  q,
  setQ,
  picked,
  setPicked,
  onPay,
}: {
  invoices: InvoiceView[];
  filter: Filter;
  setFilter: (f: Filter) => void;
  bucket: AgingBucket | null;
  q: string;
  setQ: (v: string) => void;
  picked: Set<string>;
  setPicked: (v: Set<string>) => void;
  onPay: (list: InvoiceView[]) => void;
}) {
  const now = useNow();
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return invoices.filter((i) => {
      if (filter === "open" && i.state !== "open") return false;
      if (filter === "pastdue" && !(i.state === "open" && i.overdue > 0)) return false;
      if (filter === "soon" && !(i.state === "open" && i.overdue === 0 && new Date(`${i.due}T12:00:00`).getTime() - now <= 7 * 864e5)) return false;
      if (filter === "awaiting" && i.state !== "awaiting") return false;
      if (filter === "paid" && i.state !== "paid") return false;
      if (bucket && !(i.state === "open" && i.bucket === bucket)) return false;
      if (term && ![String(i.number ?? ""), i.po, i.reference].join(" ").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [invoices, filter, bucket, q, now]);

  const payable = shown.filter((i) => i.state === "open" && i.balance > 0);
  const chosen = payable.filter((i) => picked.has(i.id));
  const chosenTotal = chosen.reduce((sum, i) => sum + i.balance, 0);
  const pastDue = invoices.filter((i) => i.state === "open" && i.overdue > 0);
  const allPicked = payable.length > 0 && chosen.length === payable.length;

  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  return (
    <section aria-label="Invoices">
      <div className={p.toolbar}>
        <div className={p.chips} role="group" aria-label="Show">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className={p.chip} aria-pressed={filter === f.id && !bucket} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <label className={p.searchBox}>
          <span className={p.srOnly}>Search invoices</span>
          <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <circle cx="9" cy="9" r="5.5" />
            <path d="m13.5 13.5 3.5 3.5" />
          </svg>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Invoice, PO or order number" />
        </label>
        <button type="button" className={p.textBtn} disabled={pastDue.length === 0} onClick={() => onPay(pastDue)}>
          Pay all past due
        </button>
      </div>
      {bucket && (
        <p className={p.notice}>
          Showing {AGING_LABEL[bucket].toLowerCase()}.{" "}
          <button type="button" className={p.textBtn} onClick={() => setFilter("open")}>
            Show all open
          </button>
        </p>
      )}

      {shown.length === 0 ? (
        <div className={p.emptyBig}>
          <p className={p.emptyTitle}>{filter === "pastdue" ? "Nothing past due" : filter === "awaiting" ? "Nothing awaiting invoice" : filter === "paid" ? "No paid invoices yet" : "No open invoices"}</p>
          <p>{filter === "awaiting" ? "Memo items you report sold on Open memo items appear here until Surreal issues the invoice." : "Your account is up to date."}</p>
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col" className={s.checkCol}>
                  <input type="checkbox" className={s.check} aria-label="Select every payable invoice shown" checked={allPicked} disabled={payable.length === 0} onChange={() => setPicked(allPicked ? new Set() : new Set(payable.map((i) => i.id)))} />
                </th>
                <th scope="col">Invoice</th>
                <th scope="col">Date</th>
                <th scope="col">Due</th>
                <th scope="col">PO</th>
                <th scope="col" className={s.num}>
                  Total
                </th>
                <th scope="col" className={s.num}>
                  Balance
                </th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className={p.srOnly}>Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((i) => {
                const canPay = i.state === "open" && i.balance > 0;
                return (
                  <tr key={i.id} data-picked={picked.has(i.id) ? "" : undefined}>
                    <td className={s.checkCol}>
                      {canPay && <input type="checkbox" className={s.check} checked={picked.has(i.id)} onChange={() => toggle(i.id)} aria-label={`Select invoice ${i.number}`} />}
                    </td>
                    <th scope="row">
                      <Link href={`/dashboard/invoices/${i.id}`} className={s.invLink}>
                        {i.number ? `Invoice ${i.number}` : "Being invoiced"}
                      </Link>
                      <span className={s.sub}>
                        {i.reference}
                        {i.sample && <span className={p.sampleTag}>Sample</span>}
                      </span>
                    </th>
                    <td>{longDate(i.date)}</td>
                    <td>{i.state === "awaiting" ? "On issue" : i.terms === "Due on receipt" ? "On receipt" : longDate(i.due)}</td>
                    <td>{i.po || "None"}</td>
                    <td className={`${s.num} tabular`}>{formatMoney(i.total)}</td>
                    <td className={`${s.num} tabular`}>
                      <strong>{formatMoney(i.state === "awaiting" ? i.total : i.balance)}</strong>
                    </td>
                    <td>
                      <StatusChip inv={i} />
                    </td>
                    <td>
                      <span className={s.rowDoors}>
                        {canPay && (
                          <button type="button" className={s.payOne} onClick={() => onPay([i])}>
                            Pay
                          </button>
                        )}
                        <Link href={`/dashboard/invoices/${i.id}`} className={p.textBtn}>
                          View
                        </Link>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className={s.payBar} data-show={chosen.length ? "" : undefined} aria-hidden={!chosen.length}>
        <span>
          <strong>
            {chosen.length} {chosen.length === 1 ? "invoice" : "invoices"}
          </strong>{" "}
          selected, <span className="tabular">{formatMoney(chosenTotal)}</span>
        </span>
        <button type="button" className={p.textBtn} tabIndex={chosen.length ? 0 : -1} onClick={() => setPicked(new Set())}>
          Clear
        </button>
        <button type="button" className={p.primary} tabIndex={chosen.length ? 0 : -1} onClick={() => onPay(chosen)}>
          Pay selected
        </button>
      </div>
    </section>
  );
}

function PayDialog({ invoices, onClose, onPaid }: { invoices: InvoiceView[]; onClose: () => void; onPaid: (p: Payment) => void }) {
  const { methods, defaultId } = usePaymentMethods();
  const [choice, setChoice] = useState<string>(defaultId ?? methods[0]?.id ?? "wire");
  const [wireSent, setWireSent] = useState(false);
  const [error, setError] = useState("");
  const payable = invoices.filter((i) => i.state === "open" && i.balance > 0);
  const total = payable.reduce((sum, i) => sum + i.balance, 0);
  const method = methods.find((m) => m.id === choice);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (choice === "wire" && !wireSent) return setError("Tick the box once the wire has been sent.");
    if (choice !== "wire" && !method) return setError("Choose how to pay.");
    setError("");
    const payment = method ? payInvoices(payable, method.kind === "card" ? "card" : "ach", methodLabel(method)) : payInvoices(payable, "wire", "Wire transfer");
    onPaid(payment);
  };

  return (
    <div className={s.dialogRoot} role="presentation" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className={s.backdrop} onClick={onClose} />
      <form className={s.dialog} role="dialog" aria-modal="true" aria-labelledby="pay-title" onSubmit={submit}>
        <header className={s.dialogHead}>
          <h2 id="pay-title" className={p.panelTitle}>
            Pay {payable.length === 1 ? `invoice ${payable[0].number}` : `${payable.length} invoices`}
          </h2>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close" autoFocus>
            <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <path d="M3 3l10 10M13 3 3 13" />
            </svg>
          </button>
        </header>
        <ul className={s.payList}>
          {payable.map((i) => (
            <li key={i.id}>
              <span>
                Invoice {i.number}
                <span className={s.sub}>{i.overdue > 0 ? `${i.overdue} days past due` : `Due ${longDate(i.due)}`}</span>
              </span>
              <strong className="tabular">{formatMoney(i.balance)}</strong>
            </li>
          ))}
        </ul>
        <p className={s.payTotal}>
          <span>Total</span>
          <strong className="tabular">{formatMoney(total)}</strong>
        </p>

        <fieldset className={s.methods}>
          <legend className={p.label}>Pay with</legend>
          {methods.map((m) => (
            <label key={m.id} className={s.method}>
              <input type="radio" name="pay-method" checked={choice === m.id} onChange={() => setChoice(m.id)} />
              <span>
                {methodLabel(m)}
                {m.id === defaultId && <span className={s.sub}>Default</span>}
              </span>
            </label>
          ))}
          <label className={s.method}>
            <input type="radio" name="pay-method" checked={choice === "wire"} onChange={() => setChoice("wire")} />
            <span>
              Wire transfer
              <span className={s.sub}>Send it with the instructions from Accounts, then record it here</span>
            </span>
          </label>
          {methods.length === 0 && (
            <p className={s.hint}>
              No card or bank account on file yet. <Link href="/dashboard/payments">Add one on Payment methods</Link>.
            </p>
          )}
        </fieldset>
        {choice === "wire" && (
          <label className={s.confirm}>
            <input type="checkbox" checked={wireSent} onChange={(e) => setWireSent(e.target.checked)} />
            <span>I have sent a wire for {formatMoney(total)}. For wire details, <Link href="/contact?type=account">ask Accounts</Link>.</span>
          </label>
        )}
        {method?.kind === "card" && <p className={s.hint}>Card payments may carry a convenience fee, which Accounts confirms.</p>}
        {error && (
          <p className={p.error} role="alert">
            {error}
          </p>
        )}
        <div className={s.dialogDoors}>
          <button type="submit" className={p.primary}>
            {choice === "wire" ? "Record the wire" : `Pay ${formatMoney(total)}`}
          </button>
          <button type="button" className={p.textBtn} onClick={onClose}>
            Cancel
          </button>
        </div>
        <p className={s.hint}>Preview: no money moves. Payments run through Surreal&apos;s card processor once it is connected.</p>
      </form>
    </div>
  );
}

function Receipt({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  return (
    <div className={s.receipt} role="status">
      <span className={s.tick} aria-hidden>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 10 17l9-10" />
        </svg>
      </span>
      <div>
        <p className={s.receiptTitle}>
          {payment.kind === "wire" ? "Wire recorded" : "Payment received"}, {payment.id}
        </p>
        <p>
          {formatMoney(payment.amount)} by {payment.method} against {payment.allocations.length} {payment.allocations.length === 1 ? "invoice" : "invoices"}. It shows as pending posting until Accounts records it on your account. Questions:{" "}
          {brand.office.phone}.
        </p>
      </div>
      <button type="button" className={p.textBtn} onClick={onClose}>
        Close
      </button>
    </div>
  );
}

function Payments({ payments, invoices }: { payments: Payment[]; invoices: InvoiceView[] }) {
  const numberOf = (id: string) => invoices.find((i) => i.id === id)?.number ?? id;
  if (payments.length === 0) {
    return (
      <div className={p.emptyBig}>
        <p className={p.emptyTitle}>No payments yet</p>
      </div>
    );
  }
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Receipt</th>
            <th scope="col">Method</th>
            <th scope="col">Applied to</th>
            <th scope="col" className={s.num}>
              Amount
            </th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((pm) => (
            <tr key={pm.id}>
              <td>{longDate(pm.date)}</td>
              <th scope="row" className="tabular">
                {pm.id}
                {pm.sample && <span className={p.sampleTag}>Sample</span>}
              </th>
              <td>{pm.method}</td>
              <td>{pm.allocations.map((a) => `Invoice ${numberOf(a.invoiceId)}`).join(", ")}</td>
              <td className={`${s.num} tabular`}>{formatMoney(pm.amount)}</td>
              <td>
                <span className={s.chip} data-tone={pm.pending ? "info" : "ok"}>
                  {pm.pending ? "Pending posting" : "Posted"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Statement({ account, store }: { account: NonNullable<ReturnType<typeof useAccount>>; store: string }) {
  const [period, setPeriod] = useState<Period>("90");
  const now = useNow();
  const from = useMemo(() => {
    if (period === "all") return "0000-00-00";
    if (period === "year") return `${new Date(now).getFullYear()}-01-01`;
    return new Date(now - 90 * 864e5).toISOString().slice(0, 10);
  }, [period, now]);
  const before = account.statement.filter((e) => e.date < from);
  const opening = before.length ? before[before.length - 1].balance : 0;
  const rows = account.statement.filter((e) => e.date >= from);
  const closing = rows.length ? rows[rows.length - 1].balance : opening;

  const csv = () =>
    downloadCsv(`surreal-statement-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Date", "Document", "Reference", "Description", "Charges", "Credits", "Balance"],
      ["", "Opening balance", "", "", "", "", opening.toFixed(2)],
      ...rows.map((e) => [e.date, e.kind, e.ref, e.description, e.charge ? e.charge.toFixed(2) : "", e.creditAmount ? e.creditAmount.toFixed(2) : "", e.balance.toFixed(2)]),
    ]);

  return (
    <section aria-label="Statement" className={s.statement}>
      <div className={p.toolbar}>
        <div className={p.chips} role="group" aria-label="Period">
          {(
            [
              ["90", "Last 90 days"],
              ["year", "This year"],
              ["all", "All"],
            ] as [Period, string][]
          ).map(([id, label]) => (
            <button key={id} type="button" className={p.chip} aria-pressed={period === id} onClick={() => setPeriod(id)}>
              {label}
            </button>
          ))}
        </div>
        <span className={s.toolbarEnd}>
          <button type="button" className={p.textBtn} onClick={csv}>
            Download CSV
          </button>
          <button type="button" className={p.textBtn} onClick={() => window.print()}>
            Print
          </button>
        </span>
      </div>
      <p className={s.statementHead}>
        Statement for {store}, {period === "all" ? "all activity" : `from ${longDate(from)}`} to {longDate(new Date(now).toISOString())}.
      </p>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Document</th>
              <th scope="col">Description</th>
              <th scope="col" className={s.num}>
                Charges
              </th>
              <th scope="col" className={s.num}>
                Credits
              </th>
              <th scope="col" className={s.num}>
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className={s.subtotalRow}>
              <td colSpan={5}>Opening balance</td>
              <td className={`${s.num} tabular`}>{formatMoney(opening)}</td>
            </tr>
            {rows.map((e, i) => (
              <tr key={`${e.ref}-${i}`}>
                <td>{longDate(e.date)}</td>
                <th scope="row">
                  {e.kind} <span className={s.sub}>{e.ref}</span>
                </th>
                <td>{e.description}</td>
                <td className={`${s.num} tabular`}>{e.charge ? formatMoney(e.charge) : ""}</td>
                <td className={`${s.num} tabular`}>{e.creditAmount ? formatMoney(e.creditAmount) : ""}</td>
                <td className={`${s.num} tabular`}>{formatMoney(e.balance)}</td>
              </tr>
            ))}
            <tr className={s.subtotalRow}>
              <td colSpan={5}>Closing balance</td>
              <td className={`${s.num} tabular`}>
                <strong>{formatMoney(closing)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Reconcile({ invoices, balance, history }: { invoices: InvoiceView[]; balance: number; history: InvoiceReconciliation[] }) {
  const list = invoices.filter((i) => i.state !== "paid");
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [disputes, setDisputes] = useState<Record<string, { reason: DisputeReason; note: string }>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<InvoiceReconciliation | null>(null);

  const toggleMatch = (id: string) => {
    const next = new Set(matched);
    if (next.has(id)) next.delete(id);
    else {
      next.add(id);
      const d = { ...disputes };
      delete d[id];
      setDisputes(d);
    }
    setMatched(next);
  };
  const toggleDispute = (id: string) => {
    const d = { ...disputes };
    if (d[id]) delete d[id];
    else {
      d[id] = { reason: "Amount differs", note: "" };
      const next = new Set(matched);
      next.delete(id);
      setMatched(next);
    }
    setDisputes(d);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const flagged = Object.entries(disputes);
    if (!confirmed && matched.size === 0 && flagged.length === 0) return setError("Tick the invoices that match, flag the ones that differ, or confirm the balance.");
    if (flagged.some(([, d]) => d.reason === "Other" && !d.note.trim())) return setError("Add a note for each difference marked Other.");
    setError("");
    setSent(
      sendInvoiceReconciliation({
        through: new Date().toISOString().slice(0, 10),
        confirmed,
        matched: [...matched],
        disputes: flagged.map(([invoiceId, d]) => ({ invoiceId, reason: d.reason, note: d.note.trim() })),
      }),
    );
    setMatched(new Set());
    setDisputes({});
    setConfirmed(false);
  };

  return (
    <section aria-label="Reconcile" className={s.reconcile}>
      <p className={p.lead}>
        Check your open invoices against your records. Tick the ones that match and flag any that differ; Accounts reviews each difference. Memo items are reconciled on{" "}
        <Link href="/dashboard/memo" className={p.textLink}>
          Open memo items
        </Link>
        , and the ones you report sold arrive here as invoices awaiting issue.
      </p>

      {sent && (
        <p className={p.notice} role="status">
          Reconciliation {sent.number} sent: {sent.matched.length} matched, {sent.disputes.length} {sent.disputes.length === 1 ? "difference" : "differences"} flagged{sent.confirmed ? ", balance confirmed" : ""}. Flagged invoices show as In review.
        </p>
      )}

      <form onSubmit={submit} noValidate>
        {list.length === 0 && <p className={p.notice}>No open invoices to check. You can still confirm your balance below.</p>}
        <ul className={s.reconList}>
          {list.map((i) => {
            const d = disputes[i.id];
            return (
              <li key={i.id} className={s.reconItem} data-flagged={d ? "" : undefined}>
                <div className={s.reconRow}>
                  <span className={s.reconText}>
                    <strong>{i.number ? `Invoice ${i.number}` : "Being invoiced"}</strong>
                    <span className={s.sub}>
                      {longDate(i.date)}, {i.reference}
                      {i.po ? `, ${i.po}` : ""}
                    </span>
                  </span>
                  <strong className="tabular">{formatMoney(i.state === "awaiting" ? i.total : i.balance)}</strong>
                  <StatusChip inv={i} />
                  <span className={s.reconDoors}>
                    <label className={s.reconCheck}>
                      <input type="checkbox" checked={matched.has(i.id)} onChange={() => toggleMatch(i.id)} />
                      Matches
                    </label>
                    <button type="button" className={s.flagBtn} aria-pressed={Boolean(d)} onClick={() => toggleDispute(i.id)}>
                      {d ? "Flagged" : "Flag a difference"}
                    </button>
                  </span>
                </div>
                {d && (
                  <div className={s.disputeRow}>
                    <label className={s.field}>
                      <span className={p.label}>Reason</span>
                      <select value={d.reason} onChange={(e) => setDisputes({ ...disputes, [i.id]: { ...d, reason: e.target.value as DisputeReason } })}>
                        {DISPUTE_REASONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                    <label className={`${s.field} ${s.fieldWide}`}>
                      <span className={p.label}>Note{d.reason === "Other" ? "" : " (optional)"}</span>
                      <input value={d.note} onChange={(e) => setDisputes({ ...disputes, [i.id]: { ...d, note: e.target.value } })} placeholder="For example, we were invoiced for 3 pieces and received 2" />
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <label className={s.confirm}>
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          <span>I confirm our open balance of {formatMoney(balance)} matches our records, apart from anything flagged above.</span>
        </label>
        {error && (
          <p className={p.error} role="alert">
            {error}
          </p>
        )}
        <div className={s.dialogDoors}>
          <button type="submit" className={p.primary}>
            Send reconciliation
          </button>
          <span className={p.hintText}>Questions about your account? Call {brand.office.phone}.</span>
        </div>
      </form>

      {history.length > 0 && (
        <div className={s.history}>
          <h2 className={p.panelTitle}>Sent</h2>
          <ul>
            {history.map((h) => (
              <li key={h.number}>
                <strong className="tabular">{h.number}</strong> {longDate(h.sentAt)}: {h.matched.length} matched, {h.disputes.length} flagged{h.confirmed ? ", balance confirmed" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
