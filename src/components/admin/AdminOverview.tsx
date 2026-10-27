"use client";

/**
 * Console overview: the catalog and stone counts, what the storefront is
 * showing (Hot this week, banners on, pages with featured pieces), and the
 * latest activity from the preview (orders, memo requests and
 * reconciliations, M2O and Custom requests), then the modules open to the
 * signed-in role. Activity reads this browser's stores until the database
 * holds every dealer's.
 */

import Link from "next/link";
import { products } from "@/content/catalog";
import { adminModules } from "@/content/admin";
import { stones } from "@/content/diamonds";
import { useOrders } from "@/lib/cart";
import { useMerch } from "@/lib/merch";
import { useMemoReports, useMemos, useUnavailable } from "@/lib/memo";
import { m2oSize, useCustomRequests, useM2ORequests } from "@/lib/requests";
import { useStaff } from "@/lib/staff";
import { ROLE_LABEL } from "@/content/admin";
import AdminIcon from "./AdminIcon";
import s from "./admin.module.css";

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function AdminOverview() {
  const staff = useStaff();
  const merch = useMerch();
  const orders = useOrders();
  const memos = useMemos();
  const reports = useMemoReports();
  const m2o = useM2ORequests();
  const custom = useCustomRequests();
  const gone = useUnavailable();
  if (!staff) return null;

  const activity = [
    ...orders.map((o) => ({ at: o.placedAt, what: `Order ${o.number}`, detail: `${o.details.store}, ${o.lines.length} lines`, href: "/admin/orders" })),
    ...memos.map((m) => ({ at: m.requestedAt, what: `Memo request ${m.number}`, detail: `Stock ${m.stoneId}`, href: "/admin/memo" })),
    ...reports.map((r) => ({ at: r.sentAt, what: `Memo reconciliation ${r.number}`, detail: `${r.sold.length} sold${r.confirmed ? ", list confirmed" : ""}${r.note ? ", with a note" : ""}`, href: "/admin/memo" })),
    ...m2o.map((r) => ({ at: r.sentAt, what: `M2O request ${r.number}`, detail: `${m2oSize(r)} ${r.shape}`, href: "/admin/requests" })),
    ...custom.map((r) => ({ at: r.sentAt, what: `Custom request ${r.number}`, detail: `${r.item}, ${r.carat} ${r.shape}`, href: "/admin/requests" })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  const pinnedPages = Object.values(merch.pins).filter((l) => l.length).length;
  const stats: [string, string | number, string][] = [
    ["Jewelry pieces", products.length, "In the catalog"],
    ["Stones available", stones.length - gone.size, `${gone.size} on order or memo, sample feed`],
    ["Hot this week", merch.hot.length, "Pieces on the homepage"],
    ["Banners on", merch.banners.filter((b) => b.active).length, `Of ${merch.banners.length} hero slides`],
    ["Pages with featured pieces", pinnedPages, "Pinned to the top"],
    ["Open requests", m2o.length + custom.length, "M2O and Custom"],
  ];

  return (
    <div className={s.page}>
      <header className={s.pageHead}>
        <div>
          <p className={s.kicker}>{ROLE_LABEL[staff.role]}</p>
          <h1 className={s.pageTitle}>Console overview</h1>
        </div>
      </header>

      <dl className={s.stats}>
        {stats.map(([k, v, line]) => (
          <div key={k} className={s.stat}>
            <dt>{k}</dt>
            <dd className="tabular">{v}</dd>
            <span>{line}</span>
          </div>
        ))}
      </dl>

      <div className={s.twoCol}>
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

        <section className={s.card} aria-labelledby="modules-title">
          <h2 id="modules-title" className={s.cardTitle}>
            Your modules
          </h2>
          <ul className={s.moduleList}>
            {adminModules
              .filter((m) => m.id !== "overview" && m.access[staff.role] !== "none")
              .map((m) => (
                <li key={m.id}>
                  <Link href={m.href} className={s.moduleLink}>
                    <AdminIcon id={m.icon} className={s.moduleIcon} />
                    <span>
                      <strong>{m.label}</strong>
                      {m.line}
                    </span>
                    <span className={s.accessChip} data-access={m.access[staff.role]}>
                      {m.status === "design" ? "Soon" : m.access[staff.role] === "edit" ? "Edit" : "View"}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
