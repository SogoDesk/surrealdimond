/**
 * The dealer's own account settings in the preview, kept in this browser:
 *
 * - Payment methods (BRD R-27): cards and bank accounts on the account, one
 *   of them the default. Only the brand or bank, the last four digits and
 *   the expiry are kept; once the card processor is connected (C-10, Q2,
 *   Q3) the processor holds the methods and this store goes.
 * - Trade show meeting requests (R-26): the show, the days that suit, a
 *   time of day and the people coming. The console's inbox replaces this.
 */

import { createLocalStore } from "./localStore";

export type CardBrand = "Visa" | "Mastercard" | "American Express" | "Discover";
export type AccountType = "Checking" | "Savings";

export type PaymentMethod =
  | { id: string; kind: "card"; brand: CardBrand; last4: string; expiry: string; name: string }
  | { id: string; kind: "ach"; bank: string; type: AccountType; last4: string; name: string };

export interface PaymentMethods {
  methods: PaymentMethod[];
  defaultId: string | null;
}

const isMethods = (v: unknown): v is PaymentMethods => typeof v === "object" && v !== null && Array.isArray((v as PaymentMethods).methods);
const methodsStore = createLocalStore<PaymentMethods>("surreal-payment-methods", { methods: [], defaultId: null }, isMethods);

export const usePaymentMethods = methodsStore.useStore;

const newId = () => `pm-${Date.now().toString(36)}`;

/** Add a method; the first one on the account becomes the default. */
export function addPaymentMethod(method: Omit<Extract<PaymentMethod, { kind: "card" }>, "id"> | Omit<Extract<PaymentMethod, { kind: "ach" }>, "id">) {
  const id = newId();
  methodsStore.set((pm) => ({ methods: [...pm.methods, { ...method, id } as PaymentMethod], defaultId: pm.defaultId ?? id }));
}

export function removePaymentMethod(id: string) {
  methodsStore.set((pm) => {
    const methods = pm.methods.filter((m) => m.id !== id);
    return { methods, defaultId: pm.defaultId === id ? (methods[0]?.id ?? null) : pm.defaultId };
  });
}

export const setDefaultPaymentMethod = (id: string) => methodsStore.set((pm) => ({ ...pm, defaultId: id }));

export function methodLabel(m: PaymentMethod): string {
  return m.kind === "card" ? `${m.brand} ending ${m.last4}` : `${m.type} at ${m.bank} ending ${m.last4}`;
}

export interface ShowMeeting {
  number: string;
  show: string;
  days: string;
  time: "Morning" | "Midday" | "Afternoon" | "Any time";
  people: number;
  notes: string;
  sentAt: string;
}

const isMeetings = (v: unknown): v is ShowMeeting[] => Array.isArray(v);
const meetingsStore = createLocalStore<ShowMeeting[]>("surreal-show-meetings", [], isMeetings);

export const useShowMeetings = meetingsStore.useStore;

export function requestShowMeeting(meeting: Omit<ShowMeeting, "number" | "sentAt">): ShowMeeting {
  const now = new Date();
  const sent: ShowMeeting = { ...meeting, number: `TS-${String(now.getTime()).slice(-6)}`, sentAt: now.toISOString() };
  meetingsStore.set((list) => [sent, ...list]);
  return sent;
}

export const cancelShowMeeting = (number: string) => meetingsStore.set((list) => list.filter((m) => m.number !== number));
