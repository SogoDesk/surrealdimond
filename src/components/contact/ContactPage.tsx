"use client";

/**
 * Inquiries and Contact (BRD R-24). The live site's three forms (Contact Us,
 * Schedule an Appointment, We Want to Hear From You) become one form with an
 * inquiry type selector; each type routes to one team (src/content/
 * inquiries.ts) through the submitInquiry server action, which the contact
 * drawer shares. The fields follow the live forms (first and last name,
 * phone, email, message; for appointments the preferred method of contact
 * and how you heard about us) plus what each type needs: store and location
 * for a new dealer, a preferred date for a visit, the order or memo number
 * (picked from a signed-in dealer's own), the program in question.
 *
 * On sending, the sender gets a reference number and sees the automatic
 * acknowledgement email that goes to their inbox. Beside the form: the North
 * American Office with today's hours in New York time and whether it is open,
 * and the dealer benefits from the live appointment page (or, signed in, the
 * dashboard). Quick answers follow, all from the live site. ?type= presets
 * the inquiry type.
 */

import Link from "next/link";
import { Suspense, startTransition, useActionState, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import { submitInquiry, type InquiryField, type InquiryState } from "@/app/actions/inquiry";
import { ACK_LINE, CONTACT_METHODS, PROGRAMS, inquiryType, inquiryTypes, type InquiryType } from "@/content/inquiries";
import { account, brand } from "@/content/site";
import { useOrders } from "@/lib/cart";
import { useDealer } from "@/lib/dealer";
import { useMemos } from "@/lib/memo";
import { scrollToTarget } from "@/lib/scroll";
import s from "./contact.module.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_NAME: Record<(typeof DAYS)[number], string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const OPEN_MIN = 9 * 60 + 30;
const CLOSE_MIN = 18 * 60;

/** New York weekday and minute of the day, as "Mon|570"; re-read every minute. */
function nyNow() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("weekday")}|${Number(get("hour")) * 60 + Number(get("minute"))}`;
}
const subscribeMinute = (cb: () => void) => {
  const id = window.setInterval(cb, 30_000);
  return () => window.clearInterval(id);
};

function OfficeStatus() {
  const now = useSyncExternalStore(subscribeMinute, nyNow, () => null);
  const [day, minute] = now ? [now.split("|")[0] as (typeof DAYS)[number], Number(now.split("|")[1])] : [null, 0];
  const weekday = day !== null && day !== "Sat" && day !== "Sun";
  const open = weekday && minute >= OPEN_MIN && minute < CLOSE_MIN;
  const next = (() => {
    if (!day) return "";
    if (weekday && minute < OPEN_MIN) return "Opens today at 9:30am EST";
    const i = DAYS.indexOf(day);
    const nextDay = i >= 4 ? "Monday" : DAY_NAME[DAYS[i + 1]];
    return `Opens ${nextDay} at 9:30am EST`;
  })();

  return (
    <>
      <p className={s.status} data-open={open ? "" : undefined} aria-live="polite">
        <span className={s.statusDot} aria-hidden />
        {now === null ? "Monday to Friday, 9:30am to 6pm EST" : open ? "Open now, until 6pm EST" : `Closed now. ${next}`}
      </p>
      <table className={s.hours}>
        <caption className={s.srOnly}>Customer support hours, Eastern time</caption>
        <tbody>
          {DAYS.map((d) => (
            <tr key={d} data-today={d === day ? "" : undefined}>
              <th scope="row">
                {DAY_NAME[d]}
                {d === day && <span className={s.today}>Today</span>}
              </th>
              <td>{d === "Sat" || d === "Sun" ? "Closed" : "9:30am to 6pm"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function TypeIcon({ id }: { id: InquiryType }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 28 28" className={s.typeIcon} aria-hidden>
      {id === "dealer" && <path d="M4 12h20M5 12l2-6h14l2 6M6 12v11h16V12M11 23v-6h6v6" {...p} />}
      {id === "appointment" && (
        <>
          <rect x="4" y="6" width="20" height="18" rx="2" {...p} />
          <path d="M4 11h20M9 3v5M19 3v5M9 16h3M16 16h3M9 20h3" {...p} />
        </>
      )}
      {id === "order" && <path d="M5 8l9-4 9 4v12l-9 4-9-4ZM5 8l9 4 9-4M14 12v12" {...p} />}
      {id === "programs" && <path d="M9 6h10l5 6-10 12L4 12ZM4 12h20M9 6l-1.5 6L14 24l6.5-12L19 6" {...p} />}
      {id === "account" && (
        <>
          <rect x="3" y="7" width="22" height="15" rx="2" {...p} />
          <path d="M3 12h22M7 17h5" {...p} />
        </>
      )}
      {id === "feedback" && <path d="M4 6h20v13H12l-5 4v-4H4ZM9 11h10M9 15h6" {...p} />}
      {id === "other" && (
        <>
          <circle cx="14" cy="14" r="10" {...p} />
          <path d="M11 11a3 3 0 1 1 4 2.8c-.7.3-1 .8-1 1.5V16M14 19.5v.1" {...p} />
        </>
      )}
    </svg>
  );
}

const QUICK: { q: string; a: ReactNode }[] = [
  { q: "When is the office open?", a: <>Monday to Friday, 9:30am to 6pm EST. We are closed on Saturday and Sunday.</> },
  { q: "When do orders ship?", a: <>Order before 4:00pm EST to receive next day delivery.</> },
  { q: "Do you sell to consumers?", a: <>No. We will never sell directly to consumers; Surreal works with jewelry retailers.</> },
  { q: "How can dealers pay?", a: <>By credit or debit card, ACH or wire transfer at checkout. Check and Zelle are arranged with the office.</> },
  { q: "Where can I see stones in person?", a: <>Book an appointment at our North American Office, {brand.office.address1}, {brand.office.address2}.</> },
];

const DEALER_POINTS = ["Globally competitive direct-from-the-grower pricing", "Comprehensive brand strategy", "Digital marketing support positioning you as a grower", "Territory exclusivity"];

export default function ContactPage() {
  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <Suspense fallback={<Inquiries preset={null} />}>
          <WithParams />
        </Suspense>
        <Footer />
      </main>
    </>
  );
}

function WithParams() {
  const params = useSearchParams();
  return <Inquiries preset={inquiryType(params.get("type"))?.id ?? null} />;
}

const INITIAL: InquiryState = { ok: false };

function Inquiries({ preset }: { preset: InquiryType | null }) {
  const dealer = useDealer();
  const orders = useOrders();
  const memos = useMemos();
  const [state, formAction, pending] = useActionState(submitInquiry, INITIAL);
  const [type, setType] = useState<InquiryType | null>(preset);
  const [seenPreset, setSeenPreset] = useState(preset);
  const [method, setMethod] = useState<string>("");
  const [program, setProgram] = useState<string>("");
  const [sentTo, setSentTo] = useState({ first: "", email: "" });
  const [formKey, setFormKey] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);

  // A new ?type= (from a link on this page, or the footer) presets the selector; adjusted during render.
  if (preset !== seenPreset) {
    setSeenPreset(preset);
    if (preset) setType(preset);
  }

  const info = type ? inquiryType(type) : undefined;
  const errors: Partial<Record<InquiryField, string>> = state.submitted && !state.ok ? state.errors ?? {} : {};
  const [first, ...rest] = (dealer?.contact ?? "").split(/\s+/);
  const refs = [...orders.map((o) => o.number), ...memos.map((m) => m.number)];

  const choose = (t: InquiryType) => {
    setType(t);
    window.requestAnimationFrame(() => document.getElementById("inquiry-fields")?.querySelector<HTMLElement>("input:not([type=hidden]), textarea")?.focus({ preventScroll: true }));
  };
  const jumpTo = (t: InquiryType) => {
    setType(t);
    scrollToTarget("#inquiry-form", -110);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSentTo({ first: String(data.get("firstName") ?? ""), email: String(data.get("email") ?? "") });
    startTransition(() => formAction(data));
  };

  const field = (name: InquiryField | "location" | "heard" | "date" | "orderRef", label: string, opts: { type?: string; optional?: boolean; wide?: boolean; defaultValue?: string; min?: string; autoComplete?: string; placeholder?: string } = {}) => {
    const err = errors[name as InquiryField];
    return (
      <label className={`${s.field} ${opts.wide ? s.wide : ""}`}>
        <span className={s.label}>
          {label}
          {opts.optional && <span className={s.optional}> (optional)</span>}
        </span>
        <input
          id={`in-${name}`}
          name={name}
          className={s.input}
          type={opts.type ?? "text"}
          min={opts.min}
          defaultValue={opts.defaultValue}
          autoComplete={opts.autoComplete}
          placeholder={opts.placeholder}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `ie-${name}` : undefined}
        />
        {err && (
          <span id={`ie-${name}`} className={s.error}>
            {err}
          </span>
        )}
      </label>
    );
  };

  return (
    <>
      <section className={s.section} aria-labelledby="contact-title">
        <div className={s.wrap}>
          <nav aria-label="Breadcrumb" className={s.crumbs}>
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span aria-current="page">Inquiries and Contact</span>
          </nav>
          <header className={s.head}>
            <p className={s.eyebrow}>Inquiries and contact</p>
            <h1 id="contact-title" className={s.title}>
              We want to <em>hear from you</em>
            </h1>
            <p className={s.lead}>Tell us what it is about and your message goes straight to the team that handles it. You get a reference number and a copy by email.</p>
          </header>

          <div className={s.layout}>
            <div className={s.main} id="inquiry-form">
              {state.ok && state.reference && state.reference !== dismissed ? (
                <div className={s.sent} role="status">
                  <span className={s.tick} aria-hidden>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5 10 17l9-10" />
                    </svg>
                  </span>
                  <p className={s.sentNumber}>{state.reference}</p>
                  <p>
                    {ACK_LINE} Your message went to our {state.team?.toLowerCase()} team.
                  </p>

                  <figure className={s.mail}>
                    <figcaption className={s.mailCaption}>The acknowledgement in your inbox</figcaption>
                    <div className={s.mailHead}>
                      <span>
                        <em>From</em> {brand.name}
                      </span>
                      <span>
                        <em>To</em> {sentTo.email}
                      </span>
                      <span>
                        <em>Subject</em> We received your message ({state.reference})
                      </span>
                    </div>
                    <div className={s.mailBody}>
                      <p>Hello {sentTo.first || "there"},</p>
                      <p>{ACK_LINE}</p>
                      <p>
                        Your reference is <strong>{state.reference}</strong>. If you need us sooner, call {brand.office.phone}, {brand.office.hours}.
                      </p>
                      <p className={s.mailSign}>
                        {brand.name}
                        <br />
                        {brand.office.label}, {brand.office.address1}, {brand.office.address2}
                      </p>
                    </div>
                  </figure>
                  <p className={s.previewNote}>Preview: the acknowledgement email sends once the email service is connected.</p>

                  <div className={s.doors}>
                    <button
                      type="button"
                      className={s.primary}
                      onClick={() => {
                        setFormKey((k) => k + 1);
                        setType(null);
                        setMethod("");
                        setProgram("");
                        setDismissed(state.reference ?? null);
                      }}
                    >
                      Send another message
                    </button>
                    <Link href="/" className={s.secondary}>
                      Back to the homepage
                    </Link>
                  </div>
                </div>
              ) : (
                <form key={`${formKey}-${dealer?.email ?? "visitor"}`} className={s.form} onSubmit={onSubmit} noValidate>
                  <div className={s.trap} aria-hidden>
                    <label htmlFor="in-website">Website</label>
                    <input id="in-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                  </div>
                  <input type="hidden" name="type" value={type ?? ""} />

                  <fieldset className={s.group}>
                    <legend className={s.legend}>
                      <span className={s.step}>1</span>What is it about?
                    </legend>
                    <div className={s.types} role="radiogroup" aria-label="Inquiry type" aria-invalid={errors.type ? true : undefined}>
                      {inquiryTypes.map((t) => (
                        <button key={t.id} type="button" role="radio" aria-checked={type === t.id} className={s.typeBtn} onClick={() => choose(t.id)}>
                          <TypeIcon id={t.id} />
                          <span>
                            <strong>{t.label}</strong>
                            {t.line}
                          </span>
                        </button>
                      ))}
                    </div>
                    {errors.type && <span className={s.error}>{errors.type}</span>}
                  </fieldset>

                  <fieldset className={s.group} id="inquiry-fields" disabled={!type} aria-describedby={!type ? "inquiry-wait" : undefined}>
                    <legend className={s.legend}>
                      <span className={s.step}>2</span>
                      {info ? info.label : "Your message"}
                    </legend>
                    {!type && (
                      <p id="inquiry-wait" className={s.wait}>
                        Choose a type above and the form fills in the rest.
                      </p>
                    )}
                    <div className={s.grid}>
                      {field("firstName", "First name", { defaultValue: first || undefined, autoComplete: "given-name" })}
                      {field("lastName", "Last name", { defaultValue: rest.join(" ") || undefined, autoComplete: "family-name" })}
                      {field("email", "Email address", { type: "email", defaultValue: dealer?.email, autoComplete: "email" })}
                      {field("phone", "Phone", { type: "tel", optional: !(type === "appointment" && method && method !== "Email"), autoComplete: "tel" })}

                      {(type === "dealer" || type === "order" || type === "account" || type === "appointment") &&
                        field("company", "Store or company name", { optional: type !== "dealer", defaultValue: dealer?.store, autoComplete: "organization" })}
                      {type === "dealer" && field("location", "City and state", { optional: true, placeholder: "For example, Austin, TX" })}
                      {type === "appointment" && field("date", "Preferred date", { type: "date", optional: true, min: new Date().toISOString().slice(0, 10) })}

                      {type === "appointment" && (
                        <div className={`${s.field} ${s.wide}`}>
                          <span className={s.label} id="in-method-label">
                            Preferred method of contact
                          </span>
                          <input type="hidden" name="method" value={method} />
                          <div className={s.pills} role="radiogroup" aria-labelledby="in-method-label" aria-invalid={errors.method ? true : undefined}>
                            {CONTACT_METHODS.map((m) => (
                              <button key={m} type="button" role="radio" aria-checked={method === m} className={s.pill} onClick={() => setMethod(m)}>
                                {m}
                              </button>
                            ))}
                          </div>
                          {errors.method && <span className={s.error}>{errors.method}</span>}
                        </div>
                      )}

                      {type === "order" &&
                        (dealer && refs.length > 0 ? (
                          <label className={s.field}>
                            <span className={s.label}>
                              Order or memo<span className={s.optional}> (optional)</span>
                            </span>
                            <select name="orderRef" className={s.input} defaultValue="">
                              <option value="">Not about a specific one</option>
                              {refs.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          field("orderRef", "Order or memo number", { optional: true, placeholder: "For example, SD-260930-0001" })
                        ))}

                      {type === "programs" && (
                        <div className={`${s.field} ${s.wide}`}>
                          <span className={s.label} id="in-program-label">
                            Which program
                          </span>
                          <input type="hidden" name="program" value={program} />
                          <div className={s.pills} role="radiogroup" aria-labelledby="in-program-label">
                            {PROGRAMS.map((p) => (
                              <button key={p} type="button" role="radio" aria-checked={program === p} className={s.pill} onClick={() => setProgram(p)}>
                                {p}
                              </button>
                            ))}
                          </div>
                          <span className={s.hint}>
                            Ready to order? Use the{" "}
                            <Link href="/diamonds/made-to-order" className={s.inline}>
                              M2O request
                            </Link>{" "}
                            or the{" "}
                            <Link href="/custom" className={s.inline}>
                              Custom Portal
                            </Link>{" "}
                            instead.
                          </span>
                        </div>
                      )}

                      {(type === "dealer" || type === "appointment") && field("heard", "How did you hear about us?", { optional: true, wide: true })}

                      <label className={`${s.field} ${s.wide}`}>
                        <span className={s.label}>{info?.prompt ?? "Message"}</span>
                        <textarea
                          id="in-message"
                          name="message"
                          className={s.textarea}
                          rows={5}
                          maxLength={4000}
                          aria-invalid={errors.message ? true : undefined}
                          aria-describedby={errors.message ? "ie-message" : undefined}
                        />
                        {errors.message && (
                          <span id="ie-message" className={s.error}>
                            {errors.message}
                          </span>
                        )}
                      </label>
                    </div>
                    <div className={s.submitRow}>
                      <button type="submit" className={s.primary} disabled={!type || pending}>
                        {pending ? "Sending" : "Send message"}
                      </button>
                      <span className={s.hint}>We reply by email, or by phone or text when you ask.</span>
                    </div>
                  </fieldset>
                </form>
              )}
            </div>

            <aside className={s.side} aria-label="Visit and call">
              <div className={s.card}>
                <p className={s.cardKicker}>{brand.office.label}</p>
                <address className={s.address}>
                  {brand.office.address1}
                  <br />
                  {brand.office.address2}
                </address>
                <div className={s.cardLinks}>
                  <a href={brand.office.phoneHref} className={s.phone}>
                    {brand.office.phone}
                  </a>
                  <a href={brand.office.mapHref} target="_blank" rel="noreferrer" className={s.inline}>
                    View map
                  </a>
                </div>
                <OfficeStatus />
                <button type="button" className={s.secondary} onClick={() => jumpTo("appointment")}>
                  Schedule an appointment
                </button>
              </div>

              {dealer ? (
                <div className={`${s.card} ${s.cardInk}`}>
                  <p className={s.cardKicker}>Signed in as {dealer.store}</p>
                  <p className={s.cardTitle}>Your orders, memo and account are on your dashboard.</p>
                  <Link href={account.dashboard} className={s.primaryLight}>
                    Retailer Dashboard
                  </Link>
                </div>
              ) : (
                <div className={`${s.card} ${s.cardInk}`}>
                  <p className={s.cardKicker}>For jewelry retailers</p>
                  <p className={s.cardTitle}>Become a Surreal dealer in your market</p>
                  <ul className={s.points}>
                    {DEALER_POINTS.map((p) => (
                      <li key={p}>
                        <svg aria-hidden viewBox="0 0 10 10" width="8" height="8">
                          <path d="M5 0.5 9.5 5 5 9.5 0.5 5Z" fill="currentColor" />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <button type="button" className={s.primaryLight} onClick={() => jumpTo("dealer")}>
                    Tell us about your store
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      <section className={s.quick} aria-labelledby="quick-title">
        <div className={s.wrap}>
          <h2 id="quick-title" className={s.quickTitle}>
            Quick <em>answers</em>
          </h2>
          <div className={s.faq}>
            {QUICK.map((item) => (
              <details key={item.q} className={s.faqItem}>
                <summary>
                  {item.q}
                  <span className={s.faqIcon} aria-hidden />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
