"use client";

/**
 * All filters, in a drawer from the right (the mechanics of useDrawer: inert
 * while closed, backdrop, focus trap, Escape, scroll lock). Sections: Category
 * (the sixteen divisions as links, grouped), Metal, Center stone where it
 * applies, and Sort. Choices are a draft until Show; the footer counts the
 * pieces the draft would show and offers Clear.
 */

import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { metals, shapes, type Category, type Metal, type Shape } from "@/content/catalog";
import { divisionGroups, divisions } from "@/content/divisions";
import { SORTS, matchesQuery, poolFor, toggleOne, type ShopQuery, type Sort } from "@/components/shop/filters";
import { trapTab, useDrawer } from "@/components/shop/useDrawer";
import s from "./store.module.css";
import { useWithMetalsList } from "@/lib/metals";

export interface FilterDrawerProps {
  open: boolean;
  category: Category | null;
  query: ShopQuery;
  showShapes: boolean;
  onApply: (q: ShopQuery) => void;
  onClose: () => void;
}

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={s.fGroup}>
      <button type="button" className={s.fGroupHead} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {title}
        <svg aria-hidden viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          {open ? <path d="M2 5h6" /> : <path d="M2 5h6M5 2v6" />}
        </svg>
      </button>
      {open && <div className={s.fGroupBody}>{children}</div>}
    </section>
  );
}

export default function FilterDrawer({ open, category, query, showShapes, onApply, onClose }: FilterDrawerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const { onKeyDown } = useDrawer({ open, onClose, rootRef, panelRef, backdropRef, axis: "x" });

  // The draft restarts from the live query each time the drawer opens (adjusted during render).
  const [draft, setDraft] = useState<ShopQuery>(query);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setDraft(query);
  }

  const source = useMemo(() => poolFor(category), [category]);
  const configured = useWithMetalsList(source);
  const count = useMemo(() => configured.filter((p) => matchesQuery(p, draft, showShapes)).length, [configured, draft, showShapes]);

  return (
    <div ref={rootRef} className={s.drawerRoot} inert={!open} aria-hidden={!open} onKeyDown={onKeyDown} data-lenis-prevent>
      <div ref={backdropRef} className={s.drawerBackdrop} onClick={onClose} />
      <div ref={panelRef} className={s.drawer} role="dialog" aria-modal="true" aria-label="Filters" tabIndex={-1} onKeyDown={(e) => trapTab(e, panelRef.current)}>
        <header className={s.drawerHead}>
          <p className={s.drawerTitle}>Filters</p>
          <button type="button" className={s.drawerClose} onClick={onClose} aria-label="Close filters">
            <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M3 3l10 10M13 3 3 13" />
            </svg>
          </button>
        </header>

        <div className={s.drawerBody}>
          <Group title="Category">
            {divisionGroups.map((g) => (
              <div key={g.id} className={s.fSub}>
                <p className={s.fSubTitle}>{g.label}</p>
                <ul className={s.fLinks}>
                  {divisions
                    .filter((d) => d.group === g.id)
                    .map((d) => (
                      <li key={d.id}>
                        <Link href={d.href} className={s.fLink} aria-current={d.id === category ? "page" : undefined} onClick={onClose}>
                          {d.label}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </Group>
          <Group title="Metal">
            <div className={s.fChips}>
              {metals.map((m) => (
                <button key={m.id} type="button" className={s.matchChip} aria-pressed={draft.metal === m.id} onClick={() => setDraft({ ...draft, metal: toggleOne<Metal>(draft.metal, m.id) })}>
                  <span className={s.pillSwatch} style={{ background: m.swatch }} aria-hidden />
                  {m.label}
                </button>
              ))}
            </div>
          </Group>
          {showShapes && (
            <Group title="Center stone">
              <div className={s.fChips}>
                {shapes.map((x) => (
                  <button key={x.id} type="button" className={s.matchChip} aria-pressed={draft.shape === x.id} onClick={() => setDraft({ ...draft, shape: toggleOne<Shape>(draft.shape, x.id) })}>
                    {x.label}
                  </button>
                ))}
              </div>
            </Group>
          )}
          <Group title="Sort by">
            <div className={s.fChips}>
              {SORTS.map((x) => (
                <button key={x.id} type="button" className={s.matchChip} aria-pressed={draft.sort === x.id} onClick={() => setDraft({ ...draft, sort: x.id as Sort })}>
                  {x.label}
                </button>
              ))}
            </div>
          </Group>
        </div>

        <footer className={s.drawerFoot}>
          <button type="button" className={s.drawerClear} onClick={() => setDraft({ ...draft, metal: null, shape: null })}>
            Clear
          </button>
          <button
            type="button"
            className={s.drawerApply}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            Show {count} {count === 1 ? "piece" : "pieces"}
          </button>
        </footer>
      </div>
    </div>
  );
}
