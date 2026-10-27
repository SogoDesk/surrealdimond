"use client";

/**
 * Console overview: the business at a glance.
 *
 * - Headline figures: stones in stock, receivables and what is past due,
 *   dealer logins, orders placed on the site, open program requests.
 * - Stones in stock by shape and by carat, from the stone feed less what is
 *   on order or memo (the sample feed until RightClick, C-07).
 * - Receivables by age across every dealer account, with the accounts
 *   carrying the most past due (the sample ledgers dealers see on their
 *   dashboard, until RightClick's customer transactions).
 * - Dealer logins by status (imported, setup link sent, active) and the
 *   catalog by category.
 * - The latest activity: orders, memo requests and reconciliations, M2O
 *   and Custom requests (this browser's, until the database holds every
 *   dealer's).
 *
 * Finance sees receivables; every role sees the rest of the page.
 */

import Link from "next/link";
import { useMemo } from "react";
import ShapeIcon from "@/components/brand/ShapeIcon";
import { categories, products } from "@/content/catalog";
import { ROLE_LABEL } from "@/content/admin";
import { SHAPES, SHAPE_LABEL, stones } from "@/content/diamonds";
import { useOrders } from "@/lib/cart";
import { useCustomers } from "@/lib/customers";
import { AGING_LABEL, AGING_ORDER, formatMoney, sampleReceivables } from "@/lib/invoices";
import { useMemoReports, useMemos, useUnavailable } from "@/lib/memo";
import { m2oSize, useCustomRequests, useM2ORequests } from "@/lib/requests";
import { useStaff } from "@/lib/staff";
import { useNow } from "@/lib/useNow";
import { BarList, ChartCard, ShareBar, type BarRow } from "./OverviewCharts";
import s from "./admin.module.css";

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** $18,696 to $18.7K, for headline figures. */
const compactMoney = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `$${(n / 1e3).toFixed(1)}K` : formatMoney(n).replace(/\.00$/, ""));

const CARAT_BANDS: [string, number, number][] = [
  ["0.5 to 1 ct", 0.5, 1],
  ["1 to 2 ct", 1, 2],
  ["2 to 3 ct", 2, 3],
  ["3 to 5 ct", 3, 5],
  ["5 to 8 ct", 5, 8],
  ["8 ct and up", 8, 99],
];

/** Aging on an ordered ramp: current in neutral grey, then light to dark as invoices age. */
const AGING_TONE: Record<string, string> = { current: "neutral", d30: "age1", d60: "age2", d90: "age3", d90plus: "age4" };

export default function AdminOverview() {
  const staff = useStaff();
  const orders = useOrders();
  const memos = useMemos();
  const reports = useMemoReports();
  const m2o = useM2ORequests();
  const custom = useCustomRequests();
  const gone = useUnavailable();
  const customers = useCustomers();
  const now = useNow();

  const inStock = useMemo(() => stones.filter((st) => !gone.has(st.id)), [gone]);

  const byShape: BarRow[] = useMemo(
    () =>
      SHAPES.map((sh) => ({ key: sh, label: SHAPE_LABEL[sh], value: inStock.filter((st) => st.shape === sh).length, icon: <ShapeIcon shape={sh} className={s.barIcon} /> })).sort((a, b) => b.value - a.value),
    [inStock],
  );
  const byCarat: BarRow[] = useMemo(() => CARAT_BANDS.map(([label, lo, hi]) => ({ key: label, label, value: inStock.filter((st) => st.carat >= lo && st.carat < hi).length })), [inStock]);
  const byCategory: BarRow[] = useMemo(() => categories.map((c) => ({ key: c.id, label: c.label, value: products.filter((p) => p.category === c.id).length })).sort((a, b) => b.value - a.value), []);

  // One row per dealer account: the owner's login where there is one.
  const receivables = useMemo(() => {
    if (!now) return [];
    const seen = new Map<string, { email: string; company: string; account: string }>();
    customers
      .filter((c) => c.account)
      .sort((a, b) => (a.role === b.role ? 0 : a.role === "owner" ? -1 : 1))
      .forEach((c) => {
        if (!seen.has(c.account)) seen.set(c.account, { email: c.email, company: c.company, account: c.account });
      });
    return sampleReceivables([...seen.values()], now);
  }, [customers, now]);

  if (!staff) return null;

  const totalBalance = receivables.reduce((n, r) => n + r.balance, 0);
  const totalPastDue = receivables.reduce((n, r) => n + r.pastDue, 0);
  const aging = AGING_ORDER.map((b) => ({ key: b, label: AGING_LABEL[b], value: receivables.reduce((n, r) => n + r.aging[b], 0), tone: AGING_TONE[b] }));
  const worst = [...receivables].filter((r) => r.pastDue > 0).sort((a, b) => b.pastDue - a.pastDue).slice(0, 4);
  const seesBilling = staff.role !== "hr";

  const logins = [
    { key: "not-invited", label: "Imported, not invited", value: customers.filter((c) => c.status === "not-invited").length, tone: "step1" },
    { key: "invited", label: "Setup link sent", value: customers.filter((c) => c.status === "invited").length, tone: "step2" },
    { key: "active", label: "Active", value: customers.filter((c) => c.status === "active").length, tone: "step3" },
  ];
  const active = logins[2].value;

  const activity = [
    ...orders.map((o) => ({ at: o.placedAt, what: `Order ${o.number}`, detail: `${o.details.store}, ${o.lines.length} lines` })),
    ...memos.map((m) => ({ at: m.requestedAt, what: `Memo request ${m.number}`, detail: `Stock ${m.stoneId}` })),
    ...reports.map((r) => ({ at: r.sentAt, what: `Memo reconciliation ${r.number}`, detail: `${r.sold.length} sold${r.confirmed ? ", list confirmed" : ""}${r.note ? ", with a note" : ""}` })),
    ...m2o.map((r) => ({ at: r.sentAt, what: `M2O request ${r.number}`, detail: `${m2oSize(r)} ${r.shape}` })),
    ...custom.map((r) => ({ at: r.sentAt, what: `Custom request ${r.number}`, detail: `${r.item}, ${r.carat} ${r.shape}` })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  const stats: [string, string, string][] = [
    ["Stones in stock", inStock.length.toLocaleString("en-US"), `${gone.size} on order or memo · sample feed`],
    ...(seesBilling
      ? ([
          ["Receivables", compactMoney(totalBalance), `${receivables.length} dealer accounts · sample`],
          ["Past due", compactMoney(totalPastDue), `${totalBalance > 0 ? Math.round((totalPastDue / totalBalance) * 100) : 0}% of receivables`],
        ] as [string, string, string][])
      : []),
    ["Active logins", `${active} of ${customers.length}`, `${logins[0].value + logins[1].value} waiting on setup`],
    ["Orders on the site", orders.length.toLocaleString("en-US"), "Placed in this browser"],
    ["Open requests", (m2o.length + custom.length).toLocaleString("en-US"), `${m2o.length} M2O · ${custom.length} Custom`],
  ];

  return (
    <div className={s.page}>
      <header className={s.pageHead}>
        <div>
          <p className={s.kicker}>{ROLE_LABEL[staff.role]}</p>
          <h1 className={s.pageTitle}>Console overview</h1>
          <p className={s.pageLine}>Stock, receivables and dealer activity at a glance. Stones and invoices are sample data until RightClick is connected.</p>
        </div>
      </header>

      <dl className={stats.length === 4 ? `${s.stats} ${s.statsFour}` : s.stats}>
        {stats.map(([k, v, line]) => (
          <div key={k} className={s.stat}>
            <dt>{k}</dt>
            <dd className={s.statFigure}>{v}</dd>
            <span>{line}</span>
          </div>
        ))}
      </dl>

      <div className={s.vizGrid}>
        <BarList id="by-shape" title="Stones in stock by shape" line={`${inStock.length} stones, largest share first`} dimension="Shape" rows={byShape} unit="stones" />

        {seesBilling ? (
          <ChartCard
            id="aging"
            title="Receivables by age"
            line={`${formatMoney(totalBalance)} open across ${receivables.length} accounts · sample ledgers`}
            tools={
              <Link href="/admin/dealers" className={s.textBtn}>
                Dealers
              </Link>
            }
          >
            <ShareBar label="Receivables by age" segments={aging} format={(v) => formatMoney(v)} />
            {worst.length > 0 && (
              <div className={s.tableWrapPlain}>
                <table className={s.vizTable}>
                  <caption className={s.vizCaption}>Most past due</caption>
                  <thead>
                    <tr>
                      <th scope="col">Account</th>
                      <th scope="col">Past due</th>
                      <th scope="col">Oldest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {worst.map((r) => (
                      <tr key={r.account}>
                        <th scope="row">
                          {r.company}
                          <span className={s.muted}> · {r.account}</span>
                        </th>
                        <td>{formatMoney(r.pastDue)}</td>
                        <td>{r.oldest} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        ) : (
          <BarList id="by-category-hr" title="Catalog by category" line={`${products.length} pieces`} dimension="Category" rows={byCategory} unit="pieces" />
        )}

        <BarList id="by-carat" title="Stones in stock by carat" line="In size order" dimension="Carat" rows={byCarat} unit="stones" />

        <ChartCard
          id="logins"
          title="Dealer logins"
          line={`${customers.length} logins across ${new Set(customers.map((c) => c.account || c.company)).size} stores`}
          tools={
            <Link href="/admin/dealers" className={s.textBtn}>
              Import or invite
            </Link>
          }
        >
          <ShareBar label="Dealer logins by status" segments={logins} unit="logins" />
        </ChartCard>

        {seesBilling && <BarList id="by-category" title="Catalog by category" line={`${products.length} pieces`} dimension="Category" rows={byCategory} unit="pieces" />}

        <section className={s.card} aria-labelledby="activity-title">
          <h2 id="activity-title" className={s.cardTitle}>
            Latest activity
          </h2>
          {activity.length === 0 ? (
            <p className={s.muted}>Orders, memo requests, reconciliations and program requests appear here as dealers send them.</p>
          ) : (
            <ul className={s.activity}>
              {activity.map((a, i) => (
                <li key={`${a.what}-${i}`}>
                  <span>
                    <strong>{a.what}</strong>
                    {a.detail}
                  </span>
                  <time dateTime={a.at}>{when(a.at)}</time>
                </li>
              ))}
            </ul>
          )}
          <p className={s.muted}>Preview: activity from this browser. The database brings in every dealer&apos;s.</p>
        </section>
      </div>
    </div>
  );
}
