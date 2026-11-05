"use client";

/**
 * The next day delivery cutoff: "Order before 4:00pm ET to receive next day
 * delivery." Surreal's time zone is New York, so the clock is always New
 * York's (Eastern time, EST or EDT by the season) wherever the dealer is.
 * On a weekday before the cutoff the hook gives the minutes left; otherwise
 * null. The clock is read through
 * useSyncExternalStore with a 30 second tick, and the server snapshot is
 * null, so the first paint states the plain rule and hydration never
 * disagrees.
 */

import { useSyncExternalStore } from "react";

export const CUTOFF_LABEL = "4:00pm ET";
const CUTOFF_MIN = 16 * 60;

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
}

let lastKey = "";
let lastValue: number | null = null;

/** The New York wall clock: the weekday and the minutes past midnight. */
function newYork(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { day: get("weekday"), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** Is it a weekday before the cutoff in New York? */
export function beforeCutoff(date = new Date()): boolean {
  const { day, minutes } = newYork(date);
  return !["Sat", "Sun"].includes(day) && minutes < CUTOFF_MIN;
}

function minutesLeft(): number | null {
  const { day, minutes } = newYork(new Date());
  const key = `${day}-${minutes}`;
  if (key === lastKey) return lastValue;
  lastKey = key;
  lastValue = !["Sat", "Sun"].includes(day) && minutes < CUTOFF_MIN ? CUTOFF_MIN - minutes : null;
  return lastValue;
}

/** Minutes left before today's cutoff in New York, or null outside it. */
export const useCutoffMinutes = () => useSyncExternalStore(subscribe, minutesLeft, () => null);

/** "3h 12m" or "45m". */
export const formatLeft = (m: number) => `${m >= 60 ? `${Math.floor(m / 60)}h ` : ""}${m % 60}m`;
