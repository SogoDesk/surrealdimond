"use client";

/**
 * The next day delivery cutoff: "Order before 4:00pm EST to receive next day
 * delivery." On a weekday before the cutoff (New York time) the hook gives
 * the minutes left; otherwise null. The clock is read through
 * useSyncExternalStore with a 30 second tick, and the server snapshot is
 * null, so the first paint states the plain rule and hydration never
 * disagrees.
 */

import { useSyncExternalStore } from "react";

export const CUTOFF_LABEL = "4:00pm EST";
const CUTOFF_MIN = 16 * 60;

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
}

let lastKey = "";
let lastValue: number | null = null;

function minutesLeft(): number | null {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const key = `${get("weekday")}-${get("hour")}-${get("minute")}`;
  if (key === lastKey) return lastValue;
  lastKey = key;
  const weekday = !["Sat", "Sun"].includes(get("weekday"));
  const now = Number(get("hour")) * 60 + Number(get("minute"));
  lastValue = weekday && now < CUTOFF_MIN ? CUTOFF_MIN - now : null;
  return lastValue;
}

/** Minutes left before today's cutoff in New York, or null outside it. */
export const useCutoffMinutes = () => useSyncExternalStore(subscribe, minutesLeft, () => null);

/** "3h 12m" or "45m". */
export const formatLeft = (m: number) => `${m >= 60 ? `${Math.floor(m / 60)}h ` : ""}${m % 60}m`;
