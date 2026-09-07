"use client";

/**
 * Contact drawer (DESIGN.md, section 11). Mount it once anywhere on the page;
 * any component opens it with openContactDrawer(topic, intent), which raises a
 * "surreal:contact" window event. Paper panel, 480px (a full-screen sheet below
 * 768px), slides in from the right on a GSAP x tween, traps focus, closes on
 * Escape or the backdrop, and locks the page scroll while open. The form posts
 * to the submitContact server action; on submit every underline draws once in
 * ink and a thank-you line replaces the fields.
 */

import { useActionState, useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import { lockScroll } from "@/lib/scroll";
import { submitContact, type ContactIntent, type ContactState, type ContactTopic } from "@/app/actions/contact";
import styles from "./ContactDrawer.module.css";

export const CONTACT_EVENT = "surreal:contact";

/* Mirrors TOPICS in src/app/actions/contact.ts. */
export const CONTACT_TOPICS: { value: ContactTopic; label: string }[] = [
  { value: "engagement", label: "Engagement" },
  { value: "made-to-order", label: "Made to Order" },
  { value: "legacy", label: "Diamond Legacy" },
  { value: "custom", label: "Custom" },
  { value: "trade", label: "Trade" },
  { value: "other", label: "Other" },
];

export interface ContactOpenDetail {
  topic: ContactTopic;
  intent: ContactIntent;
}

/** Open the drawer with the select preset to the door that opened it. */
export function openContactDrawer(topic: ContactTopic = "other", intent: ContactIntent = "contact") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ContactOpenDetail>(CONTACT_EVENT, { detail: { topic, intent } }));
}

const TITLES: Record<ContactIntent, string> = { visit: "Book a visit", contact: "Contact us" };
const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
const INITIAL_STATE: ContactState = { ok: false };

export default function ContactDrawer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const everOpenedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ContactOpenDetail>({ topic: "other", intent: "contact" });
  const [formKey, setFormKey] = useState(0);
  const [sent, setSent] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const onOpen = (event: Event) => {
      const next = (event as CustomEvent<Partial<ContactOpenDetail>>).detail ?? {};
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setDetail({ topic: next.topic ?? "other", intent: next.intent ?? "contact" });
      if (sent) {
        setFormKey((k) => k + 1);
        setSent(false);
      }
      setOpen(true);
    };
    window.addEventListener(CONTACT_EVENT, onOpen);
    return () => window.removeEventListener(CONTACT_EVENT, onOpen);
  }, [sent]);

  const close = useCallback(() => setOpen(false), []);

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      const panel = panelRef.current;
      const backdrop = backdropRef.current;
      if (!root || !panel || !backdrop) return;
      const reduce = prefersReducedMotion();
      const duration = reduce ? 0.3 : 0.6;

      // Closed and never opened: hold the rest state (also re-applied if the context is reverted and rerun).
      if (!open && !everOpenedRef.current) {
        gsap.set(root, { autoAlpha: 0 });
        gsap.set(panel, { xPercent: 100 });
        gsap.set(backdrop, { autoAlpha: 0 });
        return;
      }

      if (open) {
        everOpenedRef.current = true;
        lockScroll(true);
        gsap.set(root, { autoAlpha: 1 });
        gsap.to(backdrop, { autoAlpha: 1, duration: 0.5, ease: "power2.out", overwrite: true });
        gsap.to(panel, {
          xPercent: 0,
          duration,
          ease: reduce ? "power2.out" : "surreal",
          overwrite: true,
          onComplete: () => {
            // The first input in DOM order is the hidden honeypot, so pick the first field that is actually in the tab order.
            const first = Array.from(panel.querySelectorAll<HTMLElement>("input, select, textarea, button")).find(
              (el) => el.tabIndex >= 0 && el.offsetParent !== null,
            );
            (first ?? panel).focus({ preventScroll: true });
          },
        });
      } else {
        gsap.to(backdrop, { autoAlpha: 0, duration: 0.4, ease: "power2.out", overwrite: true });
        gsap.to(panel, {
          xPercent: 100,
          duration: reduce ? 0.3 : 0.5,
          ease: reduce ? "power2.out" : "surrealInOut",
          overwrite: true,
          onComplete: () => {
            gsap.set(root, { autoAlpha: 0 });
            lockScroll(false);
            openerRef.current?.focus({ preventScroll: true });
          },
        });
      }
    },
    { scope: rootRef, dependencies: [open] },
  );

  // If the drawer unmounts while open, hand the page back.
  useEffect(() => () => lockScroll(false), []);

  // Escape closes the drawer even when focus is still on the element that opened it.
  useEffect(() => {
    if (!open) return;
    const onDocumentKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onDocumentKey);
    return () => document.removeEventListener("keydown", onDocumentKey);
  }, [open, close]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    // Skip anything removed from the tab order (the honeypot input, the panel itself) and anything not rendered.
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.tabIndex >= 0 && el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div ref={rootRef} className={styles.root} onKeyDown={onKeyDown} inert={!open} data-contact-drawer>
      <button ref={backdropRef} type="button" className={styles.backdrop} aria-label="Close" onClick={close} tabIndex={-1} />
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-theme="light"
        data-lenis-prevent
        tabIndex={-1}
      >
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {TITLES[detail.intent]}
          </h2>
          <button type="button" className={styles.close} onClick={close} aria-label="Close" data-cursor="link">
            <svg aria-hidden viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M3 3l14 14M17 3L3 17" />
            </svg>
          </button>
        </div>
        <ContactForm key={formKey} topic={detail.topic} intent={detail.intent} onSent={() => setSent(true)} onClose={close} />
      </aside>
    </div>
  );
}

function ContactForm({
  topic: preset,
  intent,
  onSent,
  onClose,
}: {
  topic: ContactTopic;
  intent: ContactIntent;
  onSent: () => void;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const thanksRef = useRef<HTMLDivElement>(null);
  const [state, formAction, pending] = useActionState(submitContact, INITIAL_STATE);
  const [topic, setTopic] = useState<ContactTopic>(preset);
  const [lastPreset, setLastPreset] = useState(preset);
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;

  // A new door opened the drawer: follow its preset (derived during render, no effect needed).
  if (preset !== lastPreset) {
    setLastPreset(preset);
    setTopic(preset);
  }

  // Every underline draws once in ink as the form leaves.
  const onSubmit = () => {
    const form = formRef.current;
    if (!form) return;
    registerGsap();
    const inks = form.querySelectorAll<HTMLElement>("[data-ink]");
    gsap.fromTo(inks, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: prefersReducedMotion() ? 0.2 : 0.6, ease: "surreal", stagger: 0.08, overwrite: true });
  };

  useGSAP(
    () => {
      if (!state.ok) {
        // The server sent the form back with errors: retract the ink so the underlines can draw again.
        const form = formRef.current;
        if (state.submitted && form) {
          registerGsap();
          gsap.to(form.querySelectorAll<HTMLElement>("[data-ink]"), { scaleX: 0, duration: 0.3, ease: "power2.out", overwrite: true });
        }
        return;
      }
      onSent();
      const thanks = thanksRef.current;
      if (!thanks) return;
      gsap.fromTo(thanks, { autoAlpha: 0, y: prefersReducedMotion() ? 0 : 24 }, { autoAlpha: 1, y: 0, duration: prefersReducedMotion() ? 0.3 : 1, ease: "surreal", delay: 0.2 });
      thanks.querySelector<HTMLElement>("h3")?.focus({ preventScroll: true });
    },
    { dependencies: [state] },
  );

  const errors = state.errors ?? {};

  if (state.ok) {
    return (
      <div ref={thanksRef} className={styles.thanks} role="status">
        <h3 className={styles.thanksTitle} tabIndex={-1}>
          Thank you.
        </h3>
        <p className="t-body">
          {intent === "visit"
            ? "We have your note and will write back to find a time for your visit."
            : "We have your note and will write back soon."}
        </p>
        <div className={styles.thanksAction}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} className={styles.form} noValidate>
      <input type="hidden" name="intent" value={intent} />
      <div className={styles.honeypot} aria-hidden>
        <label htmlFor={id("company")}>Company</label>
        <input id={id("company")} name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Field id={id("name")} label="Name" error={errors.name}>
        <input id={id("name")} name="name" type="text" placeholder=" " autoComplete="name" required maxLength={120} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? `${id("name")}-error` : undefined} />
      </Field>

      <Field id={id("email")} label="Email" error={errors.email}>
        <input id={id("email")} name="email" type="email" placeholder=" " autoComplete="email" required maxLength={254} inputMode="email" aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? `${id("email")}-error` : undefined} />
      </Field>

      <Field id={id("topic")} label="What brings you in" error={errors.topic} floated>
        <select id={id("topic")} name="topic" value={topic} onChange={(e) => setTopic(e.target.value as ContactTopic)} aria-invalid={errors.topic ? true : undefined} aria-describedby={errors.topic ? `${id("topic")}-error` : undefined}>
          {CONTACT_TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <svg aria-hidden className={styles.chevron} viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
          <path d="M2 4.5l4 4 4-4" />
        </svg>
      </Field>

      <Field id={id("message")} label="Message" error={errors.message}>
        <textarea id={id("message")} name="message" placeholder=" " rows={4} required maxLength={4000} aria-invalid={errors.message ? true : undefined} aria-describedby={errors.message ? `${id("message")}-error` : undefined} />
      </Field>

      <div className={styles.actions}>
        <Button type="submit" arrow className={pending ? styles.pending : undefined}>
          {pending ? "Sending" : "Send"}
        </Button>
        <p className={`t-caption ${styles.note}`}>We reply by email.</p>
      </div>
    </form>
  );
}

function Field({ id, label, error, floated = false, children }: { id: string; label: string; error?: string; floated?: boolean; children: ReactNode }) {
  return (
    <div className={styles.field} data-floated={floated ? "true" : undefined} data-error={error ? "true" : undefined}>
      {children}
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <span className={styles.line} aria-hidden>
        <span className={styles.lineInk} data-ink />
      </span>
      {error && (
        <p id={`${id}-error`} className={`t-caption ${styles.error}`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
