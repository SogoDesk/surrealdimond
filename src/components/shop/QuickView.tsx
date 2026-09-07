"use client";

/**
 * 04. Quick view. A paper drawer from the right (620px, a full sheet below
 * 768px) with the same mechanics as the contact drawer. Left the stage and
 * its thumbnails, right the category eyebrow, the name, the detail, a metal
 * chooser, a hairline, three factual lines, then the doors: Enquire about
 * this piece (contact drawer) and Book a visit. Previous and Next in the head
 * step through the current filtered list. The URL never changes.
 */

import { useId, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import { metals, productMetals, type Metal, type Product } from "@/content/catalog";
import { categoryFor, pad2 } from "./filters";
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

export default function QuickView({ open, product, position, total, onClose, onStep }: QuickViewProps) {
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

        {product && <QuickViewBody key={product.id} product={product} titleId={titleId} onEnquire={enquire} onVisit={visit} />}
      </aside>
    </div>
  );
}

function QuickViewBody({ product, titleId, onEnquire, onVisit }: { product: Product; titleId: string; onEnquire: () => void; onVisit: () => void }) {
  const items = stageItems(product);
  const own = productMetals(product);
  const [current, setCurrent] = useState(0);
  const category = categoryFor(product.category);
  // Angles carry no metal of their own, so they read as the primary render's metal.
  const currentMetal: Metal | null = items[current]?.metal ?? items[0]?.metal ?? null;

  const chooseMetal = (m: Metal) => {
    const at = items.findIndex((it) => it.metal === m);
    setCurrent(at >= 0 ? at : 0);
  };

  return (
    <div className={d.body}>
      <QuickViewStage items={items} current={current} onSelect={setCurrent} video={product.video ?? null} />

      <div className={d.copy}>
        <Eyebrow>{category?.label ?? "The collection"}</Eyebrow>
        <h2 id={titleId} className={d.name}>
          {product.name}
        </h2>
        <p className={d.detail}>{product.detail}</p>

        {own.length > 0 && (
          <div className={d.metals} role="group" aria-label="Metal">
            {own.map((m) => {
              const meta = metals.find((x) => x.id === m);
              return (
                <button key={m} type="button" className={s.chip} aria-pressed={currentMetal === m} onClick={() => chooseMetal(m)} data-cursor="link">
                  <span aria-hidden className={s.chipSwatch} style={{ background: meta?.swatch }} />
                  {meta?.label ?? m}
                </button>
              );
            })}
          </div>
        )}

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
