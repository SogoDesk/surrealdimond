"use client";

/**
 * Filter chip groups shared by the toolbar (desktop) and the filter sheet
 * (mobile). Each chip is a toggle button with aria-pressed; chips within a
 * group are OR, groups are AND. Metal chips carry the metal's swatch dot.
 */

import { metals, shapes, type Metal, type Shape } from "@/content/catalog";
import { toggleIn, type ShopQuery } from "./filters";
import s from "./shop.module.css";

export interface FilterChipsProps {
  query: ShopQuery;
  showShapes: boolean;
  onChange: (next: ShopQuery) => void;
  /** Group label placement: inline before the chips (toolbar) or stacked above (sheet). */
  layout?: "inline" | "stacked";
  groupClassName?: string;
  chipsClassName?: string;
}

export default function FilterChips({ query, showShapes, onChange, layout = "inline", groupClassName = "", chipsClassName = "" }: FilterChipsProps) {
  const toggleMetal = (id: Metal) => onChange({ ...query, metals: toggleIn(query.metals, id) });
  const toggleShape = (id: Shape) => onChange({ ...query, shapes: toggleIn(query.shapes, id) });
  const stacked = layout === "stacked";

  const metalChips = metals.map((m) => {
    const active = query.metals.includes(m.id);
    return (
      <button key={m.id} type="button" className={s.chip} aria-pressed={active} onClick={() => toggleMetal(m.id)} data-cursor="link">
        <span aria-hidden className={s.chipSwatch} style={{ background: m.swatch }} />
        {m.label}
      </button>
    );
  });

  const shapeChips = shapes.map((sh) => {
    const active = query.shapes.includes(sh.id);
    return (
      <button key={sh.id} type="button" className={s.chip} aria-pressed={active} onClick={() => toggleShape(sh.id)} data-cursor="link">
        {sh.label}
      </button>
    );
  });

  return (
    <>
      <div className={`${stacked ? "" : s.group} ${groupClassName}`} role="group" aria-label="Metal">
        <span className={s.groupLabel}>Metal</span>
        {stacked ? <div className={chipsClassName}>{metalChips}</div> : metalChips}
      </div>
      {showShapes && (
        <div className={`${stacked ? "" : s.group} ${groupClassName}`} role="group" aria-label="Shape">
          <span className={s.groupLabel}>Shape</span>
          {stacked ? <div className={chipsClassName}>{shapeChips}</div> : shapeChips}
        </div>
      )}
    </>
  );
}
