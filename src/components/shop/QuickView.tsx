"use client";

/**
 * 04. Quick view. A paper drawer from the right (620px, a full sheet below
 * 768px) with the same mechanics as the contact drawer. Left the stage and
 * its thumbnails, right the category eyebrow, the name, the detail, a metal
 * chooser with the carat chips beneath it (mirroring the card, and starting
 * from the card's selection), a hairline, three factual lines, then the
 * doors: Enquire about this piece (contact drawer) and Book a visit. When
 * the selection has no render the stage shows the placeholder. Previous and
 * Next in the head step through the current filtered list. The URL never
 * changes.
 */

import { useId, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import { caratOptions, formatCarat, metals, productMetals, type Metal, type Product } from "@/content/catalog";
import { categoryFor, defaultSelection, firstCarat, pad2, renderForSelection, type PieceSelection } from "./filters";
import QuickViewStage, { type StageItem } from "./QuickViewStage";
import { useDrawer } from "./useDrawer";
import d from "./drawers.module.css";
import s from "./shop.module.css";

const FACTS = [
  "Set with a diamond we grew, DEF color, VVS clarity.",
  "Handcrafted by the finest craftspeople.",
  "Available made to order in the metal and size you need.",
];

export interface QuickViewProps {
  open: boolean;
  product: Product | null;
  /** The selection the drawer opens on (the card's), and a count of openings so the body starts afresh each time. */
  selection: PieceSelection | null;
  opening: number;
  /** Position of the product in the filtered list and that list's length. */
  position: number;
  total: number;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
}

function stageItems(product: Product): StageItem[] {
  const own = productMetals(product);
  // The metal of the primary render: the variant that matches it, else the piece's only metal.
  const primaryMetal = own.find((m) => product.variants?.[m] === product.image) ?? (own.length === 1 ? own[0] : undefined);
  const items: StageItem[] = [];
  if (product.video) items.push({ id: "video", kind: "video", slug: product.video, label: "Turntable", metal: primaryMetal });
  else items.push({ id: "primary", kind: "image", slug: product.image, label: "Front", metal: primaryMetal });
  product.angles?.forEach((slug, i) => items.push({ id: `angle-${slug}`, kind: "image", slug, label: `Angle ${i + 1}` }));
  for (const m of own) {
    const slug = product.variants?.[m];
    if (!slug || slug === product.image) continue;
    items.push({ id: `metal-${m}`, kind: "image", slug, label: metals.find((x) => x.id === m)?.label ?? m, metal: m });
  }
  return items;
}

export default function QuickView({ open, product, selection, opening, position, total, onClose, onStep }: QuickViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const { onKeyDown, handOff } = useDrawer({ open, onClose, rootRef, panelRef, backdropRef, axis: "x" });

  const enquire = () => {
    if (!product) return;
    handOff();
    onClose();
    openContactDrawer(product.category === "engagement" ? "engagement" : "other", "contact");
  };
  const visit = () => {
    handOff();
    onClose();
    openContactDrawer("other", "visit");
  };

  return (
    <div ref={rootRef} className={d.root} onKeyDown={onKeyDown} inert={!open} data-quick-view>
      <button ref={backdropRef} type="button" className={d.backdrop} aria-label="Close" onClick={onClose} tabIndex={-1} />
      <aside ref={panelRef} className={d.panel} role="dialog" aria-modal="true" aria-labelledby={titleId} data-theme="light" data-lenis-prevent tabIndex={-1}>
        <div className={d.head}>
          <div className={d.headLeft}>
            <span className="t-eyebrow">Quick view</span>
            {product && position >= 0 && (
              <span className="t-index" aria-live="polite">
                {pad2(position + 1)} / {pad2(total)}
              </span>
            )}
          </div>
          <div className={d.headRight}>
            <button type="button" className={d.iconBtn} onClick={() => onStep(-1)} disabled={position <= 0} aria-label="Previous piece" data-cursor="link">
              <svg aria-hidden viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                <path d="M12.5 4 6.5 10l6 6" />
              </svg>
            </button>
            <button type="button" className={d.iconBtn} onClick={() => onStep(1)} disabled={position >= total - 1} aria-label="Next piece" data-cursor="link">
              <svg aria-hidden viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                <path d="m7.5 4 6 6-6 6" />
              </svg>
            </button>
            <button type="button" className={`${d.iconBtn} ${d.close}`} onClick={onClose} aria-label="Close" data-cursor="link">
              <svg aria-hidden viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                <path d="M3 3l14 14M17 3L3 17" />
              </svg>
            </button>
          </div>
        </div>

        {product && (
          <QuickViewBody
            key={`${product.id}-${opening}`}
            product={product}
            initial={selection ?? defaultSelection(product, null)}
            titleId={titleId}
            onEnquire={enquire}
            onVisit={visit}
          />
        )}
      </aside>
    </div>
  );
}

interface QuickViewBodyProps {
  product: Product;
  initial: PieceSelection;
  titleId: string;
  onEnquire: () => void;
  onVisit: () => void;
}

function QuickViewBody({ product, initial, titleId, onEnquire, onVisit }: QuickViewBodyProps) {
  const items = stageItems(product);
  const carats = caratOptions[product.category];
  const category = categoryFor(product.category);
  // The stage item showing a metal: its variant, else the primary render (angles read as the primary's metal).
  const itemFor = (m: Metal) => {
    const at = items.findIndex((it) => it.metal === m);
    return at >= 0 ? at : 0;
  };

  const [selection, setSelection] = useState(initial);
  const [current, setCurrent] = useState(() => itemFor(initial.metal));
  const hasRender = renderForSelection(product, selection) !== null;

  const chooseMetal = (m: Metal) => {
    setSelection({ ...selection, metal: m });
    setCurrent(itemFor(m));
  };
  const chooseCarat = (ct: number) => setSelection({ ...selection, carat: ct });
  // A thumbnail is a render, so choosing one settles the selection on its metal at the rendered size.
  const chooseView = (i: number) => {
    setCurrent(i);
    setSelection({ metal: items[i]?.metal ?? items[0]?.metal ?? selection.metal, carat: firstCarat(product) });
  };

  return (
    <div className={d.body}>
      <QuickViewStage items={items} current={current} onSelect={chooseView} video={product.video ?? null} placeholder={hasRender ? null : selection} />

      <div className={d.copy}>
        <Eyebrow>{category?.label ?? "The collection"}</Eyebrow>
        <h2 id={titleId} className={d.name}>
          {product.name}
        </h2>
        <p className={d.detail}>{product.detail}</p>

        <div className={d.choosers}>
          <div className={d.metals} role="group" aria-label="Metal">
            {metals.map((m) => (
              <button key={m.id} type="button" className={s.chip} aria-pressed={selection.metal === m.id} onClick={() => chooseMetal(m.id)} data-cursor="link">
                <span aria-hidden className={s.chipSwatch} style={{ background: m.swatch }} />
                {m.label}
              </button>
            ))}
          </div>
          <div className={s.carats} role="group" aria-label="Carat">
            {carats.map((ct) => (
              <button key={ct} type="button" className={s.carat} aria-pressed={selection.carat === ct} onClick={() => chooseCarat(ct)} data-cursor="link">
                {formatCarat(ct)}
              </button>
            ))}
          </div>
        </div>

        <span className={d.rule} aria-hidden />

        <ul className={d.facts}>
          {FACTS.map((fact) => (
            <li key={fact} className={d.fact}>
              <span aria-hidden className={d.factDot} />
              {fact}
            </li>
          ))}
        </ul>
      </div>

      <div className={d.doors}>
        <Button variant="primary" onClick={onEnquire} arrow>
          Enquire about this piece
        </Button>
        <Button variant="secondary" onClick={onVisit}>
          Book a visit
        </Button>
      </div>
    </div>
  );
}
