"use client";

/**
 * Passwords for dealer accounts in the PREVIEW (F-E2). The real sign-in
 * service (Clerk, docs/ARCHITECTURE.md) replaces this file; the screens stay.
 *
 * - A password is never stored: only a PBKDF2-SHA-256 hash with a random
 *   salt (210,000 iterations, the OWASP figure for this algorithm), kept in
 *   this browser per email.
 * - Five wrong passwords in a row lock the account for fifteen minutes.
 * - The rules a new password must meet: at least 12 characters, upper and
 *   lower case, a number, and not the email or the store name.
 */

import { createLocalStore } from "./localStore";

interface Credential {
  salt: string;
  hash: string;
  iterations: number;
  updatedAt: string;
}
interface Attempts {
  count: number;
  lockedUntil: number;
}

const isRecord = <T,>(v: unknown): v is Record<string, T> => typeof v === "object" && v !== null && !Array.isArray(v);
const credentials = createLocalStore<Record<string, Credential>>("surreal-credentials", {}, isRecord<Credential>);
const attempts = createLocalStore<Record<string, Attempts>>("surreal-login-attempts", {}, isRecord<Attempts>);

export const useCredentials = credentials.useStore;

const ITERATIONS = 210000;
export const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

const key = (email: string) => email.trim().toLowerCase();
const toHex = (buf: ArrayBuffer | Uint8Array) => Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => new Uint8Array(hex.match(/../g)?.map((h) => parseInt(h, 16)) ?? []);

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations }, material, 256);
  return toHex(bits);
}

/** A random token for setup links, and its SHA-256 for storage. */
export function randomToken(bytes = 32): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}
export async function sha256(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}

export const hasPassword = (email: string) => Boolean(credentials.get()[key(email)]);

export async function setPassword(email: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  credentials.set((all) => ({ ...all, [key(email)]: { salt: toHex(salt), hash, iterations: ITERATIONS, updatedAt: new Date().toISOString() } }));
  attempts.set((all) => {
    const next = { ...all };
    delete next[key(email)];
    return next;
  });
}

export type VerifyResult = { ok: true } | { ok: false; reason: "no-password" | "wrong" | "locked"; left?: number; minutes?: number };

/** Check a password, counting failures toward the lockout. */
export async function verifyPassword(email: string, password: string): Promise<VerifyResult> {
  const k = key(email);
  const now = Date.now();
  const tries = attempts.get()[k];
  if (tries && tries.lockedUntil > now) return { ok: false, reason: "locked", minutes: Math.ceil((tries.lockedUntil - now) / 60000) };
  const cred = credentials.get()[k];
  if (!cred) return { ok: false, reason: "no-password" };
  const hash = await derive(password, fromHex(cred.salt), cred.iterations);
  // Compare without stopping at the first difference.
  let diff = hash.length ^ cred.hash.length;
  for (let i = 0; i < Math.min(hash.length, cred.hash.length); i++) diff |= hash.charCodeAt(i) ^ cred.hash.charCodeAt(i);
  if (diff === 0) {
    attempts.set((all) => {
      const next = { ...all };
      delete next[k];
      return next;
    });
    return { ok: true };
  }
  const count = (tries && tries.lockedUntil <= now && tries.count >= MAX_ATTEMPTS ? 0 : (tries?.count ?? 0)) + 1;
  const locked = count >= MAX_ATTEMPTS;
  attempts.set((all) => ({ ...all, [k]: { count, lockedUntil: locked ? now + LOCK_MS : 0 } }));
  return locked ? { ok: false, reason: "locked", minutes: LOCK_MS / 60000 } : { ok: false, reason: "wrong", left: MAX_ATTEMPTS - count };
}

/* Password rules */

export interface PasswordCheck {
  rules: { id: string; label: string; ok: boolean }[];
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  valid: boolean;
}

export function checkPassword(password: string, context: { email?: string; company?: string } = {}): PasswordCheck {
  const lower = password.toLowerCase();
  const local = context.email?.split("@")[0]?.toLowerCase() ?? "";
  const words = (context.company ?? "").toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
  const personal = (local.length >= 4 && lower.includes(local)) || words.some((w) => lower.includes(w));
  const rules = [
    { id: "length", label: "At least 12 characters", ok: password.length >= 12 },
    { id: "case", label: "Upper and lower case letters", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { id: "number", label: "At least one number", ok: /\d/.test(password) },
    { id: "personal", label: "Not your email or store name", ok: password.length > 0 && !personal },
  ];
  const passed = rules.filter((r) => r.ok).length;
  const bonus = password.length >= 16 && /[^A-Za-z0-9]/.test(password) ? 1 : 0;
  const valid = rules.every((r) => r.ok);
  const score = (password.length === 0 ? 0 : Math.min(4, Math.max(1, passed - 1 + bonus))) as PasswordCheck["score"];
  return { rules, score: valid ? (Math.max(score, 3) as PasswordCheck["score"]) : (Math.min(score, 2) as PasswordCheck["score"]), label: ["", "Weak", "Fair", "Strong", "Very strong"][valid ? Math.max(score, 3) : Math.min(score, 2)], valid };
}
