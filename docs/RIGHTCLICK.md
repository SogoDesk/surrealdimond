# RightClick sync: approach and refresh intervals

Client feedback of 27 October 2026, items F-E4 (sync approach, keeping API calls low) and F-E5 (which refresh intervals are feasible). Written from CFI's RightClick API reference (dated 15 July 2026), which is confidential to CFI: keep this file within the team and Surreal, and do not copy the reference itself anywhere.

The plan is coded in `src/lib/sync.ts` and shown in the console under RightClick sync, where the intervals can be changed and the call budget updates as they do.

## What RightClick gives us

- **One session for many calls.** A session comes from an API key, password and serial number set up by Surreal in RightClick's Security window. It lasts several hours and is tied to the calling IP address. CFI recommends storing it and reusing it until it expires, which is what we do.
- **A hard ceiling: no more than 30 calls a minute.** Faster than that and RightClick blocks the calling address. This is the number every interval below is measured against.
- **Bulk reads.** Open invoices for every customer in one call; stock movements (sales, memos out and back, purchases) over a date range; the full on-hand stone and jewelry lists in one call each; customers added since a date in one call, or the whole list; reference tables (shapes, colors, clarities, labs, metals, payment terms, ship via) one call each.
- **A SQL export.** A read-only `SELECT` returns its result as a downloadable file (JSON, CSV or Excel). CFI asks that it is tightly filtered. We use it for one thing: open memo lines across all customers, which no other call returns in one go.
- **Per-customer reads.** Balance with aging (current, 30, 60, 90, 120+ days), memo and order balance, credit limit; and the statement. These are one call per customer, so they are called only when a dealer opens Billing.
- **Writes.** Orders, memos, holds on an item (and cancelling them), customers, CRM notes.
- **What it does not have.** No call records a payment, so a payment taken on the site goes to Surreal's processor and finance posts the receipt in RightClick; the next sync clears "pending posting" (CONTEXT.md, F-D4). No push or webhook either: the site has to ask, on a schedule.

## The approach

1. **One queue, one session, one address.** Every call goes through one queue that sends at most one call every 3 seconds (20 a minute, a third under RightClick's limit). The session is stored and reused, renewed only when RightClick says it has expired. Calls go out from one fixed outbound address (the host's static IP option, or a small sync worker on a fixed address) because sessions are tied to the address, and so Surreal or CFI can allow-list it.
2. **Bulk, not per item.** The site never loops over stones or customers on a schedule. One call brings every open invoice; one brings every stock movement since the last run.
3. **Changes often, full lists less often.** The cheap "what moved since the last run" call runs every few minutes and keeps the diamond page current. The full stone list runs every 30 minutes to catch anything a movement missed, as the BRD asks (R-18).
4. **Per dealer only on demand.** A dealer's balance with aging and statement are fetched when they open Billing and kept for 15 minutes, so a busy hour costs two calls per dealer, not one per dealer per schedule.
5. **Live check before selling.** When a dealer orders a stone or asks for it on memo, the site checks that stone live and places a hold on it in RightClick before confirming. That, not the refresh interval, is what makes double selling impossible (B-01).
6. **Back off on errors.** A failed call waits and retries with growing gaps; an expired session is renewed once; if RightClick is unreachable the site keeps showing the last good data with its time, and the console shows the failure.
7. **Jobs are staggered.** Each job starts at its own offset in the minute, and the nightly reference tables run at 3 a.m. Eastern, so jobs do not pile into the same minute.

## The schedule

Recommended intervals, with calls per day. Dealer traffic is estimated for a 10 hour business day.

| Job | What | Every | Calls a run | Calls a day |
|---|---|---|---|---|
| Stock movements | Sales, memos out and back, new stock since the last run | 5 min | 1 | 288 |
| Stones, full list | Loose and certified diamonds on hand or on memo | 30 min | 2 | 96 |
| Jewelry on hand | Finished jewelry on hand or on memo | 1 hour | 1 | 24 |
| Open invoices | Every customer's open invoices | 15 min | 1 | 96 |
| Payments and credits posted | Receipts and credits finance posted since yesterday | 15 min | 1 | 96 |
| Open memo lines | Every open memo line with today's price (SQL export and its file) | 15 min | 2 | 192 |
| New customers | Customers added in RightClick since the last run | 1 hour | 1 | 24 |
| Reference tables and customer list | Shapes, colors, clarities, labs, metals, terms, ship via; the full customer list for changed details | nightly | 8 | 8 |
| Session renewal | When the stored session expires | about 2 hours | 1 | 12 |
| **Scheduled total** | | | | **836** |

| On demand | Estimate | Calls | Calls a day |
|---|---|---|---|
| Dealer opens Billing (balance and statement, cached 15 min) | 20 an hour | 2 | 400 |
| Stone ordered or requested on memo (live check and hold) | 10 an hour | 2 | 200 |
| Order placed (written into RightClick) | 5 an hour | 1 | 50 |
| **On demand total** | | | **650** |

About **1,486 calls a day**, an average of **1.7 calls a minute** in business hours against a limit of 30.

## Feasibility of refresh intervals (F-E5)

| Plan | Stock movements | Stones | Invoices, receipts | Memo | Calls a day | Busy-hour average | Feasible |
|---|---|---|---|---|---|---|---|
| Near real time | 1 min | 15 min | 5 min | 15 min | 3,214 | 2.9 a minute | Yes |
| **Recommended** | **5 min** | **30 min** | **15 min** | **15 min** | **1,486** | **1.7 a minute** | **Yes** |
| Light | 30 min | 4 hours | 1 hour | 4 hours | 792 | 1.2 a minute | Yes |
| Recommended, ten times the dealer traffic | 5 min | 30 min | 15 min | 15 min | 6,336 | 9.7 a minute | Yes |

What this shows:

- **Every interval down to one minute fits under the limit**, because the frequent calls are bulk calls. The ceiling only comes into play if the site called per stone or per customer on a schedule, which the plan never does.
- **The worst single minute** (every job due at once plus a minute of dealer traffic) is 20 calls; the queue spreads that over a minute. Staggering means it does not happen in practice.
- **Faster is not free for RightClick's server.** The full lists and the SQL export are the heavy calls; CFI asks for filtered, light queries. So the recommendation keeps the heavy ones at 15 to 30 minutes and lets the light "what moved" call run every 5 minutes. Going to 1 minute buys little: a stone sold in the showroom disappears from the site within 5 minutes either way, and the live check at checkout covers the gap.
- **Cost.** Each run is one short scheduled function on the host, under 700 runs a day at the recommended plan: negligible. If CFI charges per API call, the recommended plan is about 45,000 calls a month; the Light plan about 24,000.

## To confirm with CFI and Surreal

1. Whether CFI charges per call or per month, and whether downloading a SQL export file counts as a call.
2. The session lifetime on Surreal's server, and whether they will allow-list our fixed address.
3. That the stock movements call runs for all items over a date range (the reference shows the date parameters on their own) and includes memo returns and price changes, so the full stone list can stay at 30 minutes. If it needs an item, the plan swaps it for the full stone list every 10 minutes: 288 calls a day instead of 288 plus 96, still far under the limit.
4. An API user for the site with read access to stock, customers, invoices and memos, and write access to orders, memos and holds only (C-07).
5. The number of dealer accounts and a typical day's orders, to replace the traffic estimates above.
