"use client";

/**
 * The Collection. Both routes (/jewelry and /jewelry/[category]) render this
 * page with the category preselected: the chrome on light, the contact
 * drawer, the masthead, the sticky toolbar and grid in one chapter (so the
 * toolbar sticks for the length of the grid), the quick view drawer, the
 * filter sheet, the programs band and the footer. No preloader.
 *
 * Filters and the sort live in the query string. Reading it goes through
 * useSearchParams, which client-renders the tree up to the nearest Suspense
 * boundary on a prerendered route, so the view is wrapped in one whose
 * fallback is the same view with no query: the server sends the unfiltered
 * list, and the first client render applies the query before anything is
 * revealed. Density, paging and the quick view are presentation state only.
 */

import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Section from "@/components/ui/Section";
import Footer from "@/components/sections/Footer";
import type { Category, Product } from "@/content/catalog";
import { matchesQuery, PAGE_SIZE, parseQuery, poolFor, queryKey, serializeQuery, showsShapes, sortProducts, type ShopQuery } from "./filters";
import Masthead from "./Masthead";
import Toolbar, { type Density } from "./Toolbar";
import FilterSheet from "./FilterSheet";
import ProductGrid, { type ProductGridHandle } from "./ProductGrid";
import QuickView from "./QuickView";
import ProgramsBand from "./ProgramsBand";
import s from "./shop.module.css";

export interface ShopPageProps {
  category: Category | null;
}

export default function ShopPage({ category }: ShopPageProps) {
  return (
    <>
      <SiteChrome initialTheme="light" />
      <ContactDrawer />
      <main id="main">
        <Suspense fallback={<ShopView category={category} params={null} />}>
          <ShopViewWithParams category={category} />
        </Suspense>
        <ProgramsBand />
        <Footer />
      </main>
    </>
  );
}

function ShopViewWithParams({ category }: ShopPageProps) {
  const params = useSearchParams();
  return <ShopView category={category} params={params} />;
}

interface ShopViewProps extends ShopPageProps {
  params: URLSearchParams | null;
}

function ShopView({ category, params }: ShopViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const gridRef = useRef<ProductGridHandle>(null);
  const query = useMemo(() => parseQuery(params), [params]);
  const key = queryKey(query);
  const shapesOn = showsShapes(category);

  const pool = useMemo(() => sortProducts(poolFor(category), query.sort), [category, query.sort]);
  const matches = useMemo(() => pool.filter((p) => matchesQuery(p, query, shapesOn)), [pool, query, shapesOn]);

  const [density, setDensity] = useState<Density>(3);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quick, setQuick] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  // Paging restarts whenever the query changes (adjusted during render, no effect needed).
  const [shown, setShown] = useState(PAGE_SIZE);
  const [seenKey, setSeenKey] = useState(key);
  if (seenKey !== key) {
    setSeenKey(key);
    setShown(PAGE_SIZE);
  }

  const setQuery = useCallback(
    (next: ShopQuery) => {
      gridRef.current?.capture();
      const qs = serializeQuery(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );
  const clearFilters = useCallback(() => setQuery({ ...query, metals: [], shapes: [] }), [query, setQuery]);

  const changeDensity = (next: Density) => {
    if (next === density) return;
    gridRef.current?.capture();
    setDensity(next);
  };

  const openQuick = (product: Product) => setQuick({ open: true, id: product.id });
  const closeQuick = useCallback(() => setQuick((q) => ({ ...q, open: false })), []);
  const quickIndex = quick.id ? matches.findIndex((p) => p.id === quick.id) : -1;
  const quickProduct = quickIndex >= 0 ? matches[quickIndex] : null;
  const stepQuick = (delta: 1 | -1) => {
    const next = matches[quickIndex + delta];
    if (next) setQuick({ open: true, id: next.id });
  };
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  return (
    <>
      <Section id="shop-masthead" theme="light" label="The collection">
        <Masthead category={category} count={matches.length} />
      </Section>

      <Section id="shop-grid" theme="light" label="Pieces" className={s.gridSection}>
        <Toolbar
          query={query}
          showShapes={shapesOn}
          density={density}
          count={matches.length}
          onQueryChange={setQuery}
          onDensityChange={changeDensity}
          onOpenSheet={() => setSheetOpen(true)}
        />
        <ProductGrid
          ref={gridRef}
          category={category}
          pool={pool}
          matches={matches}
          shown={shown}
          density={density}
          query={query}
          onOpen={openQuick}
          onShowMore={() => setShown((n) => n + PAGE_SIZE)}
          onClear={clearFilters}
        />
      </Section>

      <QuickView open={quick.open} product={quickProduct} position={quickIndex} total={matches.length} onClose={closeQuick} onStep={stepQuick} />
      <FilterSheet open={sheetOpen} query={query} showShapes={shapesOn} onApply={setQuery} onClose={closeSheet} />
    </>
  );
}
