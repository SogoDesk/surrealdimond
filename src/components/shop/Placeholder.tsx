"use client";

/**
 * Stands in for a render the library does not have yet: on the same paper
 * ground, a small hairline plan-view brilliant in ink at 40 percent, then
 * "Made to order in rose gold, 2 ct." in Cormorant and a Jost note that a
 * render follows on enquiry. The card uses the 22px size, the quick view
 * stage the 28px one.
 */

import { BrilliantPlan } from "@/components/sections/CollectionsPanels";
import { formatCarat, metals, type Metal } from "@/content/catalog";
import s from "./shop.module.css";

export interface PlaceholderProps {
  metal: Metal;
  carat: number;
  size?: "card" | "stage";
  className?: string;
}

export default function Placeholder({ metal, carat, size = "card", className = "" }: PlaceholderProps) {
  const label = (metals.find((m) => m.id === metal)?.label ?? metal).toLowerCase();
  return (
    <span className={`${s.placeholder} ${size === "stage" ? s.placeholderStage : ""} ${className}`} data-placeholder>
      <span className={s.placeholderMark} aria-hidden>
        <BrilliantPlan />
      </span>
      <span className={s.placeholderLine}>
        Made to order in {label}, {formatCarat(carat)}.
      </span>
      <span className={s.placeholderNote}>No render yet. Enquire and we will send one.</span>
    </span>
  );
}
