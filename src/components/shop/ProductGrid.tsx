"use client";

/**
 * 03. Grid. A CSS grid of product cards (columns from the density, 2 below
 * 768px, 1 below 420px) with an editorial interlude after every eighth card
 * and the made to order promo once after the sixteenth. Every card of the
 * category pool stays mounted; filtered out or unpaged cards carry
 * data-hidden (display none) so a filter, sort or density change can reflow
 * with GSAP Flip: record the layout with capture() before the change, then
 * this component animates from it after React commits. Cards reveal with a
 * clip from the bottom in ScrollTrigger batches; "Show more" reveals the next
 * page the same way without a Flip. Reduced motion: short fades, no Flip.
 */

import { useImperativeHandle, useRef, type CSSProperties, type Ref } from "react";
import Button from "@/components/ui/Button";
import type { Category, Metal, Product } from "@/content/catalog";
import { registerGsap, gsap, Flip, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import { INTERLUDE_EVERY, PROMO_AFTER, type ShopQuery } from "./filters";
import type { Density } from "./Toolbar";
import ProductCard from "./ProductCard";
import Interlude, { INTERLUDES } from "./Interlude";
import PromoTile from "./PromoTile";
import s from "./shop.module.css";

export interface ProductGridHandle {
  /** Record the current layout so the next commit reflows with Flip. */
  capture: () => void;
}

export interface ProductGridProps {
  ref?: Ref<ProductGridHandle>;
  category: Category | null;
  /** The category pool in display order (sorted). */
  pool: Product[];
  /** Ids of the pieces matching the filters, in the same order. */
  matches: Product[];
  shown: number;
  density: Density;
  query: ShopQuery;
  onOpen: (product: Product) => void;
  onShowMore: () => void;
  onClear: () => void;
}

type Tile =
  | { kind: "card"; product: Product; index: number | null }
  | { kind: "interlude"; ordinal: number; spec: (typeof INTERLUDES)[number] }
  | { kind: "promo" };

function buildTiles(pool: Product[], matches: Product[], shown: number): Tile[] {
  const visible = new Map<string, number>();
  matches.slice(0, shown).forEach((p, i) => visible.set(p.id, i + 1));
  const tiles: Tile[] = [];
  let interludes = 0;
  for (const product of pool) {
    const index = visible.get(product.id) ?? null;
    tiles.push({ kind: "card", product, index });
    if (index === null) continue;
    if (index % INTERLUDE_EVERY === 0) {
      // The five photographs cycle, so the key is the interlude's ordinal, not its photograph.
      tiles.push({ kind: "interlude", ordinal: interludes, spec: INTERLUDES[interludes % INTERLUDES.length] });
      interludes += 1;
    }
    if (index === PROMO_AFTER) tiles.push({ kind: "promo" });
  }
  return tiles;
}

export default function ProductGrid({ ref, pool, matches, shown, density, query, onOpen, onShowMore, onClear }: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<{ state: Flip.FlipState; at: number } | null>(null);
  const tiles = buildTiles(pool, matches, shown);
  const visibleCount = Math.min(shown, matches.length);
  const preferredMetal: Metal | null = query.metals.length === 1 ? query.metals[0] : null;
  // The layout key changes whenever the set of visible tiles or the column count changes.
  const layoutKey = `${density}|${tiles.map((t) => (t.kind === "card" ? (t.index === null ? "" : t.product.id) : t.kind)).join(",")}`;

  useImperativeHandle(ref, () => ({
    capture: () => {
      const grid = gridRef.current;
      if (!grid || prefersReducedMotion()) return;
      registerGsap();
      pendingRef.current = { state: Flip.getState(grid.querySelectorAll("[data-tile]"), { simple: true }), at: performance.now() };
      grid.style.minHeight = `${grid.offsetHeight}px`;
    },
  }));

  useGSAP(
    () => {
      registerGsap();
      const grid = gridRef.current;
      if (!grid) return;
      const all = gsap.utils.toArray<HTMLElement>("[data-tile]", grid);
      const reduced = prefersReducedMotion();
      // A recorded layout is only trusted for the change that recorded it (the URL update lands within a moment).
      const pending = pendingRef.current && performance.now() - pendingRef.current.at < 2000 ? pendingRef.current.state : null;
      pendingRef.current = null;

      if (pending && !reduced) {
        // Tiles arriving through the flip are already in place; they should not wait for a scroll reveal.
        const fresh = all.filter((el) => !el.dataset.hidden && !el.dataset.revealed);
        fresh.forEach((el) => {
          el.dataset.revealed = "true";
        });
        gsap.killTweensOf(fresh);
        gsap.set(fresh, { clearProps: "clipPath,transform" });
        let leaving: Element[] = [];
        Flip.from(pending, {
          targets: all,
          duration: 0.7,
          ease: "surreal",
          absolute: true,
          onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "surreal", clearProps: "transform" }),
          onLeave: (els) => {
            leaving = els;
            return gsap.to(els, { autoAlpha: 0, scale: 0.96, duration: 0.5, ease: "power2.out" });
          },
          onComplete: () => {
            grid.style.minHeight = "";
            // Leaving tiles are display none again; clear their exit state so they return cleanly.
            if (leaving.length) gsap.set(leaving, { clearProps: "opacity,visibility,transform" });
            ScrollTrigger.refresh();
          },
        });
        return;
      }
      grid.style.minHeight = "";

      // First paint and each "Show more": reveal the tiles that have not been shown yet.
      const fresh = all.filter((el) => !el.dataset.hidden && !el.dataset.revealed);
      if (fresh.length === 0) return;
      fresh.forEach((el) => {
        el.dataset.revealed = "true";
      });
      if (reduced) {
        gsap.set(fresh, { autoAlpha: 0 });
        ScrollTrigger.batch(fresh, {
          start: "top 92%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, duration: 0.3, ease: "none", stagger: 0.03, overwrite: true }),
        });
        return;
      }
      gsap.set(fresh, { clipPath: "inset(100% 0 0 0)", y: 24 });
      ScrollTrigger.batch(fresh, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            clipPath: "inset(0% 0 0 0)",
            y: 0,
            duration: 1.2,
            ease: "surreal",
            stagger: 0.06,
            overwrite: true,
            // Drop the clip once revealed so the hover lift's shadow is not cut off at the tile edge.
            onComplete: () => gsap.set(batch, { clearProps: "clipPath,transform" }),
          }),
      });
    },
    { scope: gridRef, dependencies: [layoutKey] },
  );

  return (
    <div className={s.gridWrap}>
      <div ref={gridRef} className={s.grid} style={{ "--cols": density } as CSSProperties} data-shop-grid>
        {tiles.map((tile) => {
          if (tile.kind === "card") {
            return <ProductCard key={tile.product.id} product={tile.product} index={tile.index} preferredMetal={preferredMetal} onOpen={onOpen} />;
          }
          if (tile.kind === "interlude") return <Interlude key={`interlude-${tile.ordinal}`} ordinal={tile.ordinal} spec={tile.spec} />;
          return <PromoTile key="promo" />;
        })}
      </div>

      {matches.length === 0 && (
        <div className={s.empty} role="status">
          <p className={s.emptyLine}>Nothing matches these filters yet.</p>
          <Button variant="tertiary" onClick={onClear}>
            Clear filters
          </Button>
        </div>
      )}

      {matches.length > visibleCount && (
        <div className={s.more}>
          <Button variant="secondary" onClick={onShowMore} arrow>
            Show more
          </Button>
          <span className="t-index">
            {visibleCount} of {matches.length}
          </span>
        </div>
      )}
    </div>
  );
}
