"use client";

/**
 * Mobile filter sheet: a paper panel rising from the bottom with the chip
 * groups stacked, a Clear link and an Apply primary pill. Same mechanics as
 * the contact drawer (backdrop, focus trap, Escape, scroll lock) through
 * useDrawer. Edits are held in a draft and reach the URL only on Apply.
 */

import { useId, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { hasFilters, type ShopQuery } from "./filters";
import FilterChips from "./FilterChips";
import { useDrawer } from "./useDrawer";
import d from "./drawers.module.css";
import s from "./shop.module.css";

export interface FilterSheetProps {
  open: boolean;
  query: ShopQuery;
  showShapes: boolean;
  onApply: (next: ShopQuery) => void;
  onClose: () => void;
}

export default function FilterSheet({ open, query, showShapes, onApply, onClose }: FilterSheetProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [draft, setDraft] = useState(query);

  // Each opening starts from the live query (adjusted during render, no effect needed).
  const [seenOpen, setSeenOpen] = useState(open);
  if (seenOpen !== open) {
    setSeenOpen(open);
    if (open) setDraft(query);
  }

  const { onKeyDown } = useDrawer({ open, onClose, rootRef, panelRef, backdropRef, axis: "y" });

  const apply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <div ref={rootRef} className={d.root} onKeyDown={onKeyDown} inert={!open} data-filter-sheet>
      <button ref={backdropRef} type="button" className={d.backdrop} aria-label="Close" onClick={onClose} tabIndex={-1} />
      <div ref={panelRef} className={d.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId} data-theme="light" data-lenis-prevent tabIndex={-1}>
        <div className={d.sheetHead}>
          <h2 id={titleId} className={d.sheetTitle}>
            Filter
          </h2>
          <button type="button" className={`${d.iconBtn} ${d.close}`} onClick={onClose} aria-label="Close" data-cursor="link">
            <svg aria-hidden viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M3 3l14 14M17 3L3 17" />
            </svg>
          </button>
        </div>

        <div className={d.sheetGroups}>
          <FilterChips query={draft} showShapes={showShapes} onChange={setDraft} layout="stacked" groupClassName={d.sheetGroup} chipsClassName={d.sheetChips} />
        </div>

        <div className={d.sheetActions}>
          <Button variant="primary" onClick={apply} arrow>
            Apply
          </Button>
          {hasFilters(draft) && (
            <button type="button" className={s.clear} onClick={() => setDraft({ ...draft, metals: [], shapes: [] })} data-cursor="link">
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
