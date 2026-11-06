"use client";

/**
 * Set up a password (F-E2): where the setup link from the console import,
 * the login page or Forgot password lands. The link carries a one-time token
 * (only its hash is stored) that is good for 72 hours.
 *
 * - Valid: the customer sees their store and email, picks a password against
 *   the rules (live checklist and strength), confirms it, and is signed in.
 * - Expired: a new link can be sent to the same email.
 * - Used or unknown: back to log in, with Forgot password.
 */

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import { signIn } from "@/lib/dealer";
import { checkPassword } from "@/lib/auth";
import PasswordRules from "./PasswordRules";
import { INVITE_HOURS, completeSetup, createSetupLink, lookupSetupLink, type Customer, type SetupLink } from "@/lib/customers";
import { authApi, toDealerSession } from "@/lib/api/auth";
import { API_AUTH, ApiRequestError } from "@/lib/api/client";
import { account, brand } from "@/content/site";
import s from "./account.module.css";

const COMING = ["Your orders and their tracking", "Stones on memo, and memo reports", "Open invoices, payments and statements", "Saved payment methods and addresses"];

/** Who a link is for: the preview's customer, or the API's answer in the same shape. */
type Who = Pick<Customer, "id" | "email" | "company" | "contact" | "account">;
type SetupView = { state: "valid"; customer: Who; expires: number } | { state: "expired"; customer: Who } | { state: "invalid" };

async function lookupThroughApi(token: string): Promise<SetupView> {
  const found = await authApi.lookup(token);
  if (found.state === "invalid") return { state: "invalid" };
  const customer: Who = { id: "", email: found.person.email, company: found.person.company ?? "", contact: found.person.name, account: found.person.account ?? "" };
  if (found.state === "expired") return { state: "expired", customer };
  return { state: "valid", customer, expires: new Date(found.expiresAt).getTime() };
}

const lookup = (token: string): Promise<SetupView> => (API_AUTH ? lookupThroughApi(token) : lookupSetupLink(token));

function SetupForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [found, setFound] = useState<SetupView | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const [resent, setResent] = useState<SetupLink | null>(null);
  const [sentAgain, setSentAgain] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    let live = true;
    lookup(token)
      .then((r) => {
        if (live) setFound(r);
      })
      .catch(() => {
        if (live) setServerError("We could not reach the server. Please reload this page to try again.");
      });
    return () => {
      live = false;
    };
  }, [token]);

  if (!found) {
    return (
      <div className={s.card} aria-busy={!serverError}>
        <p className={s.eyebrow}>Checking your link</p>
        {serverError && (
          <p className={s.error} role="alert">
            {serverError}
          </p>
        )}
      </div>
    );
  }

  if (found.state === "invalid") {
    return (
      <div className={s.card}>
        <p className={s.eyebrow}>Set up your password</p>
        <h1 className={s.title}>
          This link has <em>been used</em>
        </h1>
        <p className={s.lead}>
          A setup link works once, and a newer link replaces an older one. If you have already set your password, log in. If not, use Forgot password on the log in page for a fresh link, or call {brand.office.phone}.
        </p>
        <div className={s.doors}>
          <Link href={account.login} className={s.primary}>
            Go to log in
          </Link>
        </div>
      </div>
    );
  }

  const c = found.customer;

  if (found.state === "expired") {
    return (
      <div className={s.card}>
        <p className={s.eyebrow}>Set up your password</p>
        <h1 className={s.title}>
          This link has <em>expired</em>
        </h1>
        <p className={s.lead}>
          {API_AUTH ? "Links do not last forever." : `Setup links last ${INVITE_HOURS} hours.`} We can send a new one to {c.email}.
        </p>
        {sentAgain ? (
          <p className={s.lead} role="status">
            A new link is on its way to {c.email}.
          </p>
        ) : resent ? (
          <div className={s.preview}>
            <span className={s.previewTag}>Preview</span>
            <p>A new link is on its way. Emails are not sent from the preview, so here is the link the email would carry.</p>
            <a href={resent.url} className={s.secondary}>
              Open the new link
            </a>
          </div>
        ) : (
          <div className={s.doors}>
            <button
              type="button"
              className={s.primary}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                if (API_AUTH) {
                  await authApi.resend(token).catch(() => undefined);
                  setSentAgain(true);
                } else {
                  setResent(await createSetupLink(c.id));
                }
                setBusy(false);
              }}
            >
              {busy ? "Sending" : "Send a new link"}
            </button>
          </div>
        )}
      </div>
    );
  }

  const check = checkPassword(password, { email: c.email, company: c.company });
  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!check.valid || confirm !== password) return;
    setBusy(true);
    if (API_AUTH) {
      try {
        const me = await authApi.setup(token, password);
        const session = toDealerSession(me);
        if (session) {
          signIn(session);
          router.push(`${account.dashboard}?welcome=1`);
        } else {
          router.push("/admin");
        }
      } catch (error) {
        setBusy(false);
        if (error instanceof ApiRequestError && error.status === 410) setFound(await lookup(token));
        else setServerError(error instanceof ApiRequestError ? (error.fields?.password ?? error.message) : "We could not reach the server. Please try again.");
      }
      return;
    }
    const done = await completeSetup(token, password);
    if (!done) {
      setBusy(false);
      setFound(await lookup(token));
      return;
    }
    signIn({ email: done.email, store: done.company, contact: done.contact, demo: false, role: done.role, account: done.account });
    router.push(`${account.dashboard}?welcome=1`);
  };

  return (
    <form className={s.card} onSubmit={submit} noValidate>
      <p className={s.eyebrow}>Welcome to the new site</p>
      <h1 className={s.title}>
        Set your <em>password</em>
      </h1>
      <p className={s.lead}>
        Hello {c.contact.split(" ")[0]}. Choose a password for {c.company ? `the ${c.company} dealer account` : "your Surreal account"}. You will use it with your email to log in from now on.
      </p>

      <dl className={s.who}>
        <div>
          <dt>Email</dt>
          <dd>{c.email}</dd>
        </div>
        {c.company && (
          <div>
            <dt>Account</dt>
            <dd>
              {c.company}
              {c.account ? ` · ${c.account}` : ""}
            </dd>
          </div>
        )}
      </dl>

      <label className={s.field}>
        <span className={s.label}>New password</span>
        <span className={s.passWrap}>
          <input className={s.input} type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={tried && !check.valid} aria-describedby="setup-rules" />
          <button type="button" className={s.showBtn} onClick={() => setShow((v) => !v)} aria-pressed={show}>
            {show ? "Hide" : "Show"}
          </button>
        </span>
      </label>
      <div id="setup-rules">
        <PasswordRules password={password} email={c.email} company={c.company} />
      </div>
      <label className={s.field}>
        <span className={s.label}>Confirm password</span>
        <input className={s.input} type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={mismatch || (tried && confirm !== password)} aria-describedby={mismatch ? "confirm-error" : undefined} />
        {(mismatch || (tried && confirm !== password)) && (
          <span id="confirm-error" className={s.error} role="alert">
            {confirm ? "The two passwords do not match." : "Type the password again to confirm it."}
          </span>
        )}
      </label>
      {tried && !check.valid && (
        <p className={s.error} role="alert">
          The password does not meet every rule above yet.
        </p>
      )}
      {serverError && (
        <p className={s.error} role="alert">
          {serverError}
        </p>
      )}

      <div className={s.doors}>
        <button type="submit" className={s.primary} disabled={busy}>
          {busy ? "Saving" : "Save and continue"}
          <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </button>
      </div>
      <p className={s.fine}>This link works once and expires {new Date(found.expires).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.</p>
    </form>
  );
}

export default function SetupPage() {
  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <section className={s.section}>
          <div className={s.wrap}>
            <nav aria-label="Breadcrumb" className={s.crumbs}>
              <Link href="/">Home</Link>
              <span aria-hidden>/</span>
              <Link href={account.login}>Log in</Link>
              <span aria-hidden>/</span>
              <span aria-current="page">Set up your password</span>
            </nav>
            <div className={s.split}>
              <Suspense fallback={<div className={s.card} />}>
                <SetupForm />
              </Suspense>
              <aside className={s.apply} aria-labelledby="coming-title" data-palette="brand">
                <Image src="/media/photos/sb-3592-sm.webp" alt="" fill sizes="(min-width: 900px) 44vw, 100vw" className={s.applyImage} />
                <div className={s.applyBody}>
                  <p className={s.eyebrowLight}>Your account moves with you</p>
                  <h2 id="coming-title" className={s.applyTitle}>
                    Everything in <em>one place</em>
                  </h2>
                  <p className={s.applyLead}>Once your password is set, the Retailer Dashboard opens with:</p>
                  <ul className={s.applyList}>
                    {COMING.map((b) => (
                      <li key={b}>
                        <svg aria-hidden viewBox="0 0 10 10" width="9" height="9">
                          <path d="M5 0.5 9.5 5 5 9.5 0.5 5Z" fill="currentColor" />
                        </svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
