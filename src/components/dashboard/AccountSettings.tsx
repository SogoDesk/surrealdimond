"use client";

/**
 * Account settings (F-E2): the dealer's details as Surreal holds them, the
 * people on the store's account, and a password change. Details come from
 * the customer record (imported in the console, Dealers); changes to them go
 * through Surreal so RightClick stays the record. The demo dealer has no
 * password to change.
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signOut, useDealer } from "@/lib/dealer";
import { checkPassword, setPassword, verifyPassword } from "@/lib/auth";
import { useCustomers, type Customer } from "@/lib/customers";
import PasswordRules from "@/components/account/PasswordRules";
import p from "./pages.module.css";
import s from "./account.module.css";

const ROLE_LINE: Record<Customer["role"], string> = {
  owner: "Account owner: orders, memo, invoices, payments and payment methods.",
  associate: "Associate: orders and memo. Invoices and payments stay with the account owner.",
};
const STATUS: Record<Customer["status"], string> = { active: "Active", invited: "Setup link sent", "not-invited": "Not invited yet" };

const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

function ChangePassword({ c }: { c: Customer }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setDone(false);
    if (!current) return setError("Enter your current password.");
    if (!checkPassword(next, { email: c.email, company: c.company }).valid) return setError("The new password does not meet every rule yet.");
    if (next !== confirm) return setError("The two new passwords do not match.");
    if (next === current) return setError("Choose a password different from the current one.");
    setBusy(true);
    const result = await verifyPassword(c.email, current);
    if (!result.ok) {
      setBusy(false);
      if (result.reason === "locked") return setError(`Too many wrong passwords. Try again in ${result.minutes} minutes.`);
      return setError(`Your current password does not match.${result.left ? ` ${result.left} ${result.left === 1 ? "try" : "tries"} left.` : ""}`);
    }
    await setPassword(c.email, next);
    setBusy(false);
    setError("");
    setCurrent("");
    setNext("");
    setConfirm("");
    setDone(true);
  };

  const type = show ? "text" : "password";
  return (
    <form className={s.form} onSubmit={submit} noValidate>
      <label className={`${s.field} ${s.wideField}`}>
        <span>Current password</span>
        <input type={type} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </label>
      <label className={s.field}>
        <span>New password</span>
        <input type={type} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-describedby="change-rules" />
      </label>
      <label className={s.field}>
        <span>Confirm new password</span>
        <input type={type} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      <div id="change-rules" className={s.wideField}>
        <PasswordRules password={next} email={c.email} company={c.company} />
      </div>
      <label className={s.check}>
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        Show passwords
      </label>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className={p.notice} role="status">
          Password changed. Use the new one next time you log in.
        </p>
      )}
      <button type="submit" className={p.primary} disabled={busy}>
        {busy ? "Saving" : "Change password"}
      </button>
    </form>
  );
}

export default function AccountSettings() {
  const router = useRouter();
  const dealer = useDealer();
  const customers = useCustomers();
  if (!dealer) return null;

  const c = customers.find((x) => x.email.toLowerCase() === dealer.email.toLowerCase());
  const team = c ? customers.filter((x) => x.account === c.account) : [];
  const role = dealer.role ?? "owner";

  return (
    <div className={p.page}>
      <nav aria-label="Breadcrumb" className={p.crumbs}>
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden>/</span>
        <span aria-current="page">Account settings</span>
      </nav>
      <header className={p.head}>
        <div>
          <p className={p.kicker}>Your account</p>
          <h1 className={p.title}>Account settings</h1>
          <p className={p.lead}>Your details as Surreal holds them, the people on your store&apos;s account, and your password.</p>
        </div>
      </header>
      {dealer.demo && <p className={p.sampleNote}>You are exploring as the demo dealer, which has no password. Log in with one of the test accounts to try a password change.</p>}

      <div className={s.columns}>
        <section className={p.panel} aria-labelledby="acct-details">
          <div className={p.panelHead}>
            <h2 id="acct-details" className={p.panelTitle}>
              Your details
            </h2>
            {c && <span className={p.status}>{STATUS[c.status]}</span>}
          </div>
          <dl className={s.details}>
            <div>
              <dt>Store</dt>
              <dd>{dealer.store}</dd>
            </div>
            <div>
              <dt>Account</dt>
              <dd>{dealer.account ?? (dealer.demo ? "DEMO" : "Not linked yet")}</dd>
            </div>
            <div>
              <dt>Name</dt>
              <dd>{dealer.contact}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{dealer.email}</dd>
            </div>
            {c && (
              <>
                <div>
                  <dt>Phone</dt>
                  <dd>{c.phone || "Not on file"}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{[c.city, c.state].filter(Boolean).join(", ") || "Not on file"}</dd>
                </div>
              </>
            )}
            <div className={s.wideField}>
              <dt>Role</dt>
              <dd>{ROLE_LINE[role]}</dd>
            </div>
            {c?.activatedAt && (
              <div className={s.wideField}>
                <dt>On the new site since</dt>
                <dd>{date(c.activatedAt)}</dd>
              </div>
            )}
          </dl>
          <p className={s.detailsNote}>
            Something out of date? <Link href="/contact?type=account" className={p.textLink}>Tell us</Link> and we will update it in our records, so your invoices and statements match.
          </p>
        </section>

        <section className={p.panel} aria-labelledby="acct-password">
          <h2 id="acct-password" className={p.panelTitle}>
            Password
          </h2>
          {c && !dealer.demo ? (
            <ChangePassword c={c} />
          ) : (
            <p className={s.empty}>{dealer.demo ? "The demo dealer signs in without a password." : "This account signs in through Surreal. Ask us to link it to your email."}</p>
          )}
          <div className={s.otherDoors}>
            <button
              type="button"
              className={p.textBtn}
              onClick={() => {
                signOut();
                router.push("/login");
              }}
            >
              Log out of this browser
            </button>
          </div>
        </section>
      </div>

      {team.length > 0 && (
        <section className={p.panel} aria-labelledby="acct-team">
          <div className={p.panelHead}>
            <h2 id="acct-team" className={p.panelTitle}>
              People on this account
            </h2>
            <span className={p.count}>{team.length}</span>
          </div>
          <ul className={s.team}>
            {team.map((m) => (
              <li key={m.id}>
                <span className={s.methodText}>
                  <span className={s.methodName}>
                    {m.contact}
                    {m.id === c?.id ? " (you)" : ""}
                  </span>
                  <span className={s.methodMeta}>{m.email}</span>
                </span>
                <span className={s.methodMeta}>{m.role === "owner" ? "Account owner" : "Associate"}</span>
                <span className={p.status}>{STATUS[m.status]}</span>
              </li>
            ))}
          </ul>
          <p className={s.detailsNote}>To add or remove someone, {role === "owner" ? "" : "ask your account owner to "}contact Surreal. Each person gets their own login.</p>
        </section>
      )}
    </div>
  );
}
