"use client";

/**
 * Merchandising (BRD R-03, R-33, R-34). Pick a page on the left: the
 * homepage's Hot this week, All jewelry, or one of the categories. For Hot
 * this week, set which pieces show and in what order. For a jewelry page,
 * set its default sort (customers can still re-sort) and the pieces featured
 * to its top, in order. Add pieces through the search picker; move them up
 * and down or take them off. Changes reach the storefront at once; Open the
 * page shows the result. Reset returns the page to its defaults.
 */

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SORTS, type Sort } from "@/components/shop/filters";
import { categories, categoryLabel, productById, products, renderSrc, styleRef, type Category, type Product } from "@/content/catalog";
import { hotThisWeek } from "@/content/featuring";
import { groundStyle } from "@/content/grounds";
import { move, pageSort, setMerch, useMerch } from "@/lib/merch";
import { useAdminAccess } from "./AdminShell";
import s from "./admin.module.css";

type PageId = "hot" | "all" | Category;
const PAGES: { id: PageId; label: string; line: string }[] = [
  { id: "hot", label: "Hot this week", line: "Homepage" },
  { id: "all", label: "All jewelry", line: "/jewelry" },
  ...categories.map((c) => ({ id: c.id as PageId, label: c.label, line: `/jewelry/${c.id}` })),
];

function Thumb({ p }: { p: Product }) {
  return (
    <span className={s.pieceThumb} style={groundStyle(p.category)}>
      <Image src={renderSrc(p.image)} alt="" width={120} height={120} sizes="44px" />
    </span>
  );
}

export default function AdminMerch() {
  const readOnly = useAdminAccess() !== "edit";
  const merch = useMerch();
  const [page, setPage] = useState<PageId>("hot");
  const [q, setQ] = useState("");

  const isHot = page === "hot";
  const list = useMemo(() => (isHot ? merch.hot : merch.pins[page] ?? []), [isHot, merch, page]);
  const items = list.map((id) => productById(id)).filter((p): p is Product => Boolean(p));
  const pool = isHot || page === "all" ? products : products.filter((p) => p.category === page);
  const picks = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    return pool.filter((p) => !list.includes(p.id) && [p.name, p.detail, styleRef(p) ?? ""].join(" ").toLowerCase().includes(term)).slice(0, 6);
  }, [q, pool, list]);

  const write = (next: string[]) => setMerch((m) => (isHot ? { ...m, hot: next } : { ...m, pins: { ...m.pins, [page]: next } }));
  const setSort = (sort: Sort) =>
    setMerch((m) => {
      const sorts = { ...m.sorts };
      if (sort === "featured") delete sorts[page];
      else sorts[page] = sort;
      return { ...m, sorts };
    });
  const reset = () =>
    setMerch((m) => {
      if (isHot) return { ...m, hot: hotThisWeek };
      const pins = { ...m.pins };
      const sorts = { ...m.sorts };
      delete pins[page];
      delete sorts[page];
      return { ...m, pins, sorts };
    });

  const current = PAGES.find((p) => p.id === page)!;
  const href = isHot ? "/#featured" : page === "all" ? "/jewelry" : `/jewelry/${page}`;

  return (
    <div className={s.page}>
      <header className={s.pageHead}>
        <div>
          <p className={s.kicker}>Merchandising</p>
          <h1 className={s.pageTitle}>What leads each page</h1>
          <p className={s.pageLine}>Hot this week on the homepage, the pieces featured to the top of each jewelry page, and each page&apos;s default sort.</p>
        </div>
      </header>

      <div className={s.merch}>
        <nav className={s.pageList} aria-label="Pages">
          {PAGES.map((p) => {
            const count = p.id === "hot" ? merch.hot.length : (merch.pins[p.id] ?? []).length;
            const sorted = p.id !== "hot" && merch.sorts[p.id];
            return (
              <button key={p.id} type="button" className={s.pageBtn} aria-current={page === p.id ? "true" : undefined} onClick={() => { setPage(p.id); setQ(""); }}>
                <span>
                  <strong>{p.label}</strong>
                  {p.line}
                </span>
                <span className={s.pageMeta}>
                  {count > 0 && <span className={s.countChip}>{count}</span>}
                  {sorted && <span className={s.countChip}>Sort</span>}
                </span>
              </button>
            );
          })}
        </nav>

        <section className={s.card} aria-labelledby="merch-page-title">
          <div className={s.cardHead}>
            <div>
              <h2 id="merch-page-title" className={s.cardTitle}>
                {current.label}
              </h2>
              <p className={s.muted}>{isHot ? "Shown on the homepage in this order." : "Featured pieces lead the page in this order when it shows its default sort."}</p>
            </div>
            <span className={s.cardTools}>
              <Link href={href} className={s.textBtn} target="_blank" rel="noreferrer">
                Open the page
              </Link>
              <button type="button" className={s.textBtn} onClick={reset} disabled={readOnly}>
                Reset
              </button>
            </span>
          </div>

          {!isHot && (
            <label className={s.field}>
              <span className={s.label}>Default sort</span>
              <select className={s.select} value={pageSort(merch, page)} onChange={(e) => setSort(e.target.value as Sort)} disabled={readOnly}>
                {SORTS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className={s.muted}>Customers can still choose another sort on the page.</span>
            </label>
          )}

          <div className={s.field}>
            <span className={s.label}>{isHot ? "Pieces" : "Featured to the top"}</span>
            {items.length === 0 ? (
              <p className={s.emptyRow}>{isHot ? "No pieces. The homepage hides Hot this week until you add some." : "None yet. The page opens in its default order."}</p>
            ) : (
              <ol className={s.orderList}>
                {items.map((p, i) => (
                  <li key={p.id}>
                    <span className={s.orderIndex}>{i + 1}</span>
                    <Thumb p={p} />
                    <span className={s.orderText}>
                      <strong>{p.name}</strong>
                      {categoryLabel(p.category)}
                      {styleRef(p) ? `, ${styleRef(p)}` : ""}
                    </span>
                    <span className={s.orderTools}>
                      <button type="button" className={s.iconBtn} onClick={() => write(move(list, i, -1))} disabled={readOnly || i === 0} aria-label={`Move ${p.name} up`}>
                        <svg aria-hidden viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                          <path d="M2 7.5l4-4 4 4" />
                        </svg>
                      </button>
                      <button type="button" className={s.iconBtn} onClick={() => write(move(list, i, 1))} disabled={readOnly || i === items.length - 1} aria-label={`Move ${p.name} down`}>
                        <svg aria-hidden viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                          <path d="M2 4.5l4 4 4-4" />
                        </svg>
                      </button>
                      <button type="button" className={s.iconBtn} onClick={() => write(list.filter((x) => x !== p.id))} disabled={readOnly} aria-label={`Remove ${p.name}`}>
                        <svg aria-hidden viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                        </svg>
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {!readOnly && (
            <div className={s.field}>
              <label className={s.label} htmlFor="merch-add">
                Add a piece
              </label>
              <input id="merch-add" type="search" className={s.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={isHot || page === "all" ? "Search the catalog" : `Search ${current.label.toLowerCase()}`} />
              {q.trim().length >= 2 && (
                <ul className={s.picks}>
                  {picks.length === 0 ? (
                    <li className={s.muted}>No other pieces match.</li>
                  ) : (
                    picks.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={s.pick}
                          onClick={() => {
                            write([...list, p.id]);
                            setQ("");
                          }}
                        >
                          <Thumb p={p} />
                          <span className={s.orderText}>
                            <strong>{p.name}</strong>
                            {categoryLabel(p.category)}
                          </span>
                          <span className={s.addChip}>Add</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
