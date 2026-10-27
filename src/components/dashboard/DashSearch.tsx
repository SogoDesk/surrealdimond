"use client";

/**
 * Search inside the dashboard (BRD R-29). Until Surreal's existing search is
 * connected (C-06), it looks through what the preview holds: the dashboard's
 * sections, the dealer's own orders, memo and program requests by number,
 * the catalog by name or style number, and the stone feed by stock ID. A
 * combobox: results drop down as the dealer types, grouped, with arrow keys
 * and Enter; Escape closes. With no match, Enter searches the site.
 */

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { dashSections } from "@/content/dashboard";
import { products, productHref, styleRef, categoryLabel } from "@/content/catalog";
import { stones, stoneTitle } from "@/content/diamonds";
import { account } from "@/content/site";
import { useOrders } from "@/lib/cart";
import { useMemos } from "@/lib/memo";
import { m2oSize, useCustomRequests, useM2ORequests } from "@/lib/requests";
import s from "./dashboard.module.css";

interface Hit {
  group: "Dashboard" | "Your orders and requests" | "Catalog" | "Stones";
  label: string;
  meta: string;
  href: string;
}

const MAX = 9;

export default function DashSearch() {
  const router = useRouter();
  const orders = useOrders();
  const memos = useMemos();
  const m2o = useM2ORequests();
  const custom = useCustomRequests();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const uid = useId();

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const has = (...v: (string | null | undefined)[]) => v.some((x) => x?.toLowerCase().includes(term));
    const out: Hit[] = [];
    dashSections.filter((d) => has(d.label, d.line)).forEach((d) => out.push({ group: "Dashboard", label: d.label, meta: d.line, href: d.href }));
    orders.filter((o) => has(o.number)).forEach((o) => out.push({ group: "Your orders and requests", label: o.number, meta: `Order, ${new Date(o.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, href: "/dashboard/orders" }));
    memos.filter((m) => has(m.number, m.stoneId)).forEach((m) => out.push({ group: "Your orders and requests", label: m.number, meta: `Memo, stock ${m.stoneId}`, href: "/dashboard/memo" }));
    m2o.filter((r) => has(r.number)).forEach((r) => out.push({ group: "Your orders and requests", label: r.number, meta: `Made to Order, ${m2oSize(r)}`, href: "/diamonds/made-to-order" }));
    custom.filter((r) => has(r.number)).forEach((r) => out.push({ group: "Your orders and requests", label: r.number, meta: `Custom, ${r.item}`, href: "/custom" }));
    products
      .filter((p) => has(p.name, styleRef(p), p.detail))
      .slice(0, 4)
      .forEach((p) => out.push({ group: "Catalog", label: p.name, meta: [styleRef(p), categoryLabel(p.category)].filter(Boolean).join(", "), href: productHref(p) }));
    stones
      .filter((st) => st.id.toLowerCase().includes(term))
      .slice(0, 3)
      .forEach((st) => out.push({ group: "Stones", label: st.id, meta: `${stoneTitle(st)}, ${st.color} ${st.clarity}`, href: `/diamonds?stone=${st.id}` }));
    return out.slice(0, MAX);
  }, [q, orders, memos, m2o, custom]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hits[active]) go(hits[active].href);
      else if (q.trim()) go(`${account.search}?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const show = open && q.trim().length >= 2;

  return (
    <div className={s.search} role="search">
      <label htmlFor={`${uid}-q`} className={s.srOnly}>
        Search your dashboard, orders, pieces and stones
      </label>
      <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className={s.searchIcon}>
        <circle cx="9" cy="9" r="5.5" />
        <path d="m13.5 13.5 3.5 3.5" />
      </svg>
      <input
        id={`${uid}-q`}
        className={s.searchInput}
        type="search"
        role="combobox"
        aria-expanded={show}
        aria-controls={`${uid}-list`}
        aria-autocomplete="list"
        aria-activedescendant={show && hits[active] ? `${uid}-h${active}` : undefined}
        placeholder="Search orders, memo, pieces, stock IDs"
        value={q}
        autoComplete="off"
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKey}
      />
      {show && (
        <ul id={`${uid}-list`} role="listbox" className={s.results}>
          {hits.length === 0 ? (
            <li className={s.noHit} role="presentation">
              Nothing here matches. Press Enter to search the site.
            </li>
          ) : (
            hits.map((h, i) => {
              const head = i === 0 || hits[i - 1].group !== h.group ? h.group : null;
              return (
                <li key={`${h.group}-${h.label}-${i}`} role="presentation">
                  {head && <span className={s.hitGroup}>{head}</span>}
                  <div
                    id={`${uid}-h${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={s.hit}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(h.href);
                    }}
                    onMouseEnter={() => setActive(i)}
                  >
                    <strong>{h.label}</strong>
                    <span>{h.meta}</span>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
