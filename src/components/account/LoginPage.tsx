"use client";

/**
 * Dealer log in (the live site's login page: email, password, forgot
 * password, beside the Apply panel with the four headline dealer benefits).
 * Real dealer accounts arrive with the dealer platform; in this preview any
 * email signs in and the store name is taken from its domain, or the visitor
 * can explore as the demo dealer. The password is never stored. After sign
 * in the visitor returns to ?next= (only paths on this site), else the store.
 */

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer, { openContactDrawer } from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import { DEMO_DEALER, signIn, storeFromEmail, useDealer } from "@/lib/dealer";
import { account } from "@/content/site";
import s from "./account.module.css";

const BENEFITS = ["Globally competitive direct-from-the-grower pricing", "Comprehensive brand strategy", "Digital marketing support positioning you as a grower", "Territory exclusivity"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function safeNext(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/jewelry";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const dealer = useDealer();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (!EMAIL.test(email.trim())) found.email = "Enter the email address on your dealer account.";
    if (password.length < 1) found.password = "Enter your password.";
    setErrors(found);
    if (Object.keys(found).length) return;
    signIn({ email: email.trim(), store: storeFromEmail(email.trim()), contact: "", demo: true });
    router.push(next);
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
          <Link href={account.cart} className={s.secondary}>
            View cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className={s.card} onSubmit={submit} noValidate>
      <p className={s.eyebrow}>Dealer log in</p>
      <h1 className={s.title}>
        Welcome <em>back</em>
      </h1>
      <p className={s.lead}>Log in for dealer pricing, your cart, memo and the Retailer Dashboard.</p>

      <label className={s.field}>
        <span className={s.label}>Email address</span>
        <input id="login-email" className={s.input} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />
        {errors.email && (
          <span id="email-error" className={s.error}>
            {errors.email}
          </span>
        )}
      </label>
      <label className={s.field}>
        <span className={s.labelRow}>
          <span className={s.label}>Password</span>
          <button type="button" className={s.linkBtn} onClick={() => openContactDrawer("other", "contact")}>
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
          <span id="password-error" className={s.error}>
            {errors.password}
          </span>
        )}
      </label>

      <button type="submit" className={s.primary}>
        Log in
        <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </button>

      <div className={s.preview}>
        <span className={s.previewTag}>Preview</span>
        <p>Dealer accounts connect with the dealer platform. In this preview, any email signs you in, and nothing you type is sent anywhere.</p>
        <button
          type="button"
          className={s.secondary}
          onClick={() => {
            signIn(DEMO_DEALER);
            router.push(next);
          }}
        >
          Explore as a demo dealer
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
              <aside className={s.apply} aria-labelledby="apply-title">
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
