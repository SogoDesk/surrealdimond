"use client";

/**
 * "Find your match, faster": the inline panel Tanishq drops into its grid,
 * set in the Surreal system. Tabs for Metal, Center stone (where pieces carry
 * one) and Category; each tab holds single select chips, and Apply writes the
 * picks to the query (or opens the chosen category). Picks start from the
 * current query.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { metals, shapes, type Category, type Metal, type Shape } from "@/content/catalog";
import { divisionTypes } from "@/content/divisions";
import type { ShopQuery } from "@/components/shop/filters";
import s from "./store.module.css";

type Tab = "metal" | "shape" | "category";

export default function MatchPanel({ category, query, showShapes, onApply }: { category: Category | null; query: ShopQuery; showShapes: boolean; onApply: (q: ShopQuery) => void }) {
  const router = useRouter();
  const tabs: { id: Tab; label: string }[] = [
    { id: "metal", label: "Metal" },
    ...(showShapes ? [{ id: "shape" as Tab, label: "Center stone" }] : []),
    { id: "category", label: "Category" },
  ];
  const [tab, setTab] = useState<Tab>("metal");
  const [metal, setMetal] = useState<Metal | null>(query.metal);
  const [shape, setShape] = useState<Shape | null>(query.shape);
  const [division, setDivision] = useState<string | null>(null);

  const apply = () => {
    if (division && division !== category) {
      const target = divisionTypes.find((d) => d.id === division);
      const qs = new URLSearchParams();
      if (metal) qs.set("metal", metal);
      if (target) router.push(`${target.href}${qs.toString() ? `?${qs}` : ""}`);
      return;
    }
    onApply({ ...query, metal, shape: showShapes ? shape : null });
  };

  return (
    <div className={s.match}>
      <div className={s.matchHead}>
        <p className={s.matchTitle}>
          Find your match, <em>faster</em>
        </p>
        <div className={s.matchTabs} role="tablist" aria-label="Refine by">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={s.matchTab} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className={s.matchBody} role="tabpanel">
        <div className={s.matchChips}>
          {tab === "metal" &&
            metals.map((m) => (
              <button key={m.id} type="button" className={s.matchChip} aria-pressed={metal === m.id} onClick={() => setMetal(metal === m.id ? null : m.id)}>
                <span className={s.pillSwatch} style={{ background: m.swatch }} aria-hidden />
                {m.label}
              </button>
            ))}
          {tab === "shape" &&
            shapes.map((x) => (
              <button key={x.id} type="button" className={s.matchChip} aria-pressed={shape === x.id} onClick={() => setShape(shape === x.id ? null : x.id)}>
                {x.label}
              </button>
            ))}
          {tab === "category" &&
            divisionTypes
              .filter((d) => !d.pending)
              .map((d) => (
                <button key={d.id} type="button" className={s.matchChip} aria-pressed={(division ?? category) === d.id} onClick={() => setDivision(division === d.id ? null : d.id)}>
                  {d.label}
                </button>
              ))}
        </div>
        <button type="button" className={s.matchApply} onClick={apply}>
          Apply
          <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
