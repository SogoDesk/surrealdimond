"use client";

/**
 * Next day delivery, from the dealer site's banner: "Order before 4:00pm EST
 * to receive next day delivery." On a weekday before the cutoff (New York
 * time) it counts down the hours and minutes left; otherwise it states the
 * rule (the clock is src/lib/cutoff.ts).
 */

import { useCutoffMinutes } from "@/lib/cutoff";
import s from "./product.module.css";

export default function DeliveryCountdown() {
  const left = useCutoffMinutes();
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
