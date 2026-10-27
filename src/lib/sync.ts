/**
 * The RightClick sync plan (F-E4, F-E5; docs/RIGHTCLICK.md): what the site
 * pulls, how often, and how many API calls that costs against RightClick's
 * limit of 30 calls a minute from one address (more and RightClick blocks
 * the address).
 *
 * The plan pulls in bulk and only what changed: one call returns the open
 * invoices of every customer, one returns the stock movements since the
 * last run. Per-dealer calls (balance with aging, statement) happen only
 * when a dealer opens Billing, cached for 15 minutes. Every call goes
 * through one queue, a call every 3 seconds at most (20 a minute, a third
 * under the limit), on one stored session.
 *
 * In the preview the console edits the intervals and shows the budget;
 * nothing calls RightClick until the account is connected (C-07).
 */

import { createLocalStore } from "./localStore";

export const RC_LIMIT_PER_MINUTE = 30;
/** The queue's own ceiling: one call every 3 seconds. */
export const QUEUE_PER_MINUTE = 20;
/** Dealer traffic is counted over a 10 hour business day. */
export const BUSINESS_HOURS = 10;

export type SyncGroup = "Stock" | "Billing" | "Customers" | "Reference";

export interface SyncJob {
  id: string;
  group: SyncGroup;
  label: string;
  what: string;
  /** API calls per run. */
  calls: number;
  /** Minutes between runs, the plan's default. */
  every: number;
  /** Intervals offered in the console, in minutes. */
  options: number[];
  /** What the site shows from it. */
  feeds: string;
}

export const SYNC_JOBS: SyncJob[] = [
  { id: "changes", group: "Stock", label: "Stock movements", what: "Every sale, memo out, memo return and new item since the last run", calls: 1, every: 5, options: [1, 2, 5, 10, 15, 30], feeds: "Takes sold and memoed stones off the diamond page; adds new stock" },
  { id: "stones", group: "Stock", label: "Stones, full list", what: "Loose and certified diamonds on hand or on memo, with grades and prices", calls: 2, every: 30, options: [15, 30, 60, 240, 1440], feeds: "The diamond page and Quick View; catches anything a movement missed" },
  { id: "jewelry", group: "Stock", label: "Jewelry on hand", what: "Finished jewelry on hand or on memo", calls: 1, every: 60, options: [30, 60, 240, 1440], feeds: "In-stock flags on the jewelry pages" },
  { id: "invoices", group: "Billing", label: "Open invoices", what: "Every customer's open invoices, in one call", calls: 1, every: 15, options: [5, 10, 15, 30, 60], feeds: "Invoices and payments, the dashboard balance, the console's receivables" },
  { id: "receipts", group: "Billing", label: "Payments and credits posted", what: "Cash receipts and credits finance posted since yesterday", calls: 1, every: 15, options: [5, 15, 30, 60], feeds: "Clears \"pending posting\" on payments made on the site" },
  { id: "memo", group: "Billing", label: "Open memo lines", what: "Every open memo line with today's price, as one data export", calls: 2, every: 15, options: [15, 30, 60, 240], feeds: "Open memo items and the memo report" },
  { id: "customers", group: "Customers", label: "New customers", what: "Customers added in RightClick since the last run", calls: 1, every: 60, options: [15, 60, 240, 1440], feeds: "Dealers in the console; account codes for new logins" },
  { id: "tables", group: "Reference", label: "Reference tables and customer list", what: "Shapes, colors, clarities, labs, metals, payment terms, ship via; the full customer list for changed details", calls: 8, every: 1440, options: [1440], feeds: "Filter labels and codes; customer details" },
  { id: "session", group: "Reference", label: "Session renewal", what: "A new session when the stored one expires (they last several hours)", calls: 1, every: 120, options: [120], feeds: "Keeps every other call on one session" },
];

export interface OnDemand {
  id: string;
  label: string;
  what: string;
  calls: number;
  /** Events an hour, the plan's estimate for a business hour. */
  perHour: number;
}

export const ON_DEMAND: OnDemand[] = [
  { id: "billing", label: "Dealer opens Billing", what: "Balance with aging, and the statement; cached 15 minutes", calls: 2, perHour: 20 },
  { id: "hold", label: "Stone ordered or requested on memo", what: "Live check that the stone is free, then a hold on it", calls: 2, perHour: 10 },
  { id: "order", label: "Order placed", what: "The order written into RightClick", calls: 1, perHour: 5 },
];

export interface SyncSettings {
  every: Record<string, number>;
  perHour: Record<string, number>;
}

const isSettings = (v: unknown): v is SyncSettings => typeof v === "object" && v !== null && "every" in v && "perHour" in v;
export const DEFAULT_SETTINGS: SyncSettings = {
  every: Object.fromEntries(SYNC_JOBS.map((j) => [j.id, j.every])),
  perHour: Object.fromEntries(ON_DEMAND.map((d) => [d.id, d.perHour])),
};
const store = createLocalStore<SyncSettings>("surreal-sync-settings", DEFAULT_SETTINGS, isSettings);
export const useSyncSettings = store.useStore;
export const setSyncSettings = store.set;
export const resetSyncSettings = () => store.set(DEFAULT_SETTINGS);

export interface Budget {
  scheduledPerDay: number;
  onDemandPerDay: number;
  perDay: number;
  /** Average calls a minute across the business day, scheduled plus dealer traffic. */
  busyAverage: number;
  /** The worst minute: every job due at once plus a minute of dealer traffic, before the queue spreads it. */
  worstMinute: number;
  /** Seconds the queue needs to clear that worst minute. */
  drainSeconds: number;
  verdict: "comfortable" | "tight" | "over";
}

export function budget(settings: SyncSettings): Budget {
  const every = (j: SyncJob) => settings.every[j.id] ?? j.every;
  const perHour = (d: OnDemand) => settings.perHour[d.id] ?? d.perHour;
  const scheduledPerDay = SYNC_JOBS.reduce((n, j) => n + j.calls * (1440 / every(j)), 0);
  const onDemandPerHour = ON_DEMAND.reduce((n, d) => n + d.calls * perHour(d), 0);
  const onDemandPerDay = onDemandPerHour * BUSINESS_HOURS;
  const busyAverage = scheduledPerDay / 1440 + onDemandPerHour / 60;
  const worstMinute = SYNC_JOBS.reduce((n, j) => n + j.calls, 0) + Math.ceil(onDemandPerHour / 60);
  const drainSeconds = Math.ceil((worstMinute * 60) / QUEUE_PER_MINUTE);
  const verdict = busyAverage > QUEUE_PER_MINUTE ? "over" : busyAverage > QUEUE_PER_MINUTE / 2 ? "tight" : "comfortable";
  return { scheduledPerDay: Math.round(scheduledPerDay), onDemandPerDay: Math.round(onDemandPerDay), perDay: Math.round(scheduledPerDay + onDemandPerDay), busyAverage, worstMinute, drainSeconds, verdict };
}

export const everyLabel = (m: number) => (m < 60 ? `${m} min` : m === 60 ? "1 hour" : m < 1440 ? `${m / 60} hours` : "nightly");
