"use client";

/**
 * Quick View for any list of store cards outside the store grid (the
 * product page's You may also like, Complete the look and Explore rails).
 * Pass the list the cards come from; hand `open` to each StoreCard as
 * onQuickView and render `drawer` once. Previous and next step through the
 * same list.
 */

import { useState } from "react";
import type { Product } from "@/content/catalog";
import { defaultSelection, type PieceSelection } from "@/components/shop/filters";
import QuickView from "./QuickView";

export function useQuickViewList(list: Product[]) {
  const [quick, setQuick] = useState<{ id: string; selection: PieceSelection | null; opening: number } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = (product: Product, selection: PieceSelection) => {
    setQuick((q) => ({ id: product.id, selection, opening: (q?.opening ?? 0) + 1 }));
    setIsOpen(true);
  };
  const position = quick ? list.findIndex((p) => p.id === quick.id) : -1;
  const step = (d: 1 | -1) => {
    const next = list[position + d];
    if (next) setQuick((q) => ({ id: next.id, selection: defaultSelection(next, null), opening: (q?.opening ?? 0) + 1 }));
  };

  const drawer = (
    <QuickView
      product={position >= 0 ? list[position] : null}
      selection={quick?.selection ?? null}
      opening={quick?.opening ?? 0}
      open={isOpen && position >= 0}
      position={position}
      total={list.length}
      onClose={() => setIsOpen(false)}
      onStep={step}
    />
  );

  return { open, drawer };
}
