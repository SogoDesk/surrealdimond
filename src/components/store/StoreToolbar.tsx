"use client";

/**
 * Sticky store toolbar. Left: the Filters button (opens the drawer, with a
 * count of active filters) and quick dropdowns for Metal and, where pieces
 * carry a center stone, Shape. Right: the piece count, the density switch
 * (four, five or six cards a row, from 1280px) and Sort. Beneath, while any
 * filter is on, a row of removable chips and Clear all. Each dropdown is a
 * small listbox popover that closes on outside click, on Escape and after a
 * choice.
 */

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { metals, shapes } from "@/content/catalog";
import { SORTS, hasFilters, toggleOne, type ShopQuery } from "@/components/shop/filters";
import s from "./store.module.css";

export type Density = 4 | 5 | 6;
const DENSITIES: Density[] = [4, 5, 6];

interface Option {
  id: string;
  label: string;
  swatch?: string;
}

function Dropdown({ label, value, options, onPick, align = "left", prefix }: { label: string; value: string | null; options: Option[]; onPick: (id: string) => void; align?: "left" | "right"; prefix?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const current = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={s.dropdown}>
      <button type="button" className={s.pill} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} data-active={current && !prefix ? "true" : undefined} onClick={() => setOpen((o) => !o)}>
        {prefix ? (
          <>
            <span className={s.pillPrefix}>{prefix}</span>
            {current?.label ?? label}
          </>
        ) : (
          <>
            {current?.swatch && <span className={s.pillSwatch} style={{ background: current.swatch }} aria-hidden />}
            {current ? current.label : label}
          </>
        )}
        <svg aria-hidden viewBox="0 0 10 10" width="10" height="10" className={s.pillChevron} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3.75 5 6.75l3-3" />
        </svg>
      </button>
      {open && (
        <ul id={id} role="listbox" aria-label={label} className={s.menu} data-align={align}>
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                role="option"
                aria-selected={o.id === value}
                className={s.menuItem}
                onClick={() => {
                  onPick(o.id);
                  setOpen(false);
                }}
              >
                {o.swatch && <span className={s.pillSwatch} style={{ background: o.swatch }} aria-hidden />}
                <span>{o.label}</span>
                {o.id === value && (
                  <svg aria-hidden viewBox="0 0 12 12" width="12" height="12" className={s.menuCheck} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 6.5 5 9l4.5-6" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DensityIcon({ n }: { n: Density }) {
  const w = 16 / n;
  return (
    <svg aria-hidden viewBox="0 0 18 12" width="18" height="12">
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={1 + i * w} y="1" width={w - 1.2} height="10" rx="0.6" fill="currentColor" />
      ))}
    </svg>
  );
}

function Chip({ children, onRemove, label }: { children: ReactNode; onRemove: () => void; label: string }) {
  return (
    <button type="button" className={s.chip} onClick={onRemove} aria-label={`Remove ${label}`}>
      {children}
      <svg aria-hidden viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M2 2l6 6M8 2 2 8" />
      </svg>
    </button>
  );
}

export interface StoreToolbarProps {
  query: ShopQuery;
  showShapes: boolean;
  density: Density;
  count: number;
  onQueryChange: (next: ShopQuery) => void;
  onDensityChange: (d: Density) => void;
  onOpenFilters: () => void;
  onClear: () => void;
}

export default function StoreToolbar({ query, showShapes, density, count, onQueryChange, onDensityChange, onOpenFilters, onClear }: StoreToolbarProps) {
  const active = (query.metal ? 1 : 0) + (showShapes && query.shape ? 1 : 0);
  const metalLabel = metals.find((m) => m.id === query.metal)?.label;
  const shapeLabel = shapes.find((x) => x.id === query.shape)?.label;

  return (
    <div className={s.toolbarWrap}>
      <div className={s.toolbar}>
        <div className={s.toolbarLeft}>
          <button type="button" className={`${s.pill} ${s.pillFilters}`} onClick={onOpenFilters}>
            <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M2 4h12M4.5 8h7M7 12h2" />
            </svg>
            Filters
            {active > 0 && <span className={s.pillCount}>{active}</span>}
          </button>
          <span className={s.quick}>
            <Dropdown
              label="Metal"
              value={query.metal}
              options={metals.map((m) => ({ id: m.id, label: m.label, swatch: m.swatch }))}
              onPick={(id) => onQueryChange({ ...query, metal: toggleOne(query.metal, id as ShopQuery["metal"] & string) })}
            />
            {showShapes && (
              <Dropdown
                label="Center stone"
                value={query.shape}
                options={shapes.map((x) => ({ id: x.id, label: x.label }))}
                onPick={(id) => onQueryChange({ ...query, shape: toggleOne(query.shape, id as ShopQuery["shape"] & string) })}
              />
            )}
          </span>
        </div>
        <div className={s.toolbarRight}>
          <span className={`${s.count} tabular`} aria-live="polite">
            {count} {count === 1 ? "piece" : "pieces"}
          </span>
          <div className={s.density} role="group" aria-label="Cards per row">
            {DENSITIES.map((d) => (
              <button key={d} type="button" className={s.densityBtn} data-n={d} aria-pressed={density === d} aria-label={`${d} per row`} onClick={() => onDensityChange(d)}>
                <DensityIcon n={d} />
              </button>
            ))}
          </div>
          <Dropdown label="Sort" prefix="Sort by" align="right" value={query.sort} options={SORTS.map((x) => ({ id: x.id, label: x.label }))} onPick={(id) => onQueryChange({ ...query, sort: id as ShopQuery["sort"] })} />
        </div>
      </div>
      {hasFilters(query) && (
        <div className={s.chips}>
          {query.metal && metalLabel && (
            <Chip label={metalLabel} onRemove={() => onQueryChange({ ...query, metal: null })}>
              Metal: {metalLabel}
            </Chip>
          )}
          {showShapes && query.shape && shapeLabel && (
            <Chip label={shapeLabel} onRemove={() => onQueryChange({ ...query, shape: null })}>
              Center stone: {shapeLabel}
            </Chip>
          )}
          <button type="button" className={s.clearAll} onClick={onClear}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
