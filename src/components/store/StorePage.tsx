"use client";

/**
 * The store listing, on Tanishq's listing pattern in the Surreal design
 * system (docs/CONTEXT.md, "UX reference"). Both /jewelry and
 * /jewelry/[category] render it. Top to bottom: breadcrumb, title with the
 * piece count and the dealer pricing note, a rail of round division
 * thumbnails, the sticky toolbar (Filters, Metal, Shape, Sort, density), the
 * active filter chips, then the grid: four to six cards a row on desktop,
 * with the "find your match" panel after the second row, a Made to Order
 * tile after the fourth, campaign photographs through the rows, and Load
 * more at the foot. The Surreal Assurance and the footer close the page.
 *
 * The admin console (lib/merch.ts) sets each page's default sort and the
 * pieces featured to its top (BRD R-33, R-34); the pins hold in the page's
 * default order, and a customer's own sort re-sorts everything.
 *
 * Filters and the sort live in the query string (shared with the older shop
 * helpers in components/shop/filters.ts). Reading it goes through
 * useSearchParams inside a Suspense boundary whose fallback is the same view
 * with no query, so the server sends the full list.
 */

import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import Assurance from "@/components/brand/Assurance";
import DivisionMotif from "@/components/brand/DivisionMotif";
import { categoryFor, clearedQuery, matchesQuery, parseQuery, poolFor, serializeQuery, showsShapes, sortProducts, type ShopQuery } from "@/components/shop/filters";
import { renderSrc, type Category } from "@/content/catalog";
import { applyPins, pageSort, useMerch } from "@/lib/merch";
import { divisions } from "@/content/divisions";
import { account } from "@/content/site";
import StoreToolbar, { type Density } from "./StoreToolbar";
import StoreGrid from "./StoreGrid";
import FilterDrawer from "./FilterDrawer";
import s from "./store.module.css";

export interface StorePageProps {
  category: Category | null;
}

export default function StorePage({ category }: StorePageProps) {
  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <Suspense fallback={<StoreView category={category} params={null} />}>
          <WithParams category={category} />
        </Suspense>
        <Assurance />
        <Footer />
      </main>
    </>
  );
}

function WithParams({ category }: StorePageProps) {
  const params = useSearchParams();
  return <StoreView category={category} params={params} />;
}

function DivisionRail({ active }: { active: Category | null }) {
  return (
    <nav className={s.rail} aria-label="Jewelry divisions">
      <ul className={s.railList}>
        <li>
          <Link href="/jewelry" className={s.railItem} aria-current={active === null ? "page" : undefined}>
            <span className={`${s.railThumb} ${s.railAll}`} aria-hidden>
              All
            </span>
            <span className={s.railLabel}>All jewelry</span>
          </Link>
        </li>
        {divisions.map((d) => (
          <li key={d.id}>
            <Link href={d.href} className={s.railItem} aria-current={active === d.id ? "page" : undefined}>
              <span className={s.railThumb} aria-hidden>
                {d.image ? <Image src={renderSrc(d.image)} alt="" width={120} height={120} sizes="64px" /> : d.motif ? <DivisionMotif motif={d.motif} className={s.railMotif} /> : null}
              </span>
              <span className={s.railLabel}>{d.label.replace(" Collection", "")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function StoreView({ category, params }: StorePageProps & { params: URLSearchParams | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const merch = useMerch();
  const page = category ?? "all";
  const defaultSort = pageSort(merch, page);
  const pinned = merch.pins[page];
  const query = useMemo(() => {
    const q = parseQuery(params);
    return params?.get("sort") ? q : { ...q, sort: defaultSort };
  }, [params, defaultSort]);
  const shapesOn = showsShapes(category);
  const meta = categoryFor(category);

  const pool = useMemo(() => {
    const sorted = sortProducts(poolFor(category), query.sort);
    return query.sort === defaultSort ? applyPins(sorted, pinned) : sorted;
  }, [category, query.sort, defaultSort, pinned]);
  const matches = useMemo(() => pool.filter((p) => matchesQuery(p, query, shapesOn)), [pool, query, shapesOn]);

  const [density, setDensity] = useState<Density>(5);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const setQuery = useCallback(
    (next: ShopQuery) => {
      // The page's default sort stays out of the URL; any other choice, "featured" included, is written out.
      const params = new URLSearchParams(serializeQuery({ ...next, sort: "featured" }));
      if (next.sort !== defaultSort) params.set("sort", next.sort);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, defaultSort],
  );
  const clearFilters = useCallback(() => setQuery(clearedQuery(query)), [query, setQuery]);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const title = meta?.label ?? "All jewelry";

  return (
    <>
      <section className={s.head} aria-labelledby="store-title">
        <div className={s.wrap}>
          <nav aria-label="Breadcrumb" className={s.crumbs}>
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            {meta ? (
              <>
                <Link href="/jewelry">Jewelry</Link>
                <span aria-hidden>/</span>
                <span aria-current="page">{meta.label}</span>
              </>
            ) : (
              <span aria-current="page">Jewelry</span>
            )}
          </nav>
          <div className={s.titleRow}>
            <div className={s.titleText}>
              <h1 id="store-title" className={s.title}>
                {title} <span className={s.titleCount}>({pool.length} pieces)</span>
              </h1>
              <p className={s.blurb}>{meta?.blurb ?? "Every piece in the catalog, set with lab grown diamonds we grow ourselves."}</p>
            </div>
            <div className={s.dealerNote}>
              <span className={s.dealerNoteText}>
                <strong>Dealer pricing</strong> and ordering open once you log in.
              </span>
              <span className={s.dealerNoteDoors}>
                <Link href={account.login} className={s.dealerLogin}>
                  Log in
                </Link>
                <Link href={account.apply} className={s.dealerApply}>
                  Become a dealer
                </Link>
              </span>
            </div>
          </div>
        </div>
        <DivisionRail active={category} />
      </section>

      <section className={s.body} aria-label={`${title}, pieces`}>
        <StoreToolbar
          query={query}
          showShapes={shapesOn}
          density={density}
          count={matches.length}
          onQueryChange={setQuery}
          onDensityChange={setDensity}
          onOpenFilters={() => setDrawerOpen(true)}
          onClear={clearFilters}
        />
        <StoreGrid key={serializeQuery(query)} category={category} matches={matches} density={density} query={query} showShapes={shapesOn} onQueryChange={setQuery} onClear={clearFilters} />
      </section>

      <FilterDrawer open={drawerOpen} category={category} query={query} showShapes={shapesOn} onApply={setQuery} onClose={closeDrawer} />
    </>
  );
}
