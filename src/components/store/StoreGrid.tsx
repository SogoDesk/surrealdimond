"use client";

/**
 * The store grid. Columns come from the density (4, 5 or 6) capped by the
 * viewport in CSS; the grid reads its own live column count so the inserts
 * land on row boundaries: the "find your match" panel spans the row after
 * the second row of cards, and a Made to Order tile two columns wide sits
 * after the fourth. Pages are six full rows; Load more adds six more, with
 * a progress bar and "Showing x of y" above it (the Tanishq pattern). An
 * empty result offers Clear filters.
 */

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import type { Category, Product } from "@/content/catalog";
import type { ShopQuery } from "@/components/shop/filters";
import StoreCard from "./StoreCard";
import MatchPanel from "./MatchPanel";
import type { Density } from "./StoreToolbar";
import s from "./store.module.css";

const ROWS_PER_PAGE = 6;

export interface StoreGridProps {
  category: Category | null;
  matches: Product[];
  density: Density;
  query: ShopQuery;
  showShapes: boolean;
  onQueryChange: (next: ShopQuery) => void;
  onClear: () => void;
}

function PromoTile() {
  return (
    <li className={s.promo}>
      <Link href="/diamonds/made-to-order" className={s.promoLink}>
        <Image src="/media/photos/sb-3990-sm.webp" alt="" fill sizes="(min-width: 1280px) 40vw, 90vw" className={s.promoImage} />
        <span className={s.promoCopy}>
          <span className={s.promoEyebrow}>Made to Order (M2O)</span>
          <span className={s.promoTitle}>
            Any shape, <em>any carat weight</em>
          </span>
          <span className={s.promoLine}>A diamond grown to your client&apos;s exact specification, with an IGI certificate.</span>
          <span className={s.promoCta}>
            Start an M2O order
            <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function StoreGrid({ category, matches, density, query, showShapes, onQueryChange, onClear }: StoreGridProps) {
  const gridRef = useRef<HTMLUListElement>(null);
  const [cols, setCols] = useState<number>(density);
  const [pages, setPages] = useState(1);

  /* The live column count, read from the resolved grid template. */
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const read = () => {
      const n = getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean).length;
      if (n > 0) setCols(n);
    };
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [density]);

  const panelAt = cols * 2;
  const promoAt = cols * 4 - 2;
  // Pages are whole rows: the Made to Order tile takes two card slots once the list reaches it.
  const slots = cols * ROWS_PER_PAGE * pages;
  const promoOn = cols >= 3 && matches.length > promoAt;
  const shown = Math.min(matches.length, promoOn && slots > promoAt ? slots - 2 : slots);
  const visible = matches.slice(0, shown);

  if (matches.length === 0) {
    return (
      <div className={s.empty} role="status">
        <p className={s.emptyTitle}>Nothing matches these filters yet.</p>
        <p className={s.emptyLine}>Every piece can be made to order in another metal or size.</p>
        <button type="button" className={s.emptyBtn} onClick={onClear}>
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <>
      <ul ref={gridRef} className={s.grid} data-cols={density} style={{ "--cols": density } as CSSProperties} aria-label="Pieces">
        {visible.map((p, i) => (
          <Fragment key={p.id}>
            {i === panelAt && visible.length > panelAt && (
              <li className={s.panelRow}>
                <MatchPanel category={category} query={query} showShapes={showShapes} onApply={onQueryChange} />
              </li>
            )}
            {i === promoAt && promoOn && <PromoTile />}
            <li className={s.cell}>
              <StoreCard product={p} preferredMetal={query.metal} priority={i < cols} />
            </li>
          </Fragment>
        ))}
      </ul>

      <div className={s.more}>
        <span className={s.moreText}>
          Showing {shown} of {matches.length}
        </span>
        <span className={s.moreBar} aria-hidden>
          <span style={{ transform: `scaleX(${shown / matches.length})` }} />
        </span>
        {shown < matches.length && (
          <button type="button" className={s.moreBtn} onClick={() => setPages((n) => n + 1)}>
            Load more
          </button>
        )}
      </div>
    </>
  );
}
