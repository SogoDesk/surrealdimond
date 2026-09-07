"use client";

/**
 * Filter chip groups shared by the toolbar (desktop) and the filter sheet
 * (mobile). Each group is single select: a chip is a button with aria-pressed
 * that behaves like a radio, choosing it clears the group's other chip and
 * choosing the active chip clears the group. Groups are AND. Metal chips
 * carry the metal's swatch dot.
 */

import { metals, shapes, type Metal, type Shape } from "@/content/catalog";
import { toggleOne, type ShopQuery } from "./filters";
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
  const chooseMetal = (id: Metal) => onChange({ ...query, metal: toggleOne(query.metal, id) });
  const chooseShape = (id: Shape) => onChange({ ...query, shape: toggleOne(query.shape, id) });
  const stacked = layout === "stacked";

  const metalChips = metals.map((m) => (
    <button key={m.id} type="button" className={s.chip} aria-pressed={query.metal === m.id} onClick={() => chooseMetal(m.id)} data-cursor="link">
      <span aria-hidden className={s.chipSwatch} style={{ background: m.swatch }} />
      {m.label}
    </button>
  ));

  const shapeChips = shapes.map((sh) => (
    <button key={sh.id} type="button" className={s.chip} aria-pressed={query.shape === sh.id} onClick={() => chooseShape(sh.id)} data-cursor="link">
      {sh.label}
    </button>
  ));

  return (
    <>
      <div className={`${stacked ? "" : s.group} ${groupClassName}`} role="group" aria-label="Metal, choose one">
        <span className={s.groupLabel}>Metal</span>
        {stacked ? <div className={chipsClassName}>{metalChips}</div> : metalChips}
      </div>
      {showShapes && (
        <div className={`${stacked ? "" : s.group} ${groupClassName}`} role="group" aria-label="Shape, choose one">
          <span className={s.groupLabel}>Shape</span>
          {stacked ? <div className={chipsClassName}>{shapeChips}</div> : shapeChips}
        </div>
      )}
    </>
  );
}
