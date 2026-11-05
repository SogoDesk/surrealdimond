/**
 * Orders from RightClick, every channel (client change request, November
 * 2026): the dealer's phone orders, which never pass through the site,
 * beside the ones placed here. The orders sync (lib/sync.ts) brings them in
 * once RightClick is connected; until then each account shows three sample
 * phone orders, seeded from the dealer's email so they stay put.
 */

import type { OrderStatus } from "./orderStatus";

export interface PhoneOrder {
  number: string;
  placedAt: string;
  pieces: number;
  stones: number;
  status: OrderStatus;
}

const DAY = 864e5;

function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Three sample phone orders for the account: placed two, nine and twenty-three days ago, at mid-afternoon New York time. */
export function samplePhoneOrders(email: string, now: number): PhoneOrder[] {
  const h = seedOf(email.toLowerCase());
  const plans: [daysAgo: number, status: OrderStatus][] = [
    [2, "confirmed"],
    [9, "shipped"],
    [23, "delivered"],
  ];
  return plans.map(([daysAgo, status], i) => {
    const n = (h >>> (i * 5)) & 31;
    const placed = Math.floor(now / DAY) * DAY - daysAgo * DAY + 19 * 36e5;
    return { number: `RC-${40000 + ((h + i * 7919) % 50000)}`, placedAt: new Date(placed).toISOString(), pieces: 1 + (n % 4), stones: n % 3 === 0 ? 1 : 0, status };
  });
}
