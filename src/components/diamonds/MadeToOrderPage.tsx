"use client";

/**
 * Made to Order (M2O) request (BRD R-19), entered from the diamond page with
 * the search carried in: ?shape=&size=&ratio=&from=. The fields are the live
 * M2O form's (your name, company, customer name for the booklet, phone,
 * email, exact size, shape, length to width ratio, girdle inscription,
 * notes) plus dimensions, prefilled from the search and the dealer session.
 * Labels and placeholders come from src/content/m2o.ts, which Surreal's
 * specification replaces (C-17). A size or dimensions is required, and the
 * grade promise for the size shows under it. Beside the form, the program
 * as the live site states it, and Diamond Legacy. A signed-in dealer sends the
 * request (kept in this browser for the preview, with a request number); a
 * visitor is asked to log in first. Whether M2O stays a page of its own or
 * lives inside the diamond page is Q7.
 */

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import ShapeIcon from "@/components/brand/ShapeIcon";
import { SHAPE_LABEL, stoneById, stoneTitle, type StoneShape } from "@/content/diamonds";
import { account, brand } from "@/content/site";
import { M2O_FACTS, M2O_FIELDS, M2O_SHAPES, m2oGrade, type M2OField } from "@/content/m2o";
import { useDealer } from "@/lib/dealer";
import { m2oRequests as requests, m2oSize, type M2ORequest } from "@/lib/requests";
import s from "./m2o.module.css";

type Field = M2OField;

export default function MadeToOrderPage() {
  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <Suspense fallback={<Request params={null} />}>
          <WithParams />
        </Suspense>
        <Footer />
      </main>
    </>
  );
}

function WithParams() {
  const params = useSearchParams();
  return <Request params={params} />;
}

function Request({ params }: { params: URLSearchParams | null }) {
  const dealer = useDealer();
  const from = params?.get("from") ? stoneById(params.get("from") as string) : undefined;
  const qShape = params?.get("shape") as StoneShape | null;
  const [values, setValues] = useState<Record<Field, string> | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [sent, setSent] = useState<M2ORequest | null>(null);

  const form: Record<Field, string> = values ?? {
    name: dealer?.contact ?? "",
    company: dealer?.store ?? "",
    customer: "",
    phone: "",
    email: dealer?.email ?? "",
    size: params?.get("size") ?? "",
    dimensions: "",
    shape: qShape && M2O_SHAPES.includes(qShape) ? qShape : qShape ? "other" : "",
    ratio: params?.get("ratio") ?? "",
    inscription: "",
    notes: qShape && !M2O_SHAPES.includes(qShape) ? `Shape: ${SHAPE_LABEL[qShape]}` : from ? `Like stock ${from.id}, ${stoneTitle(from)}` : "",
  };
  const set = (k: Field, v: string) => setValues({ ...form, [k]: v });
  const shapeForIcon = (M2O_SHAPES.includes(form.shape as StoneShape) ? form.shape : qShape ?? "oval") as StoneShape;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: Partial<Record<Field, string>> = {};
    if (!form.name.trim()) found.name = "Enter your name.";
    if (!form.company.trim()) found.company = "Enter the company name.";
    if (form.phone.replace(/\D/g, "").length < 10) found.phone = "Enter a ten digit phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) found.email = "Enter a valid email address.";
    if (!(Number(form.size) > 0) && !/\d/.test(form.dimensions)) found.size = "Enter the exact size in carats, or the dimensions.";
    if (!form.shape) found.shape = "Choose a shape.";
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`m-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    const request: M2ORequest = { number: `M2O-${String(Date.now()).slice(-6)}`, shape: form.shape, size: form.size, dimensions: form.dimensions.trim() || undefined, sentAt: new Date().toISOString() };
    requests.set((list) => [request, ...list]);
    setSent(request);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const input = (k: Exclude<Field, "shape" | "notes">, extraHint?: string) => {
    const opts = M2O_FIELDS[k];
    const hint = extraHint ?? opts.hint;
    return (
      <label className={`${s.field} ${opts.wide ? s.wide : ""}`}>
        <span className={s.label}>
          {opts.label}
          {opts.optional && <span className={s.optional}> (optional)</span>}
        </span>
        <input
          id={`m-${k}`}
          className={s.input}
          type={opts.type ?? "text"}
          step={opts.step}
          placeholder={opts.placeholder}
          autoComplete={opts.autoComplete}
          inputMode={opts.type === "number" ? "decimal" : undefined}
          value={form[k]}
          onChange={(e) => set(k, e.target.value)}
          aria-invalid={Boolean(errors[k])}
          aria-describedby={errors[k] ? `me-${k}` : hint ? `mh-${k}` : undefined}
        />
        {hint && !errors[k] && (
          <span id={`mh-${k}`} className={s.hint}>
            {hint}
          </span>
        )}
        {errors[k] && (
          <span id={`me-${k}`} className={s.error}>
            {errors[k]}
          </span>
        )}
      </label>
    );
  };

  return (
    <section className={s.section} aria-labelledby="m2o-title">
      <div className={s.wrap}>
        <nav aria-label="Breadcrumb" className={s.crumbs}>
          <Link href="/">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/diamonds">Lab Diamond Search</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">Made to Order</span>
        </nav>

        <div className={s.layout}>
          <div className={s.main}>
            <p className={s.eyebrow}>Made to Order (M2O)</p>
            <h1 id="m2o-title" className={s.title}>
              A diamond grown <em>for one client</em>
            </h1>
            <p className={s.lead}>Order any shape, in any carat weight or dimensions. Tell us the stone; we grow it to the exact specification.</p>

            {sent ? (
              <div className={s.sent} role="status">
                <span className={s.tick} aria-hidden>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5 10 17l9-10" />
                  </svg>
                </span>
                <p className={s.sentNumber}>{sent.number}</p>
                <p>
                  Request sent for a {m2oSize(sent)} {sent.shape === "other" ? "stone" : SHAPE_LABEL[sent.shape as StoneShape].toLowerCase()}. Surreal confirms the specification,
                  the program fee and timing with you. Questions: {brand.office.phone}.
                </p>
                <p className={s.previewNote}>Preview: the request is kept in this browser; request emails connect with the dealer platform.</p>
                <div className={s.doors}>
                  <Link href="/diamonds" className={s.primary}>
                    Back to the search
                  </Link>
                  <button
                    type="button"
                    className={s.secondary}
                    onClick={() => {
                      setSent(null);
                      setValues(null);
                    }}
                  >
                    Another request
                  </button>
                </div>
              </div>
            ) : (
              <form className={s.form} onSubmit={submit} noValidate>
                {(params?.get("shape") || params?.get("size") || from) && (
                  <p className={s.prefill}>
                    <ShapeIcon shape={shapeForIcon} className={s.prefillIcon} />
                    Filled in from your {from ? `stone, stock ${from.id}` : "diamond search"}. Change anything below.
                  </p>
                )}
                <fieldset className={s.group}>
                  <legend className={s.legend}>The stone</legend>
                  <div className={s.shapeRow} role="radiogroup" aria-label="Shape">
                    {M2O_SHAPES.map((sh) => (
                      <button key={sh} type="button" role="radio" aria-checked={form.shape === sh} className={s.shapeBtn} onClick={() => set("shape", sh)}>
                        <ShapeIcon shape={sh} className={s.shapeIcon} />
                        {sh === "emerald" ? "Emerald Cut" : sh === "pear" ? "Pear Shape" : SHAPE_LABEL[sh]}
                      </button>
                    ))}
                    <button type="button" role="radio" aria-checked={form.shape === "other"} className={s.shapeBtn} onClick={() => set("shape", "other")}>
                      <span className={s.otherIcon} aria-hidden>
                        +
                      </span>
                      Other
                    </button>
                  </div>
                  {errors.shape && <span className={s.error}>{errors.shape}</span>}
                  <div className={s.grid}>
                    {input("size", Number(form.size) > 0 ? m2oGrade(Number(form.size)) : undefined)}
                    {input("dimensions")}
                    {input("ratio")}
                    {input("inscription")}
                  </div>
                </fieldset>
                <fieldset className={s.group}>
                  <legend className={s.legend}>For the booklet and your store</legend>
                  <div className={s.grid}>
                    {input("customer")}
                    {input("name")}
                    {input("company")}
                    {input("phone")}
                    {input("email")}
                    <label className={`${s.field} ${s.wide}`}>
                      <span className={s.label}>
                        {M2O_FIELDS.notes.label}
                        <span className={s.optional}> (optional)</span>
                      </span>
                      <textarea className={s.textarea} rows={3} placeholder={M2O_FIELDS.notes.placeholder} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                    </label>
                  </div>
                </fieldset>
                <div className={s.doors}>
                  {dealer ? (
                    <button type="submit" className={s.primary}>
                      Send the M2O request
                    </button>
                  ) : (
                    <Link href={`${account.login}?next=${encodeURIComponent("/diamonds/made-to-order")}`} className={s.primary}>
                      Log in to send
                    </Link>
                  )}
                  <Link href="/diamonds" className={s.secondary}>
                    Back to the search
                  </Link>
                </div>
              </form>
            )}
          </div>

          <aside className={s.side} aria-label="How Made to Order works">
            <div className={s.visual}>
              <Image src="/media/photos/sb-3996-sm.webp" alt="Oval halo ring in hard window light" fill sizes="(min-width: 1024px) 30vw, 100vw" />
            </div>
            <div className={s.facts}>
              <p className={s.factsTitle}>How it works</p>
              <ul>
                {M2O_FACTS.map((f) => (
                  <li key={f}>
                    <svg aria-hidden viewBox="0 0 10 10" width="9" height="9">
                      <path d="M5 0.5 9.5 5 5 9.5 0.5 5Z" fill="currentColor" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/legacy" className={s.legacy}>
              <span>
                <strong>Diamond Legacy</strong>
                Every diamond in a Legacy collection is grown from the same seed line, for each milestone to come.
              </span>
              <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
