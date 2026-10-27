"use client";

/**
 * Dealer log in (the live site's login page: email, password, forgot
 * password, beside the Apply panel with the four headline dealer benefits),
 * with the move of existing customers to the new site (F-E2):
 *
 * - An active account signs in with its email and password (checked against
 *   the stored hash; five wrong tries lock it for fifteen minutes).
 * - A customer moved over from the old site has no password yet: the form
 *   offers a setup link instead, which sets the password and opens the
 *   account. Forgot password sends the same kind of link.
 * - An email with no account is told so, with the Apply door.
 *
 * In the preview the setup email is not sent, so the link shows on the page,
 * and a panel lists the dummy accounts for role testing (docs/TESTING.md):
 * Use fills in an account's email and password, ready to log in.
 * After sign in the visitor returns to ?next= (paths on this site only).
 */

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import { DEMO_DEALER, signIn, useDealer } from "@/lib/dealer";
import { verifyPassword } from "@/lib/auth";
import { INVITE_HOURS, createSetupLink, customerByEmail, ensureTestPasswords, type Customer, type SetupLink } from "@/lib/customers";
import { TEST_DEALERS, TEST_DEALER_PASSWORD } from "@/content/testAccounts";
import { account, brand } from "@/content/site";
import s from "./account.module.css";

const BENEFITS = ["Globally competitive direct-from-the-grower pricing", "Comprehensive brand strategy", "Digital marketing support positioning you as a grower", "Territory exclusivity"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function safeNext(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/jewelry";
}

type Notice = { kind: "setup"; email: string; company: string } | { kind: "sent"; email: string; link: SetupLink | null };

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const dealer = useDealer();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [errors, setErrors] = useState<{ email?: ReactNode; password?: string }>({});

  // The dummy accounts get their test password once (hashing is async).
  useEffect(() => {
    void ensureTestPasswords();
  }, []);

  const back = () => {
    setNotice(null);
    setMode("login");
    setPassword("");
  };

  const enter = (c: Customer) => {
    signIn({ email: c.email, store: c.company, contact: c.contact, demo: false, role: c.role, account: c.account });
    router.push(next);
  };

  const sendLink = async (address: string) => {
    setBusy(true);
    const c = customerByEmail(address);
    const link = c ? await createSetupLink(c.id) : null;
    setBusy(false);
    setErrors({});
    setNotice({ kind: "sent", email: address, link });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    const found: typeof errors = {};
    if (!EMAIL.test(address)) found.email = "Enter the email address on your dealer account.";
    if (mode === "login" && password.length < 1) found.password = "Enter your password.";
    setErrors(found);
    if (Object.keys(found).length) return;
    if (mode === "forgot") return sendLink(address);

    if (address.toLowerCase() === DEMO_DEALER.email) {
      signIn(DEMO_DEALER);
      router.push(next);
      return;
    }
    const c = customerByEmail(address);
    if (!c) {
      setErrors({
        email: (
          <>
            We could not find a dealer account for that email. <Link href={account.apply}>Apply to become a dealer</Link>, or call {brand.office.phone}.
          </>
        ),
      });
      return;
    }
    if (c.status !== "active") {
      setNotice({ kind: "setup", email: c.email, company: c.company });
      return;
    }
    setBusy(true);
    const result = await verifyPassword(c.email, password);
    setBusy(false);
    if (result.ok) return enter(c);
    if (result.reason === "no-password") return setNotice({ kind: "setup", email: c.email, company: c.company });
    if (result.reason === "locked") return setErrors({ password: `Too many wrong passwords. Try again in ${result.minutes} minutes, or reset your password.` });
    setErrors({ password: `That password does not match. ${result.left} ${result.left === 1 ? "try" : "tries"} left before a 15 minute lock.` });
  };

  if (dealer) {
    return (
      <div className={s.card}>
        <p className={s.eyebrow}>Signed in</p>
        <h1 className={s.title}>
          Welcome back, <em>{dealer.store}</em>
        </h1>
        <p className={s.lead}>You are signed in as {dealer.email}.</p>
        <div className={s.doors}>
          <Link href={next} className={s.primary}>
            Continue
          </Link>
          <Link href={account.dashboard} className={s.secondary}>
            Retailer Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (notice) {
    return (
      <div className={s.card}>
        {notice.kind === "setup" ? (
          <>
            <p className={s.eyebrow}>Welcome to the new site</p>
            <h1 className={s.title}>
              Set up your <em>password</em>
            </h1>
            <p className={s.lead}>
              {notice.company}&apos;s account has moved to the new Surreal site. Your orders, memo and account come with it. To sign in, set a password with a secure link sent to {notice.email}.
            </p>
            <div className={s.doors}>
              <button type="button" className={s.primary} disabled={busy} onClick={() => sendLink(notice.email)}>
                {busy ? "Sending" : "Email me a setup link"}
              </button>
              <button type="button" className={s.linkBtn} onClick={back}>
                Back to log in
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={s.eyebrow}>Check your email</p>
            <h1 className={s.title}>
              A link is <em>on its way</em>
            </h1>
            <p className={s.lead}>
              If {notice.email} has a dealer account, we have sent it a link to set a password. The link works once and expires in {INVITE_HOURS} hours.
            </p>
            {notice.link && (
              <div className={s.preview}>
                <span className={s.previewTag}>Preview</span>
                <p>Emails are not sent from the preview, so here is the link the email would carry.</p>
                <Link href={notice.link.url} className={s.secondary}>
                  Open the setup link
                </Link>
              </div>
            )}
            <button type="button" className={s.linkBtn} onClick={back}>
              Back to log in
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <form className={s.card} onSubmit={submit} noValidate>
      <p className={s.eyebrow}>{mode === "login" ? "Dealer log in" : "Forgot password"}</p>
      <h1 className={s.title}>{mode === "login" ? <>Welcome <em>back</em></> : <>Reset your <em>password</em></>}</h1>
      <p className={s.lead}>
        {mode === "login"
          ? "Log in for dealer pricing, your invoices, memo and the Retailer Dashboard. Moving from the old site? Log in with your email and we will help you set a password."
          : "Enter your account email and we will send a link to set a new password."}
      </p>

      <label className={s.field}>
        <span className={s.label}>Email address</span>
        <input id="login-email" className={s.input} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />
        {errors.email && (
          <span id="email-error" className={s.error}>
            {errors.email}
          </span>
        )}
      </label>
      {mode === "login" && (
        <label className={s.field}>
          <span className={s.labelRow}>
            <span className={s.label}>Password</span>
            <button
              type="button"
              className={s.linkBtn}
              onClick={() => {
                setMode("forgot");
                setErrors({});
              }}
            >
              Forgot password?
            </button>
          </span>
          <span className={s.passWrap}>
            <input id="login-password" className={s.input} type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined} />
            <button type="button" className={s.showBtn} onClick={() => setShow((v) => !v)} aria-pressed={show}>
              {show ? "Hide" : "Show"}
            </button>
          </span>
          {errors.password && (
            <span id="password-error" className={s.error} role="alert">
              {errors.password}
            </span>
          )}
        </label>
      )}

      <div className={s.doors}>
        <button id="login-submit" type="submit" className={s.primary} disabled={busy}>
          {mode === "login" ? (busy ? "Checking" : "Log in") : busy ? "Sending" : "Send the link"}
          <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </button>
        {mode === "forgot" && (
          <button type="button" className={s.linkBtn} onClick={() => setMode("login")}>
            Back to log in
          </button>
        )}
      </div>

      <div className={s.preview}>
        <span className={s.previewTag}>Preview</span>
        <p>Test accounts for trying each role before live customers move over. Use fills in the email and password; then log in.</p>
        <ul className={s.testList}>
          {TEST_DEALERS.map((t) => (
            <li key={t.email}>
              <span>
                <strong>{t.contact}</strong>, {t.company}
                <span className={s.testMeta}>{t.purpose}</span>
              </span>
              <button
                type="button"
                className={s.linkBtn}
                aria-pressed={email === t.email}
                onClick={() => {
                  setMode("login");
                  setEmail(t.email);
                  setPassword(TEST_DEALER_PASSWORD);
                  setShow(true);
                  setErrors({});
                  window.requestAnimationFrame(() => {
                    const submit = document.getElementById("login-submit");
                    submit?.scrollIntoView({ block: "center", behavior: "smooth" });
                    submit?.focus({ preventScroll: true });
                  });
                }}
              >
                {email === t.email ? "Filled in" : "Use"}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={s.secondary}
          onClick={() => {
            signIn(DEMO_DEALER);
            router.push(next);
          }}
        >
          Explore as the demo dealer
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
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
              <span aria-current="page">Log in</span>
            </nav>
            <div className={s.split}>
              <Suspense fallback={<div className={s.card} />}>
                <LoginForm />
              </Suspense>
              <aside className={s.apply} aria-labelledby="apply-title" data-palette="brand">
                <Image src="/media/photos/sb-3592-sm.webp" alt="" fill sizes="(min-width: 900px) 44vw, 100vw" className={s.applyImage} />
                <div className={s.applyBody}>
                  <p className={s.eyebrowLight}>Apply</p>
                  <h2 id="apply-title" className={s.applyTitle}>
                    Become a <em>Surreal dealer</em>
                  </h2>
                  <p className={s.applyLead}>Apply here if you are interested in being a Surreal Diamond dealer in your market, with these brand benefits:</p>
                  <ul className={s.applyList}>
                    {BENEFITS.map((b) => (
                      <li key={b}>
                        <svg aria-hidden viewBox="0 0 10 10" width="9" height="9">
                          <path d="M5 0.5 9.5 5 5 9.5 0.5 5Z" fill="currentColor" />
                        </svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link href={account.apply} className={s.applyBtn}>
                    Register
                  </Link>
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
