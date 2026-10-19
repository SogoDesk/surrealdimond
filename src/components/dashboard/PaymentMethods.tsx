"use client";

/**
 * Payment methods (BRD R-27), inside the dashboard shell: the cards and bank
 * accounts on the dealer's account, one of them the default, and the other
 * ways to keep the account current (wire, check, Zelle) through finance.
 * Checkout offers card, ACH and wire (B-05).
 *
 * In the preview a method keeps only its brand or bank, the last four digits
 * and the expiry, in this browser; no full card or account number is ever
 * asked for. The card processor (C-10) holds the real methods later, and
 * invoice payment arrives with the payment portal in Phase 2.
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  addPaymentMethod,
  methodLabel,
  removePaymentMethod,
  setDefaultPaymentMethod,
  usePaymentMethods,
  type AccountType,
  type CardBrand,
  type PaymentMethod,
} from "@/lib/account";
import p from "./pages.module.css";
import s from "./account.module.css";

const BRANDS: CardBrand[] = ["Visa", "Mastercard", "American Express", "Discover"];
const FINANCE = "/contact?type=account";

function MethodIcon({ kind }: { kind: PaymentMethod["kind"] }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {kind === "card" ? (
        <>
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="M3 10h18M7 15h4" />
        </>
      ) : (
        <>
          <path d="M3 9.5 12 4l9 5.5" />
          <path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3.5 19.5h17" />
        </>
      )}
    </svg>
  );
}

export default function PaymentMethods() {
  const { methods, defaultId } = usePaymentMethods();
  const [kind, setKind] = useState<PaymentMethod["kind"]>("card");
  const [error, setError] = useState("");
  const [added, setAdded] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const last4 = get("last4");
    if (!/^\d{4}$/.test(last4)) return setError("Enter the last four digits only.");
    if (kind === "card") {
      const expiry = get("expiry");
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return setError("Enter the expiry as MM/YY.");
      addPaymentMethod({ kind: "card", brand: get("brand") as CardBrand, last4, expiry, name: get("name") });
      setAdded(`${get("brand")} ending ${last4}`);
    } else {
      if (!get("bank")) return setError("Enter the bank's name.");
      addPaymentMethod({ kind: "ach", bank: get("bank"), type: get("type") as AccountType, last4, name: get("name") });
      setAdded(`${get("type")} at ${get("bank")} ending ${last4}`);
    }
    setError("");
    e.currentTarget.reset();
  };

  return (
    <div className={p.page}>
      <nav aria-label="Breadcrumb" className={p.crumbs}>
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden>/</span>
        <span aria-current="page">Payment methods</span>
      </nav>
      <header className={p.head}>
        <div>
          <p className={p.kicker}>Your account</p>
          <h1 className={p.title}>Payment methods</h1>
          <p className={p.lead}>The cards and bank accounts on your account, and the default used at checkout. Wire, check and Zelle go through our finance team.</p>
        </div>
      </header>
      <p className={p.sampleNote}>
        Preview: methods are kept in this browser, and only the last four digits are stored. Once the card processor is connected, it keeps your
        cards and bank accounts, never this site.
      </p>

      <div className={s.columns}>
        <section className={p.panel} aria-labelledby="pm-list">
          <div className={p.panelHead}>
            <h2 id="pm-list" className={p.panelTitle}>
              On your account
            </h2>
            <span className={p.count}>{methods.length ? `${methods.length} saved` : ""}</span>
          </div>
          {methods.length === 0 ? (
            <p className={s.empty}>No payment methods yet. Add a card or a bank account and it becomes your default at checkout.</p>
          ) : (
            <ul className={s.methods}>
              {methods.map((m) => {
                const isDefault = m.id === defaultId;
                return (
                  <li key={m.id} className={s.method} data-default={isDefault ? "true" : undefined}>
                    <span className={s.methodIcon}>
                      <MethodIcon kind={m.kind} />
                    </span>
                    <span className={s.methodText}>
                      <span className={s.methodName}>{methodLabel(m)}</span>
                      <span className={s.methodMeta}>
                        {m.kind === "card" ? `Expires ${m.expiry}` : "ACH"}
                        {m.name ? `, ${m.name}` : ""}
                      </span>
                    </span>
                    {isDefault ? (
                      <span className={p.status}>Default</span>
                    ) : (
                      <button type="button" className={p.textBtn} onClick={() => setDefaultPaymentMethod(m.id)}>
                        Make default
                      </button>
                    )}
                    <button type="button" className={p.textBtn} onClick={() => removePaymentMethod(m.id)} aria-label={`Remove ${methodLabel(m)}`}>
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={p.panel} aria-labelledby="pm-add">
          <h2 id="pm-add" className={p.panelTitle}>
            Add a method
          </h2>
          <div className={s.kinds} role="tablist" aria-label="Method">
            <button type="button" role="tab" aria-selected={kind === "card"} className={s.kind} onClick={() => { setKind("card"); setError(""); }}>
              Card
            </button>
            <button type="button" role="tab" aria-selected={kind === "ach"} className={s.kind} onClick={() => { setKind("ach"); setError(""); }}>
              Bank account (ACH)
            </button>
          </div>
          <form key={kind} className={s.form} onSubmit={submit} noValidate>
            {kind === "card" ? (
              <>
                <label className={s.field}>
                  <span>Card</span>
                  <select name="brand" defaultValue="Visa">
                    {BRANDS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </label>
                <label className={s.field}>
                  <span>Name on card</span>
                  <input name="name" autoComplete="cc-name" />
                </label>
                <label className={s.field}>
                  <span>Last four digits</span>
                  <input name="last4" inputMode="numeric" maxLength={4} placeholder="4242" />
                </label>
                <label className={s.field}>
                  <span>Expiry</span>
                  <input name="expiry" placeholder="MM/YY" maxLength={5} />
                </label>
              </>
            ) : (
              <>
                <label className={s.field}>
                  <span>Bank</span>
                  <input name="bank" placeholder="Bank name" />
                </label>
                <label className={s.field}>
                  <span>Account</span>
                  <select name="type" defaultValue="Checking">
                    <option>Checking</option>
                    <option>Savings</option>
                  </select>
                </label>
                <label className={s.field}>
                  <span>Account holder</span>
                  <input name="name" />
                </label>
                <label className={s.field}>
                  <span>Last four digits</span>
                  <input name="last4" inputMode="numeric" maxLength={4} placeholder="6789" />
                </label>
              </>
            )}
            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}
            {added && !error && (
              <p className={p.notice} role="status">
                {added} is on your account.
              </p>
            )}
            <button type="submit" className={p.primary}>
              Save {kind === "card" ? "card" : "bank account"}
            </button>
          </form>
        </section>
      </div>

      <section className={p.panel} aria-labelledby="pm-other">
        <h2 id="pm-other" className={p.panelTitle}>
          Other ways to pay
        </h2>
        <ul className={s.other}>
          <li>
            <strong>Wire transfer</strong>
            <span>Offered at checkout. Our finance team sends the wire details with your order.</span>
          </li>
          <li>
            <strong>Check</strong>
            <span>To keep the account current. Ask finance for the remittance details.</span>
          </li>
          <li>
            <strong>Zelle</strong>
            <span>To keep the account current. Ask finance for the details.</span>
          </li>
        </ul>
        <div className={s.otherDoors}>
          <Link href={FINANCE} className={p.secondary}>
            Ask about billing
          </Link>
          <span className={p.count}>Invoices, statements and paying them online arrive with the payment portal.</span>
        </div>
      </section>
    </div>
  );
}
