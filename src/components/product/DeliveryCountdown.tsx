"use client";

/**
 * Next day delivery, from the dealer site's banner: "Order before 4:00pm EST
 * to receive next day delivery." On a weekday before the cutoff (New York
 * time) it counts down the hours and minutes left; otherwise it states the
 * rule. The clock is read through useSyncExternalStore with a one minute
 * tick, and the server snapshot is null, so the first paint is the plain
 * rule and hydration never disagrees.
 */

import { useSyncExternalStore } from "react";
import s from "./product.module.css";

const CUTOFF_MIN = 16 * 60;

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
}

let lastKey = "";
let lastValue: number | null = null;

/** Minutes left before the cutoff today in New York, or null outside it. */
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

export default function DeliveryCountdown() {
  const left = useSyncExternalStore(subscribe, minutesLeft, () => null);
  const h = left === null ? 0 : Math.floor(left / 60);
  const m = left === null ? 0 : left % 60;

  return (
    <div className={s.delivery}>
      <span className={s.deliveryIcon} aria-hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7" />
          <circle cx="7" cy="17.5" r="1.6" />
          <circle cx="17" cy="17.5" r="1.6" />
        </svg>
      </span>
      <span className={s.deliveryText}>
        {left !== null ? (
          <>
            <strong>
              Order within{" "}
              <span className="tabular">
                {h > 0 ? `${h}h ` : ""}
                {m}m
              </span>
            </strong>{" "}
            for next day delivery
          </>
        ) : (
          <>
            <strong>Next day delivery</strong> for dealer orders placed before 4:00pm EST
          </>
        )}
      </span>
    </div>
  );
}
