"use client";

/**
 * 02. Toolbar. Sticky under the header: filter chips on the left (Metal, and
 * Shape where the pieces carry a center stone), a Clear link once anything is
 * active; on the right the Sort select styled as a text link, the density
 * toggle (desktop) and the live count. Below 1024px the chips collapse into a
 * Filter pill that opens the bottom sheet.
 */

import { hasFilters, SORTS, type ShopQuery, type Sort } from "./filters";
import FilterChips from "./FilterChips";
import s from "./shop.module.css";

export type Density = 2 | 3 | 4;
const DENSITIES: Density[] = [2, 3, 4];

export interface ToolbarProps {
  query: ShopQuery;
  showShapes: boolean;
  density: Density;
  count: number;
  onQueryChange: (next: ShopQuery) => void;
  onDensityChange: (next: Density) => void;
  onOpenSheet: () => void;
}

function DensityGlyph({ columns }: { columns: Density }) {
  const w = 18;
  const gap = 2;
  const bar = (w - gap * (columns - 1)) / columns;
  return (
    <svg aria-hidden viewBox={`0 0 ${w} 14`} width={w} height={14} fill="currentColor">
      {Array.from({ length: columns }, (_, i) => (
        <rect key={i} x={i * (bar + gap)} y="0" width={bar} height="14" />
      ))}
    </svg>
  );
}

export default function Toolbar({ query, showShapes, density, count, onQueryChange, onDensityChange, onOpenSheet }: ToolbarProps) {
  const active = hasFilters(query);
  const activeCount = query.metals.length + (showShapes ? query.shapes.length : 0);
  const clear = () => onQueryChange({ ...query, metals: [], shapes: [] });

  return (
    <div className={s.toolbar} data-shop-toolbar>
      <div className={s.groups}>
        <FilterChips query={query} showShapes={showShapes} onChange={onQueryChange} />
        {active && (
          <button type="button" className={s.clear} onClick={clear} data-cursor="link">
            Clear
          </button>
        )}
      </div>

      <button type="button" className={s.filterPill} onClick={onOpenSheet} data-cursor="link" aria-haspopup="dialog">
        Filter
        {activeCount > 0 && <span className={s.filterBadge}>{activeCount}</span>}
      </button>

      <div className={s.right}>
        <label className={s.sort}>
          <span className={s.sortLabel}>Sort</span>
          <select
            className={s.sortSelect}
            value={query.sort}
            onChange={(e) => onQueryChange({ ...query, sort: e.target.value as Sort })}
            aria-label="Sort"
            data-cursor="link"
          >
            {SORTS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <svg aria-hidden className={s.sortChevron} viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
            <path d="M2 4.5l4 4 4-4" />
          </svg>
        </label>

        <div className={s.density} role="group" aria-label="Columns">
          {DENSITIES.map((d) => (
            <button
              key={d}
              type="button"
              className={s.densityBtn}
              aria-pressed={density === d}
              aria-label={`${d} columns`}
              onClick={() => onDensityChange(d)}
              data-cursor="link"
            >
              <DensityGlyph columns={d} />
            </button>
          ))}
        </div>

        <span className={s.toolbarCount} aria-live="polite">
          {count} {count === 1 ? "piece" : "pieces"}
        </span>
      </div>
    </div>
  );
}
