"use client";

/**
 * The store grid. Columns come from the density (4, 5 or 6) capped by the
 * viewport in CSS; the grid reads its live column count and lays the list
 * out row by row in a six row rhythm, so image tiles land on row edges:
 *
 *   row 1  cards
 *   row 2  cards and a campaign photo at the end, then (first page only)
 *          the "find your match" panel
 *   row 3  a wide campaign photo, then cards
 *   row 4  cards, then the Made to Order tile (first page) or a photo
 *   row 5  a campaign photo, then cards
 *   row 6  cards, then a wide campaign photo
 *
 * Photos come from the category's campaign set (content/editorial.ts), or
 * from each category in turn on the all-jewelry page, and link to their
 * category. Load more adds six rows (twelve on phones, where two columns
 * carry fewer photos). An empty result offers Clear filters.
 *
 * Clicking a card opens Quick View (QuickView.tsx) on that piece, starting
 * from the card's metal and carat; its previous and next step through the
 * current results, and View full details opens the product page.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { categoryLabel, type Category, type Product } from "@/content/catalog";
import { editorial, editorialOrder, type Editorial } from "@/content/editorial";
import { defaultSelection, type PieceSelection, type ShopQuery } from "@/components/shop/filters";
import StoreCard from "./StoreCard";
import QuickView from "./QuickView";
import MatchPanel from "./MatchPanel";
import type { Density } from "./StoreToolbar";
import s from "./store.module.css";

const ROWS_PER_PAGE = 6;

type Slot =
  | { kind: "card"; product: Product; index: number }
  | { kind: "photo"; photo: Editorial; category: Category; span: 1 | 2; key: string }
  | { kind: "panel" }
  | { kind: "promo" };

export interface StoreGridProps {
  category: Category | null;
  matches: Product[];
  density: Density;
  query: ShopQuery;
  showShapes: boolean;
  onQueryChange: (next: ShopQuery) => void;
  onClear: () => void;
}

/** A photo supplier that walks the category's set, or every category in turn. */
function photoSource(category: Category | null) {
  let single = 0;
  let wide = 0;
  let turn = 0;
  return (span: 1 | 2): { photo: Editorial; category: Category } => {
    const cat = category ?? editorialOrder[turn++ % editorialOrder.length];
    const set = editorial[cat];
    const list = span === 2 && set.wide.length ? set.wide : set.single;
    const n = span === 2 ? wide++ : single++;
    return { photo: list[n % list.length], category: cat };
  };
}

function layout(matches: Product[], cols: number, rows: number, category: Category | null): { slots: Slot[]; placed: number } {
  const slots: Slot[] = [];
  const pick = photoSource(category);
  let i = 0;
  for (let r = 0; r < rows && i < matches.length; r++) {
    const k = r % ROWS_PER_PAGE;
    const firstPage = r < ROWS_PER_PAGE;
    let free = cols;
    const lead: Slot[] = [];
    const tail: Slot[] = [];
    const left = () => matches.length - i;
    // A leading image needs cards after it; a trailing one needs enough cards to fill the row before it. The grid never ends on an image.
    const photo = (span: 1 | 2, at: "lead" | "tail") => {
      if (free < span || (span === free && at === "tail")) return false;
      if (at === "lead" ? left() < 1 : left() < free - span) return false;
      const p = pick(span);
      (at === "lead" ? lead : tail).push({ kind: "photo", photo: p.photo, category: p.category, span, key: `photo-${r}-${span}` });
      free -= span;
      return true;
    };
    if (cols <= 2) {
      // Phones: two columns leave little room, so one photo in every six rows and a full width one in the next six.
      if (r % 12 === 3) photo(1, "lead");
      if (r % 12 === 9) photo(2, "lead");
    } else {
      if (k === 1) photo(1, "tail");
      if (k === 2) photo(2, "lead");
      if (k === 3) {
        if (firstPage && left() >= free - 2) {
          tail.push({ kind: "promo" });
          free -= 2;
        } else photo(1, "tail");
      }
      if (k === 4) photo(1, "lead");
      if (k === 5) photo(2, "tail");
    }
    slots.push(...lead);
    for (let c = 0; c < free && i < matches.length; c++, i++) slots.push({ kind: "card", product: matches[i], index: i });
    slots.push(...tail);
    if (k === 1 && firstPage && i < matches.length) slots.push({ kind: "panel" });
  }
  return { slots, placed: i };
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

function PhotoTile({ photo, category, span }: { photo: Editorial; category: Category; span: 1 | 2 }) {
  return (
    <li className={s.photoCell} data-span={span}>
      <Link href={`/jewelry/${category}`} className={s.photoLink}>
        <Image src={photo.src} alt={photo.alt} fill sizes={span === 2 ? "(min-width: 1280px) 40vw, 100vw" : "(min-width: 1280px) 20vw, 50vw"} className={s.photoImage} />
        <span className={s.photoCopy}>
          <span className={s.photoKicker}>{photo.caption}</span>
          <span className={s.photoTitle}>{categoryLabel(category)}</span>
        </span>
        <span className={s.photoGo} aria-hidden>
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12 12 4M6 4h6v6" />
          </svg>
        </span>
      </Link>
    </li>
  );
}

export default function StoreGrid({ category, matches, density, query, showShapes, onQueryChange, onClear }: StoreGridProps) {
  const gridRef = useRef<HTMLUListElement>(null);
  const [cols, setCols] = useState<number>(density);
  const [pages, setPages] = useState(1);
  const [quick, setQuick] = useState<{ id: string; selection: PieceSelection | null; opening: number } | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);

  const openQuick = (product: Product, selection: PieceSelection) => {
    setQuick((q) => ({ id: product.id, selection, opening: (q?.opening ?? 0) + 1 }));
    setQuickOpen(true);
  };
  const position = quick ? matches.findIndex((p) => p.id === quick.id) : -1;
  const stepQuick = (d: 1 | -1) => {
    const next = matches[position + d];
    if (next) setQuick((q) => ({ id: next.id, selection: defaultSelection(next, query.metal), opening: (q?.opening ?? 0) + 1 }));
  };

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

  const rowsPerPage = cols <= 2 ? ROWS_PER_PAGE * 2 : ROWS_PER_PAGE;
  const { slots, placed } = useMemo(() => layout(matches, cols, rowsPerPage * pages, category), [matches, cols, rowsPerPage, pages, category]);

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
        {slots.map((slot) => {
          if (slot.kind === "card")
            return (
              <li key={slot.product.id} className={s.cell}>
                <StoreCard product={slot.product} preferredMetal={query.metal} priority={slot.index < cols} onQuickView={openQuick} />
              </li>
            );
          if (slot.kind === "photo") return <PhotoTile key={slot.key} photo={slot.photo} category={slot.category} span={slot.span} />;
          if (slot.kind === "panel")
            return (
              <li key="panel" className={s.panelRow}>
                <MatchPanel category={category} query={query} showShapes={showShapes} onApply={onQueryChange} />
              </li>
            );
          return <PromoTile key="promo" />;
        })}
      </ul>

      <div className={s.more}>
        <span className={s.moreText}>
          Showing {placed} of {matches.length}
        </span>
        <span className={s.moreBar} aria-hidden>
          <span style={{ transform: `scaleX(${placed / matches.length})` }} />
        </span>
        {placed < matches.length && (
          <button type="button" className={s.moreBtn} onClick={() => setPages((n) => n + 1)}>
            Load more
          </button>
        )}
      </div>

      <QuickView
        product={position >= 0 ? matches[position] : null}
        selection={quick?.selection ?? null}
        opening={quick?.opening ?? 0}
        open={quickOpen && position >= 0}
        position={position}
        total={matches.length}
        onClose={() => setQuickOpen(false)}
        onStep={stepQuick}
      />
    </>
  );
}
