"use client";

/**
 * The homepage pop-up banner (an offer, a festive message, an event), set in
 * the admin console (Pop-up banner) and shown by PromoPopup on the homepage.
 *
 * Staff edit a draft and publish it; publishing gives it a new version, so a
 * visitor who closed the last one sees the new one. Each visitor's closing is
 * remembered in this browser by version, and the banner returns according to
 * its repeat rule: every visit, after a day, after a week, or never again.
 * It shows only while it is on, inside its start and end dates, and to its
 * audience (everyone, signed-out visitors, or signed-in dealers).
 *
 * The default is factual (Made to Order, from the live site); discounts and
 * festive copy are Surreal's to write in the console. In the preview the
 * published banner is kept in this browser; the database takes over later.
 */

import { createLocalStore } from "./localStore";

export type PromoLayout = "split" | "image" | "text";
export type PromoTone = "light" | "navy";
export type PromoAudience = "everyone" | "visitors" | "dealers";
export type PromoRepeat = "visit" | "day" | "week" | "once";

export interface Promo {
  active: boolean;
  version: string;
  layout: PromoLayout;
  tone: PromoTone;
  image: string;
  eyebrow: string;
  title: string;
  /** Words set in italic after the title, the house headline manner. Optional. */
  emphasis: string;
  message: string;
  /** An offer code shown as a chip the visitor can copy. Optional. */
  code: string;
  cta: string;
  href: string;
  fineprint: string;
  /** Seconds after the homepage opens. */
  delay: number;
  audience: PromoAudience;
  repeat: PromoRepeat;
  /** yyyy-mm-dd, inclusive; empty for no limit. */
  start: string;
  end: string;
}

export const DEFAULT_PROMO: Promo = {
  active: true,
  version: "default",
  layout: "split",
  tone: "light",
  image: "/media/photos/sb-3996-sm.webp",
  eyebrow: "Made to Order",
  title: "A diamond grown",
  emphasis: "for one client",
  message: "Any shape, in any carat weight or dimensions, with an IGI grading certificate and a brochure for your client.",
  code: "",
  cta: "Start a request",
  href: "/diamonds/made-to-order",
  fineprint: "",
  delay: 6,
  audience: "everyone",
  repeat: "day",
  start: "",
  end: "",
};

const isPromo = (v: unknown): v is Promo => {
  const p = v as Promo;
  return typeof p === "object" && p !== null && typeof p.title === "string" && typeof p.version === "string" && typeof p.delay === "number";
};

const store = createLocalStore<Promo>("surreal-promo", DEFAULT_PROMO, isPromo);

export const usePromo = store.useStore;

/** Publish a draft: it becomes the live banner under a new version. */
export function publishPromo(draft: Promo): Promo {
  const next = { ...draft, version: Date.now().toString(36) };
  store.set(next);
  return next;
}

export const resetPromo = () => store.set(DEFAULT_PROMO);

/* Closing, remembered per browser */

const CLOSED_KEY = "surreal-promo-closed";
const VISIT_KEY = "surreal-promo-visit";
const DAY = 864e5;

interface Closed {
  version: string;
  at: number;
}

function readClosed(): Closed | null {
  try {
    const raw = window.localStorage.getItem(CLOSED_KEY);
    const v = raw ? (JSON.parse(raw) as Closed) : null;
    return v && typeof v.version === "string" && typeof v.at === "number" ? v : null;
  } catch {
    return null;
  }
}

/** Remember that this visitor closed (or followed) this version. */
export function rememberClosed(promo: Promo) {
  try {
    window.localStorage.setItem(CLOSED_KEY, JSON.stringify({ version: promo.version, at: Date.now() }));
    window.sessionStorage.setItem(VISIT_KEY, promo.version);
  } catch {
    // Storage blocked: the banner may show again next visit, which is harmless.
  }
}

/** Today in New York as yyyy-mm-dd, for the start and end dates. */
export function nyToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export type PromoStatus = "off" | "scheduled" | "live" | "ended";

export function promoStatus(p: Promo, today = nyToday()): PromoStatus {
  if (!p.active) return "off";
  if (p.start && today < p.start) return "scheduled";
  if (p.end && today > p.end) return "ended";
  return "live";
}

/** Whether this visitor should see the banner now. Reads browser storage, so call it from an effect. */
export function shouldShowPromo(p: Promo, signedIn: boolean): boolean {
  if (promoStatus(p) !== "live") return false;
  if (p.audience === "visitors" && signedIn) return false;
  if (p.audience === "dealers" && !signedIn) return false;
  let visitSeen = false;
  try {
    visitSeen = window.sessionStorage.getItem(VISIT_KEY) === p.version;
  } catch {
    visitSeen = false;
  }
  if (visitSeen) return false;
  const closed = readClosed();
  if (!closed || closed.version !== p.version) return true;
  const since = Date.now() - closed.at;
  if (p.repeat === "once") return false;
  if (p.repeat === "week") return since > 7 * DAY;
  if (p.repeat === "day") return since > DAY;
  return true;
}
