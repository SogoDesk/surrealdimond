"use client";

/**
 * The dealer cart and placed orders, kept in this browser for the preview.
 * A line is one configuration of one piece: the same piece in another metal,
 * carat weight or ring size is its own line. Prices are not stored: the
 * dealer price list is not connected yet, and the dealer site's Prices
 * Policy lets Surreal confirm prices when it accepts an order, so every
 * total the UI shows is counts and carat weight.
 */

import type { Metal } from "@/content/catalog";
import { createLocalStore } from "./localStore";

export interface CartLine {
  key: string;
  productId: string;
  metal: Metal;
  carat: number;
  size: string | null;
  qty: number;
  note: string;
}

export interface StoreDetails {
  store: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  po: string;
  deadline: string;
  notes: string;
}

/** Payment at checkout (BRD B-05): card, ACH or wire through Surreal's existing card processor. */
export type PaymentMethod = "card" | "ach" | "wire";

export interface PlacedOrder {
  number: string;
  placedAt: string;
  lines: CartLine[];
  details: StoreDetails;
  payment: PaymentMethod;
  beforeCutoff: boolean;
}

const isLines = (v: unknown): v is CartLine[] => Array.isArray(v) && v.every((l) => typeof l === "object" && l !== null && typeof (l as CartLine).key === "string" && typeof (l as CartLine).qty === "number");
const isOrders = (v: unknown): v is PlacedOrder[] => Array.isArray(v) && v.every((o) => typeof o === "object" && o !== null && typeof (o as PlacedOrder).number === "string");

const cart = createLocalStore<CartLine[]>("surreal-cart", [], isLines);
const orders = createLocalStore<PlacedOrder[]>("surreal-orders", [], isOrders);

export const useCart = cart.useStore;
export const useOrders = orders.useStore;

export const lineKey = (productId: string, metal: Metal, carat: number, size: string | null) => [productId, metal, carat, size ?? "-"].join("|");

export const CART_ADDED = "surreal-cart-added";

export function addToCart(line: Omit<CartLine, "key">) {
  const key = lineKey(line.productId, line.metal, line.carat, line.size);
  cart.set((lines) => {
    const found = lines.find((l) => l.key === key);
    if (found) return lines.map((l) => (l.key === key ? { ...l, qty: Math.min(99, l.qty + line.qty), note: line.note || l.note } : l));
    return [...lines, { ...line, key }];
  });
  window.dispatchEvent(new CustomEvent(CART_ADDED, { detail: key }));
}

export const setQty = (key: string, qty: number) => cart.set((lines) => lines.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(99, qty)) } : l)));
export const setNote = (key: string, note: string) => cart.set((lines) => lines.map((l) => (l.key === key ? { ...l, note } : l)));
export const removeLine = (key: string) => cart.set((lines) => lines.filter((l) => l.key !== key));
export const clearCart = () => cart.set([]);

export const pieceCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const caratTotal = (lines: CartLine[]) => Math.round(lines.reduce((n, l) => n + l.carat * l.qty, 0) * 100) / 100;

export function placeOrder(order: Omit<PlacedOrder, "number" | "placedAt">): PlacedOrder {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const number = `SD-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
  const placed: PlacedOrder = { ...order, number, placedAt: now.toISOString() };
  orders.set((list) => [placed, ...list]);
  clearCart();
  return placed;
}

/** New York time: is it a weekday before the 4:00pm EST cutoff? */
export function beforeCutoff(date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  return !["Sat", "Sun"].includes(weekday) && hour < 16;
}

/** Change a line's size: the line takes its new key, merging into an existing line with the same configuration. */
export function setSize(key: string, size: string | null) {
  cart.set((lines) => {
    const line = lines.find((l) => l.key === key);
    if (!line) return lines;
    const nextKey = lineKey(line.productId, line.metal, line.carat, size);
    const twin = lines.find((l) => l.key === nextKey && l.key !== key);
    if (twin) return lines.filter((l) => l.key !== key).map((l) => (l.key === nextKey ? { ...l, qty: Math.min(99, l.qty + line.qty) } : l));
    return lines.map((l) => (l.key === key ? { ...l, key: nextKey, size } : l));
  });
}

export const SIZED_CATEGORIES = new Set(["engagement", "wedding-bands", "rings"]);
export const RING_SIZES = ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"];
