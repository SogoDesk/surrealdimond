"use client";

/**
 * Dealer customer accounts for the move to the new site (F-E1, F-E2), in the
 * PREVIEW. In production these live in the database, imported from
 * RightClick's customer list or the current site's dealer export (C-13), and
 * the setup email goes through the email service (Resend, C-14).
 *
 * - Customers: imported from Excel or CSV in the console (Dealers), plus the
 *   dummy test accounts (src/content/testAccounts.ts) seeded once.
 * - Setup links: a random token in the link, only its SHA-256 kept here,
 *   valid for 72 hours and for one use; a new link replaces the old one.
 *   Following it, the customer sets a password and the account turns active.
 */

import { TEST_DEALERS, TEST_DEALER_PASSWORD } from "@/content/testAccounts";
import { hasPassword, randomToken, setPassword, sha256 } from "./auth";
import { createLocalStore } from "./localStore";

export type CustomerStatus = "not-invited" | "invited" | "active";
export type CustomerRole = "owner" | "associate";

export interface Customer {
  id: string;
  /** RightClick customer code. */
  account: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  role: CustomerRole;
  status: CustomerStatus;
  source: "import" | "test";
  importedAt: string;
  invitedAt?: string;
  activatedAt?: string;
}

interface Invite {
  customerId: string;
  createdAt: number;
  expires: number;
}

export const INVITE_HOURS = 72;

const isList = (v: unknown): v is Customer[] => Array.isArray(v);
const isInvites = (v: unknown): v is Record<string, Invite> => typeof v === "object" && v !== null && !Array.isArray(v);

/** The test accounts, as customers; seeded the first time the store is read. */
const SEED: Customer[] = TEST_DEALERS.map((t, i) => ({
  id: `cus-test-${i + 1}`,
  account: t.account,
  company: t.company,
  contact: t.contact,
  email: t.email,
  phone: t.phone,
  city: t.city,
  state: t.state,
  role: t.role,
  status: t.status,
  source: "test",
  importedAt: "2026-10-27T09:00:00.000Z",
  invitedAt: t.status === "not-invited" ? undefined : "2026-10-27T09:00:00.000Z",
  activatedAt: t.status === "active" ? "2026-10-27T09:30:00.000Z" : undefined,
}));

const store = createLocalStore<Customer[]>("surreal-customers", SEED, isList);
const invites = createLocalStore<Record<string, Invite>>("surreal-invites", {}, isInvites);

export const useCustomers = store.useStore;

const norm = (email: string) => email.trim().toLowerCase();
export const customerByEmail = (email: string) => store.get().find((c) => norm(c.email) === norm(email));

/** Give the active test accounts their test password once (hashing is async, so this runs from an effect). */
export async function ensureTestPasswords() {
  for (const t of TEST_DEALERS) {
    if (t.status === "active" && !hasPassword(t.email)) await setPassword(t.email, TEST_DEALER_PASSWORD);
  }
}

/* Import */

export interface ImportRow {
  account: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  role: CustomerRole;
}

export interface ImportResult {
  added: Customer[];
  updated: number;
}

/** A line in the import history: who imported which file, and what it did. */
export interface ImportLog {
  id: string;
  at: string;
  by: string;
  file: string;
  added: number;
  updated: number;
  skipped: number;
}

const isLogs = (v: unknown): v is ImportLog[] => Array.isArray(v);
const logs = createLocalStore<ImportLog[]>("surreal-customer-imports", [], isLogs);
export const useImportLog = logs.useStore;
export const logImport = (entry: Omit<ImportLog, "id" | "at">) => logs.set((all) => [{ id: `imp-${Date.now().toString(36)}`, at: new Date().toISOString(), ...entry }, ...all].slice(0, 20));

/** Add new customers and update existing ones, matched on email. Status and passwords are kept for existing customers. */
export function importCustomers(rows: ImportRow[]): ImportResult {
  const now = new Date().toISOString();
  const current = store.get();
  const byEmail = new Map(current.map((c) => [norm(c.email), c]));
  const added: Customer[] = [];
  let updated = 0;
  const next = [...current];
  rows.forEach((r, i) => {
    const found = byEmail.get(norm(r.email));
    if (found) {
      const at = next.findIndex((c) => c.id === found.id);
      next[at] = { ...found, account: r.account || found.account, company: r.company || found.company, contact: r.contact || found.contact, phone: r.phone || found.phone, city: r.city || found.city, state: r.state || found.state, role: r.role };
      updated += 1;
    } else {
      const c: Customer = { id: `cus-${Date.now().toString(36)}-${i}`, ...r, email: r.email.trim(), status: "not-invited", source: "import", importedAt: now };
      next.push(c);
      added.push(c);
      byEmail.set(norm(r.email), c);
    }
  });
  store.set(next);
  return { added, updated };
}

export function removeCustomer(id: string) {
  store.set((list) => list.filter((c) => c.id !== id));
  invites.set((all) => Object.fromEntries(Object.entries(all).filter(([, v]) => v.customerId !== id)));
}

/* Setup links */

export interface SetupLink {
  url: string;
  expires: number;
}

/** A fresh setup link for a customer; any earlier link stops working. */
export async function createSetupLink(customerId: string): Promise<SetupLink> {
  const token = randomToken();
  const hash = await sha256(token);
  const now = Date.now();
  const expires = now + INVITE_HOURS * 3600 * 1000;
  invites.set((all) => ({ ...Object.fromEntries(Object.entries(all).filter(([, v]) => v.customerId !== customerId)), [hash]: { customerId, createdAt: now, expires } }));
  store.set((list) => list.map((c) => (c.id === customerId && c.status !== "active" ? { ...c, status: "invited", invitedAt: new Date(now).toISOString() } : c)));
  return { url: `/account/setup?token=${token}`, expires };
}

export type SetupLookup = { state: "valid"; customer: Customer; expires: number } | { state: "expired"; customer: Customer } | { state: "invalid" };

export async function lookupSetupLink(token: string): Promise<SetupLookup> {
  if (!/^[0-9a-f]{64}$/.test(token)) return { state: "invalid" };
  const hash = await sha256(token);
  const invite = invites.get()[hash];
  if (!invite) return { state: "invalid" };
  const customer = store.get().find((c) => c.id === invite.customerId);
  if (!customer) return { state: "invalid" };
  if (invite.expires < Date.now()) return { state: "expired", customer };
  return { state: "valid", customer, expires: invite.expires };
}

/** Use the link: set the password, turn the account active, and retire every link for it. */
export async function completeSetup(token: string, password: string): Promise<Customer | null> {
  const found = await lookupSetupLink(token);
  if (found.state !== "valid") return null;
  await setPassword(found.customer.email, password);
  const activatedAt = new Date().toISOString();
  store.set((list) => list.map((c) => (c.id === found.customer.id ? { ...c, status: "active", activatedAt } : c)));
  invites.set((all) => Object.fromEntries(Object.entries(all).filter(([, v]) => v.customerId !== found.customer.id)));
  return { ...found.customer, status: "active", activatedAt };
}
