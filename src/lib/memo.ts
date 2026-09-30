"use client";

/**
 * Memo requests from the diamond page, kept in this browser for the preview.
 * A requested stone leaves available inventory straight away (BRD R-18,
 * B-01); the open memo report (R-28) reads this list until RightClick
 * supplies the real memo data.
 */

import { createLocalStore } from "./localStore";
import { useOrders } from "./cart";

export interface MemoRequest {
  number: string;
  stoneId: string;
  requestedAt: string;
}

const isMemos = (v: unknown): v is MemoRequest[] => Array.isArray(v) && v.every((m) => typeof m === "object" && m !== null && typeof (m as MemoRequest).stoneId === "string");
const store = createLocalStore<MemoRequest[]>("surreal-memo", [], isMemos);

export const useMemos = store.useStore;

export function requestMemo(stoneId: string): MemoRequest {
  const now = new Date();
  const memo: MemoRequest = { number: `MO-${String(now.getTime()).slice(-6)}`, stoneId, requestedAt: now.toISOString() };
  store.set((list) => (list.some((m) => m.stoneId === stoneId) ? list : [memo, ...list]));
  return memo;
}

/** Stones no longer available: on a placed order or on memo. */
export function useUnavailable(): Set<string> {
  const orders = useOrders();
  const memos = useMemos();
  const ids = new Set<string>();
  orders.forEach((o) => o.lines.forEach((l) => l.stoneId && ids.add(l.stoneId)));
  memos.forEach((m) => ids.add(m.stoneId));
  return ids;
}
