"use client";

/**
 * One invoice as a printable document (/dashboard/invoices/[id]), on a
 * PLACEHOLDER template until Surreal sends its invoice layout: the letterhead
 * (wordmark, North American Office, phone), the invoice number, dates, terms
 * and PO, who it is billed to, the lines, the totals with payments and
 * credits applied, the balance due, and how to pay (online in the dashboard,
 * or by check to the office; wire and ACH details come from Accounts and are
 * never printed here). A stamp marks it Paid, Pending posting or Past due.
 * Print saves it as a PDF; an open invoice can be paid from here.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { brand } from "@/content/site";
import { useDealer } from "@/lib/dealer";
import { canSeeBilling, formatMoney, useAccount, type InvoiceView, type Payment } from "@/lib/invoices";
import { methodLabel, usePaymentMethods } from "@/lib/account";
import { payInvoices } from "@/lib/invoices";
import { StatusChip } from "./InvoicesPage";
import p from "./pages.module.css";
import s from "./invoices.module.css";

const longDate = (d: string) => new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default function InvoiceDocument() {
  const params = useParams<{ id: string }>();
  const dealer = useDealer();
  const account = useAccount();
  const { methods, defaultId } = usePaymentMethods();
  const [paid, setPaid] = useState<Payment | null>(null);

  if (!dealer || !account) return null;
  if (!canSeeBilling(dealer)) {
    return (
      <div className={p.page}>
        <p className={p.lead}>Invoices are open to your store&apos;s account owner.</p>
        <Link href="/dashboard" className={p.secondary}>
          Back to the dashboard
        </Link>
      </div>
    );
  }
  const inv: InvoiceView | undefined = account.invoices.find((i) => i.id === decodeURIComponent(params.id));
  if (!inv) {
    return (
      <div className={p.page}>
        <div className={p.emptyBig}>
          <p className={p.emptyTitle}>Invoice not found</p>
          <Link href="/dashboard/invoices" className={p.primary}>
            All invoices
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = inv.lines.reduce((sum, l) => sum + l.qty * l.unit, 0);
  const appliedBefore = inv.applied;
  const method = methods.find((m) => m.id === defaultId) ?? methods[0];
  const stamp = inv.state === "paid" ? (inv.pendingPosting ? { tone: "pending", text: "Paid, pending posting" } : { tone: "paid", text: "Paid" }) : inv.overdue > 0 ? { tone: "overdue", text: "Past due" } : null;
  const payNow = () => {
    if (method) setPaid(payInvoices([inv], method.kind === "card" ? "card" : "ach", methodLabel(method)));
  };

  return (
    <div className={p.page}>
      <nav aria-label="Breadcrumb" className={p.crumbs} data-no-print>
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden>/</span>
        <Link href="/dashboard/invoices">Invoices and payments</Link>
        <span aria-hidden>/</span>
        <span aria-current="page">{inv.number ? `Invoice ${inv.number}` : "Being invoiced"}</span>
      </nav>

      <div className={s.docBar} data-no-print>
        <StatusChip inv={inv} />
        <span className={s.docDoors}>
          <Link href="/dashboard/invoices" className={p.textBtn}>
            All invoices
          </Link>
          <button type="button" className={p.secondary} onClick={() => window.print()}>
            Print or save as PDF
          </button>
          {inv.state === "open" && inv.balance > 0 && !paid && (
            method ? (
              <button type="button" className={p.primary} onClick={payNow}>
                Pay {formatMoney(inv.balance)} with {methodLabel(method)}
              </button>
            ) : (
              <Link href="/dashboard/invoices" className={p.primary}>
                Pay this invoice
              </Link>
            )
          )}
        </span>
      </div>
      {paid && (
        <p className={p.notice} role="status" data-no-print>
          Payment {paid.id} received: {formatMoney(paid.amount)} by {paid.method}. It shows as pending posting until Accounts records it on your account.
        </p>
      )}

      <article className={s.doc} aria-label={inv.number ? `Invoice ${inv.number}` : "Invoice being issued"}>
        {stamp && (
          <span className={s.stamp} data-tone={stamp.tone} aria-hidden>
            {stamp.text}
          </span>
        )}
        <header className={s.docHead}>
          <div className={s.docBrand}>
            <span className={s.docWordmark}>SURREAL</span>
            <span>{brand.name}, {brand.office.label}</span>
            <span>
              {brand.office.address1}, {brand.office.address2}
            </span>
            <span>{brand.office.phone}</span>
          </div>
          <div className={s.docTitle}>
            <h1>{inv.state === "awaiting" ? "Invoice to be issued" : "Invoice"}</h1>
            <p className="tabular">{inv.number ? `No. ${inv.number}` : "Number on issue"}</p>
          </div>
        </header>

        <dl className={s.docMeta}>
          <div>
            <dt>Date</dt>
            <dd>{longDate(inv.date)}</dd>
          </div>
          <div>
            <dt>Terms</dt>
            <dd>{inv.terms}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{inv.state === "awaiting" ? "On issue" : longDate(inv.due)}</dd>
          </div>
          <div>
            <dt>Purchase order</dt>
            <dd>{inv.po || "None"}</dd>
          </div>
        </dl>

        <div className={s.docParties}>
          <div>
            <h2>Bill to</h2>
            <strong>{dealer.store}</strong>
            <br />
            {dealer.contact}
            <br />
            {dealer.email}
            {dealer.account && (
              <>
                <br />
                Account {dealer.account}
              </>
            )}
          </div>
          <div>
            <h2>Reference</h2>
            {inv.reference}
            {inv.sample && (
              <>
                <br />
                Sample invoice
              </>
            )}
          </div>
        </div>

        <table className={s.docLines}>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Description</th>
              <th scope="col" className={s.num}>
                Qty
              </th>
              <th scope="col" className={s.num}>
                Unit price
              </th>
              <th scope="col" className={s.num}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l, i) => (
              <tr key={i}>
                <td className="tabular">{l.ref ?? ""}</td>
                <td>{l.description}</td>
                <td className={`${s.num} tabular`}>{l.qty}</td>
                <td className={`${s.num} tabular`}>{formatMoney(l.unit)}</td>
                <td className={`${s.num} tabular`}>{formatMoney(l.unit * l.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={s.docTotals}>
          <div>
            <span>Subtotal</span>
            <span className="tabular">{formatMoney(subtotal)}</span>
          </div>
          <div>
            <span>Shipping</span>
            <span className="tabular">{formatMoney(inv.shipping)}</span>
          </div>
          <div>
            <span>Sales tax</span>
            <span className="tabular">{formatMoney(inv.tax)}</span>
          </div>
          <div>
            <strong>Total</strong>
            <strong className="tabular">{formatMoney(inv.total)}</strong>
          </div>
          {appliedBefore > 0 && (
            <div>
              <span>Payments and credits</span>
              <span className="tabular">{formatMoney(-appliedBefore)}</span>
            </div>
          )}
          {inv.paidHere > 0 && (
            <div>
              <span>Paid online, pending posting</span>
              <span className="tabular">{formatMoney(-inv.paidHere)}</span>
            </div>
          )}
          <div className={s.docDue}>
            <span>Balance due</span>
            <span className="tabular">{formatMoney(inv.state === "awaiting" ? inv.total : inv.balance)}</span>
          </div>
        </div>

        <section className={s.docRemit}>
          <h2>How to pay</h2>
          <p>Online in the Retailer Dashboard, under Invoices and payments, by card or bank account.</p>
          <p>
            By check payable to Surreal Diamond, LLC, {brand.office.address1}, {brand.office.address2}. For wire or ACH details, contact Accounts at {brand.office.phone}.
          </p>
          <p>Please quote the invoice number with your payment.</p>
        </section>
        <p className={s.docNote}>Placeholder invoice template. Surreal&apos;s own invoice layout replaces it before launch.</p>
      </article>
    </div>
  );
}
