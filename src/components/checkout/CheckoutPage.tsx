"use client";

/**
 * Dealer checkout: the live site's steps (Store details, Review,
 * Confirmation) with Payment added, since dealers will pay on this site.
 *
 * 1. Store details: the store, contact, phone and shipping address (the
 *    fields of the live dealer application), a PO number, an in-store
 *    delivery deadline and order notes, prefilled from the session.
 * 2. Payment: credit or debit card, ACH or wire, through Surreal's existing
 *    card processor (BRD B-05). The card is entered in the processor's
 *    secure form once it is connected, so this page never touches card
 *    numbers; ACH and wire details are on the dashboard's Payment Methods
 *    page. Check and Zelle stay offline, on that same page.
 * 3. Review: every line, the details and the method, and agreement to the
 *    Terms and Conditions (made to specification pieces cannot be
 *    cancelled).
 * 4. Confirmation: the order number and what happens next.
 *
 * The right column keeps the compact order summary in view. Signed out, the
 * cart's dealer holding page is shown; an empty cart sends the dealer back
 * to the cart.
 */

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import GatePage from "@/components/pages/GatePage";
import { gates } from "@/content/gates";
import { account } from "@/content/site";
import { beforeCutoff, pieceCount, placeOrder, useCart, type PaymentMethod, type PlacedOrder, type StoreDetails } from "@/lib/cart";
import { useDealer } from "@/lib/dealer";
import { LineItem, Steps, Summary } from "./parts";
import s from "./checkout.module.css";

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const METHODS: { id: PaymentMethod; title: string; line: string; detail: ReactNode }[] = [
  {
    id: "card",
    title: "Credit or debit card",
    line: "Visa, Mastercard, American Express. Convenience fees apply to credit cards.",
    detail: (
      <div className={s.cardFrame}>
        <span className={s.cardLock} aria-hidden>
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2.5" y="6" width="9" height="6.5" rx="1" />
            <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
          </svg>
        </span>
        <span>
          <strong>Secure card entry</strong>
          Card details are entered in the secure form of Surreal&apos;s card processor, which connects at launch. Surreal never stores card numbers. Cards are subject to authorization by
          the issuer.
        </span>
        <span className={s.cardBrands} aria-label="Visa, Mastercard, American Express">
          <span>VISA</span>
          <span>MC</span>
          <span>AMEX</span>
        </span>
      </div>
    ),
  },
  { id: "ach", title: "ACH bank transfer", line: "To the Surreal Diamond LLC account.", detail: <p className={s.methodNote}>The bank details for Surreal Diamond LLC are on the Payment Methods page of your Retailer Dashboard.</p> },
  { id: "wire", title: "Wire transfer", line: "To the Surreal Diamond LLC account.", detail: <p className={s.methodNote}>The wire details for Surreal Diamond LLC are on the Payment Methods page of your Retailer Dashboard.</p> },
];

const REQUIRED: (keyof StoreDetails)[] = ["store", "contact", "email", "phone", "address", "city", "state", "zip"];
const LABELS: Record<keyof StoreDetails, string> = {
  store: "Store name",
  contact: "Your name",
  email: "Email",
  phone: "Store phone",
  address: "Address",
  city: "City",
  state: "State",
  zip: "ZIP code",
  po: "PO number",
  deadline: "In-store delivery deadline",
  notes: "Order notes",
};

function validate(d: StoreDetails) {
  const errors: Partial<Record<keyof StoreDetails, string>> = {};
  REQUIRED.forEach((k) => {
    if (!d[k].trim()) errors[k] = k === "contact" ? "Enter your name." : `Enter the ${LABELS[k].toLowerCase()}.`;
  });
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errors.email = "Enter a valid email address.";
  if (d.zip && !/^\d{5}(-\d{4})?$/.test(d.zip.trim())) errors.zip = "Enter a five digit ZIP code.";
  if (d.phone && d.phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a ten digit phone number.";
  return errors;
}

export default function CheckoutPage() {
  const dealer = useDealer();
  const lines = useCart();
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<StoreDetails | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof StoreDetails, string>>>({});
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [agree, setAgree] = useState(false);
  const [agreeError, setAgreeError] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  if (!dealer) return <GatePage {...gates.cart} />;

  const form: StoreDetails = details ?? { store: dealer.store, contact: dealer.contact, email: dealer.email, phone: "", address: "", city: "", state: "NY", zip: "", po: "", deadline: "", notes: "" };
  const update = (k: keyof StoreDetails, v: string) => setDetails({ ...form, [k]: v });
  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitDetails = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      setDetails(form);
      go(2);
    } else {
      document.getElementById(`f-${Object.keys(found)[0]}`)?.focus();
    }
  };

  const place = () => {
    if (!agree) {
      setAgreeError(true);
      return;
    }
    const order = placeOrder({ lines, details: form, payment: method, beforeCutoff: beforeCutoff() });
    setPlaced(order);
    go(4);
  };

  const field = (k: keyof StoreDetails, opts: { type?: string; auto?: string; wide?: boolean; optional?: boolean } = {}) => (
    <label className={`${s.field} ${opts.wide ? s.fieldWide : ""}`}>
      <span className={s.label}>
        {LABELS[k]}
        {opts.optional && <span className={s.optional}> (optional)</span>}
      </span>
      <input
        id={`f-${k}`}
        className={s.input}
        type={opts.type ?? "text"}
        autoComplete={opts.auto}
        value={form[k]}
        onChange={(e) => update(k, e.target.value)}
        aria-invalid={Boolean(errors[k])}
        aria-describedby={errors[k] ? `e-${k}` : undefined}
      />
      {errors[k] && (
        <span id={`e-${k}`} className={s.error}>
          {errors[k]}
        </span>
      )}
    </label>
  );

  const chosen = METHODS.find((m) => m.id === method);

  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <section className={s.section} aria-labelledby="checkout-title">
          <div className={s.wrap}>
            <nav aria-label="Breadcrumb" className={s.crumbs}>
              <Link href="/">Home</Link>
              <span aria-hidden>/</span>
              <Link href={account.cart}>Cart</Link>
              <span aria-hidden>/</span>
              <span aria-current="page">Checkout</span>
            </nav>
            <div className={s.head}>
              <h1 id="checkout-title" className={s.title}>
                {step === 4 ? (
                  <>
                    Thank you, <em>{placed?.details.contact.split(" ")[0] || dealer.store}</em>
                  </>
                ) : (
                  "Checkout"
                )}
              </h1>
              <Steps at={step} />
            </div>

            {step === 4 && placed ? (
              <div className={s.confirm}>
                <div className={s.confirmCard}>
                  <span className={s.confirmTick} aria-hidden>
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5 10 17l9-10" />
                    </svg>
                  </span>
                  <p className={s.confirmEyebrow}>Order placed</p>
                  <p className={s.confirmNumber}>{placed.number}</p>
                  <p className={s.confirmLine}>
                    {pieceCount(placed.lines)} {pieceCount(placed.lines) === 1 ? "piece" : "pieces"} for {placed.details.store}, shipping to {placed.details.city}, {placed.details.state}.
                  </p>
                  <ol className={s.next}>
                    <li>
                      <strong>Surreal reviews and accepts your order</strong>, confirming pricing from your price list.
                    </li>
                    <li>
                      <strong>Payment by {METHODS.find((m) => m.id === placed.payment)?.title.toLowerCase()}</strong>
                      {placed.payment === "card" ? ", authorized by your card issuer." : ", with the details on your Payment Methods page."}
                    </li>
                    <li>
                      <strong>{placed.beforeCutoff ? "Next day delivery" : "Delivery"}</strong>
                      {placed.beforeCutoff ? ": your order was placed before the 4:00pm EST cutoff." : ": placed after the 4:00pm EST cutoff, so it is not in today's next day delivery."}
                    </li>
                  </ol>
                  <div className={s.confirmDoors}>
                    <Link href="/jewelry" className={s.primary}>
                      Continue shopping
                    </Link>
                    <Link href={account.dashboard} className={s.secondary}>
                      Retailer Dashboard
                    </Link>
                  </div>
                  <p className={s.previewNote}>Preview: this order is kept in this browser only. Order emails connect with the dealer platform.</p>
                </div>
                <div className={s.confirmLines}>
                  {placed.lines.map((l) => (
                    <LineItem key={l.key} line={l} editable={false} />
                  ))}
                </div>
              </div>
            ) : lines.length === 0 ? (
              <div className={s.empty}>
                <p className={s.emptyTitle}>Your cart is empty</p>
                <div className={s.emptyDoors}>
                  <Link href="/jewelry" className={s.primary}>
                    Continue shopping
                  </Link>
                </div>
              </div>
            ) : (
              <div className={s.layout}>
                <div className={s.main}>
                  {step === 1 && (
                    <form className={s.panel} onSubmit={submitDetails} noValidate>
                      <p className={s.panelTitle}>Store details</p>
                      <p className={s.panelLead}>Where the order ships and who we confirm it with.</p>
                      <div className={s.formGrid}>
                        {field("store", { auto: "organization" })}
                        {field("contact", { auto: "name" })}
                        {field("email", { type: "email", auto: "email" })}
                        {field("phone", { type: "tel", auto: "tel" })}
                        {field("address", { auto: "street-address", wide: true })}
                        {field("city", { auto: "address-level2" })}
                        <label className={s.field}>
                          <span className={s.label}>State</span>
                          <select id="f-state" className={s.input} value={form.state} onChange={(e) => update("state", e.target.value)}>
                            {STATES.map((x) => (
                              <option key={x} value={x}>
                                {x}
                              </option>
                            ))}
                          </select>
                        </label>
                        {field("zip", { auto: "postal-code" })}
                        {field("po", { optional: true })}
                        {field("deadline", { type: "date", optional: true })}
                        <label className={`${s.field} ${s.fieldWide}`}>
                          <span className={s.label}>
                            Order notes<span className={s.optional}> (optional)</span>
                          </span>
                          <textarea className={s.textarea} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
                        </label>
                      </div>
                      <div className={s.panelDoors}>
                        <Link href={account.cart} className={s.secondary}>
                          Back to cart
                        </Link>
                        <button type="submit" className={s.primary}>
                          Continue to payment
                        </button>
                      </div>
                    </form>
                  )}

                  {step === 2 && (
                    <div className={s.panel}>
                      <p className={s.panelTitle}>Payment</p>
                      <p className={s.panelLead}>Choose how {form.store} will pay for this order.</p>
                      <div className={s.methods} role="radiogroup" aria-label="Payment method">
                        {METHODS.map((m) => (
                          <div key={m.id} className={s.method} data-on={method === m.id ? "true" : undefined}>
                            <button type="button" role="radio" aria-checked={method === m.id} className={s.methodHead} onClick={() => setMethod(m.id)}>
                              <span className={s.radio} aria-hidden />
                              <span className={s.methodText}>
                                <strong>{m.title}</strong>
                                <span>{m.line}</span>
                              </span>
                            </button>
                            {method === m.id && <div className={s.methodBody}>{m.detail}</div>}
                          </div>
                        ))}
                      </div>
                      <div className={s.panelDoors}>
                        <button type="button" className={s.secondary} onClick={() => go(1)}>
                          Back
                        </button>
                        <button type="button" className={s.primary} onClick={() => go(3)}>
                          Review order
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className={s.panel}>
                      <p className={s.panelTitle}>Review</p>
                      <div className={s.reviewGrid}>
                        <div className={s.reviewCard}>
                          <div className={s.reviewHead}>
                            <span>Ship to</span>
                            <button type="button" className={s.textBtn} onClick={() => go(1)}>
                              Edit
                            </button>
                          </div>
                          <p>
                            <strong>{form.store}</strong>
                            <br />
                            {form.contact}
                            <br />
                            {form.address}
                            <br />
                            {form.city}, {form.state} {form.zip}
                            <br />
                            {form.phone} · {form.email}
                          </p>
                          {(form.po || form.deadline) && (
                            <p className={s.reviewMeta}>
                              {form.po && <>PO {form.po}</>}
                              {form.po && form.deadline && " · "}
                              {form.deadline && <>In store by {form.deadline}</>}
                            </p>
                          )}
                        </div>
                        <div className={s.reviewCard}>
                          <div className={s.reviewHead}>
                            <span>Payment</span>
                            <button type="button" className={s.textBtn} onClick={() => go(2)}>
                              Edit
                            </button>
                          </div>
                          <p>
                            <strong>{chosen?.title}</strong>
                            <br />
                            {chosen?.line}
                          </p>
                        </div>
                      </div>
                      <ul className={s.lines}>
                        {lines.map((l) => (
                          <li key={l.key}>
                            <LineItem line={l} editable={false} />
                          </li>
                        ))}
                      </ul>
                      {form.notes && <p className={s.reviewNotes}>Order notes: {form.notes}</p>}
                      <label className={s.agree} data-error={agreeError ? "true" : undefined}>
                        <input
                          type="checkbox"
                          checked={agree}
                          onChange={(e) => {
                            setAgree(e.target.checked);
                            setAgreeError(false);
                          }}
                        />
                        <span>
                          I agree to the{" "}
                          <Link href="/terms" target="_blank">
                            Terms and Conditions
                          </Link>
                          . Pieces made to my specifications cannot be cancelled, and prices are confirmed when Surreal accepts the order.
                        </span>
                      </label>
                      {agreeError && (
                        <p className={s.error} role="alert">
                          Please agree to the Terms and Conditions to place the order.
                        </p>
                      )}
                      <div className={s.panelDoors}>
                        <button type="button" className={s.secondary} onClick={() => go(2)}>
                          Back
                        </button>
                        <button type="button" className={s.primary} onClick={place}>
                          Place order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className={s.side}>
                  <Summary lines={lines} compact>
                    <Link href={account.cart} className={s.secondaryWide}>
                      Edit cart
                    </Link>
                  </Summary>
                </div>
              </div>
            )}
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
