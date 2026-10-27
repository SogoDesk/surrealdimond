"use client";

/**
 * Memo requests from the diamond page, kept in this browser for the preview.
 * A requested stone leaves available inventory straight away (BRD R-18,
 * B-01); the open memo report (R-28) reads this list until RightClick
 * supplies the real memo data.
 */

import { createLocalStore } from "./localStore";
import { useOrders } from "./cart";
import { useOrderWorkMap, workOf } from "./orderStatus";

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

/** Stones no longer available: on a placed order (a cancelled order releases its stones) or on memo. */
export function useUnavailable(): Set<string> {
  const orders = useOrders();
  const work = useOrderWorkMap();
  const memos = useMemos();
  const ids = new Set<string>();
  orders.filter((o) => workOf(work, o).status !== "cancelled").forEach((o) => o.lines.forEach((l) => l.stoneId && ids.add(l.stoneId)));
  memos.forEach((m) => ids.add(m.stoneId));
  return ids;
}

/**
 * Memo reconciliation from the open memo report (the live report's form):
 * the items the dealer reports as sold, whether they confirm the list is
 * accurate, and a note for any discrepancy. Kept in this browser with an RC
 * number until the memo data comes from RightClick.
 */
export interface MemoReport {
  number: string;
  sentAt: string;
  /** Memo line ids reported sold. */
  sold: string[];
  confirmed: boolean;
  note: string;
}

const isReports = (v: unknown): v is MemoReport[] => Array.isArray(v) && v.every((r) => typeof r === "object" && r !== null && Array.isArray((r as MemoReport).sold));
const reports = createLocalStore<MemoReport[]>("surreal-memo-reports", [], isReports);

export const useMemoReports = reports.useStore;

export function sendMemoReport(report: Omit<MemoReport, "number" | "sentAt">): MemoReport {
  const now = new Date();
  const sent: MemoReport = { ...report, number: `RC-${String(now.getTime()).slice(-6)}`, sentAt: now.toISOString() };
  reports.set((list) => [sent, ...list]);
  return sent;
}
