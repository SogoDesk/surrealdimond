"use client";

/**
 * The dealer session for the preview (docs/TASKS.md, "Mock auth"). Real
 * dealer accounts arrive with the dealer platform; until then a sign in
 * keeps the dealer's store name and email in this browser so the signed-in
 * experience (account menu, cart, checkout) can be reviewed end to end. No
 * password is ever stored.
 */

import { createLocalStore } from "./localStore";

export interface DealerSession {
  email: string;
  store: string;
  contact: string;
  demo: boolean;
}

const isSession = (v: unknown): v is DealerSession | null =>
  v === null || (typeof v === "object" && v !== null && typeof (v as DealerSession).email === "string" && typeof (v as DealerSession).store === "string");

const store = createLocalStore<DealerSession | null>("surreal-dealer", null, isSession);

export const useDealer = store.useStore;

/** A store name from the email's domain ("buyer@hartley-jewelers.com" gives "Hartley Jewelers"). */
export function storeFromEmail(email: string): string {
  const domain = email.split("@")[1]?.split(".")[0] ?? "";
  const words = domain.split(/[-_]+/).filter(Boolean);
  return words.length ? words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") : "Your store";
}

export function signIn(session: DealerSession) {
  store.set(session);
}

export function signOut() {
  store.set(null);
}

export const DEMO_DEALER: DealerSession = { email: "buyer@demo-jewelers.com", store: "Demo Jewelers", contact: "Demo buyer", demo: true };
