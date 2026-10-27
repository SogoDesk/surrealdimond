"use client";

/**
 * Search results (F-B5), open to everyone like the jewelry and diamond pages
 * (prices stay behind the dealer log in). The query comes from the header
 * search or the field at the top of this page, and runs through the same
 * engine as the header suggestions (src/lib/siteSearch.ts):
 *
 * - Diamonds: stones matching the filters read from the query, the first
 *   eight here with Quick View, and all of them in Diamond Search with the
 *   filters set; stock IDs and certificate numbers go straight to the stone.
 *   No stone in stock: the Made to Order request, prefilled.
 * - Jewelry: every matching piece as a store card, with Quick View.
 * - Pages: Legacy, Made to Order, the collections, the dashboard pages.
 *
 * Nothing found, or no query: popular searches and the jewelry categories.
 */

import Link from "next/link";
import { Suspense, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import ShapeIcon from "@/components/brand/ShapeIcon";
import StoreCard from "@/components/store/StoreCard";
import { useQuickViewList } from "@/components/store/useQuickViewList";
import StoneDrawer from "@/components/diamonds/StoneDrawer";
import { EMPTY, m2oHref } from "@/components/diamonds/query";
import { categories } from "@/content/catalog";
import { SHAPE_LABEL, shipment, shipsNextDay } from "@/content/diamonds";
import { account } from "@/content/site";
import { useDealer } from "@/lib/dealer";
import { useUnavailable } from "@/lib/memo";
import { formatUSD, stonePrice } from "@/lib/pricing";
import { POPULAR, searchSite } from "@/lib/siteSearch";
import s from "./search.module.css";

const STONES_SHOWN = 8;

function Results({ q }: { q: string }) {
  const dealer = useDealer();
  const gone = useUnavailable();
  const r = useMemo(() => searchSite(q, { gone }), [q, gone]);
  const quick = useQuickViewList(r.products);
  const stoneList = useMemo(() => [...r.exact, ...r.stones.filter((st) => !r.exact.some((x) => x.id === st.id)).slice(0, STONES_SHOWN)], [r]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const position = openId ? stoneList.findIndex((st) => st.id === openId) : -1;
  const openStone = position >= 0 ? stoneList[position] : null;

  const total = r.stoneTotal + r.exact.length + r.products.length + r.pages.length;
  const counts = [r.stoneTotal + r.exact.length ? `${r.stoneTotal + r.exact.length} ${r.stoneTotal + r.exact.length === 1 ? "stone" : "stones"}` : "", r.products.length ? `${r.products.length} ${r.products.length === 1 ? "piece" : "pieces"}` : "", r.pages.length ? `${r.pages.length} ${r.pages.length === 1 ? "page" : "pages"}` : ""].filter(Boolean);

  if (!q) return <Empty title="What are you looking for?" line="Search jewelry by name, style number or type, diamonds by shape, carat, color and clarity, or a stock ID." />;
  if (total === 0 && !r.stoneFilter) return <Empty title={<>Nothing found for &ldquo;{q}&rdquo;</>} line="Try a shorter search, a style number, or a stone like 1-2ct oval DEF. For anything else, call or message us." />;

  return (
    <>
      <p className={s.summary} aria-live="polite">
        {counts.length ? counts.join(" · ") : "No stones in stock for this search"}
      </p>

      {r.pages.length > 0 && (
        <section className={s.section} aria-labelledby="res-pages">
          <h2 id="res-pages" className={s.sectionTitle}>
            Pages
          </h2>
          <ul className={s.pages}>
            {r.pages.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className={s.pageLink}>
                  <strong>{p.label}</strong>
                  <span>{p.line}</span>
                  <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(r.stoneFilter || r.exact.length > 0) && (
        <section className={s.section} aria-labelledby="res-stones">
          <div className={s.sectionHead}>
            <div>
              <h2 id="res-stones" className={s.sectionTitle}>
                Diamonds
              </h2>
              {r.stoneFilter && (
                <p className={s.sectionLine}>
                  {r.stoneTotal} in stock · {r.stoneLabel}
                </p>
              )}
            </div>
            {r.stoneFilter && r.stoneTotal > 0 && (
              <Link href={r.stoneHref} className={s.primary}>
                See all {r.stoneTotal} in Diamond Search
              </Link>
            )}
          </div>
          {stoneList.length > 0 ? (
            <ul className={s.stones}>
              {stoneList.map((st) => (
                <li key={st.id}>
                  <button
                    type="button"
                    className={s.stone}
                    onClick={() => {
                      setOpenId(st.id);
                      setDrawerOpen(true);
                    }}
                  >
                    <ShapeIcon shape={st.shape} className={s.stoneIcon} />
                    <span className={s.stoneMain}>
                      <strong>
                        {st.carat.toFixed(2)} ct {SHAPE_LABEL[st.shape]}
                      </strong>
                      <span>
                        {st.color} {st.clarity}
                        {st.cut ? ` · ${st.cut}` : ""} · {st.lab} · {st.id}
                      </span>
                    </span>
                    <span className={s.stoneShip} data-next={shipsNextDay(st) || undefined}>
                      {shipment(st)}
                    </span>
                    <span className={s.stonePrice}>{dealer ? formatUSD(stonePrice(st)) : "Quick view"}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className={s.none}>
              <p>
                No stone in stock matches <strong>{r.stoneLabel}</strong>. Widen the search in Diamond Search, or grow one to order.
              </p>
              <div className={s.doors}>
                <Link href={m2oHref({ ...EMPTY, ...r.stoneFilter })} className={s.primary}>
                  Request Made to Order
                </Link>
                <Link href={r.stoneHref} className={s.secondary}>
                  Open Diamond Search
                </Link>
              </div>
            </div>
          )}
          {!dealer && stoneList.length > 0 && (
            <p className={s.fine}>
              <Link href={`${account.login}?next=${encodeURIComponent(`/search?q=${encodeURIComponent(q)}`)}`}>Log in</Link> for dealer prices and to order.
            </p>
          )}
        </section>
      )}

      {r.products.length > 0 && (
        <section className={s.section} aria-labelledby="res-jewelry">
          <div className={s.sectionHead}>
            <div>
              <h2 id="res-jewelry" className={s.sectionTitle}>
                Jewelry
              </h2>
              <p className={s.sectionLine}>
                {r.products.length} {r.products.length === 1 ? "piece" : "pieces"}
              </p>
            </div>
          </div>
          <ul className={s.grid}>
            {r.products.map((p, i) => (
              <li key={p.id}>
                <StoreCard product={p} preferredMetal={null} priority={i < 5} onQuickView={quick.open} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {quick.drawer}
      <StoneDrawer
        stone={openStone}
        open={drawerOpen && Boolean(openStone)}
        position={Math.max(position, 0)}
        total={stoneList.length}
        onClose={() => setDrawerOpen(false)}
        onStep={(d) => {
          const next = stoneList[position + d];
          if (next) setOpenId(next.id);
        }}
      />
    </>
  );
}

function Empty({ title, line }: { title: ReactNode; line: string }) {
  return (
    <div className={s.empty}>
      <p className={s.emptyTitle}>{title}</p>
      <p className={s.emptyLine}>{line}</p>
      <p className={s.label}>Popular searches</p>
      <ul className={s.chips}>
        {POPULAR.map((p) => (
          <li key={p}>
            <Link href={`${account.search}?q=${encodeURIComponent(p)}`} className={s.chip}>
              {p}
            </Link>
          </li>
        ))}
      </ul>
      <p className={s.label}>Jewelry</p>
      <ul className={s.chips}>
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/jewelry/${c.id}`} className={s.chip}>
              {c.label}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/diamonds" className={s.chip}>
            Loose diamonds
          </Link>
        </li>
      </ul>
    </div>
  );
}

function SearchView() {
  const router = useRouter();
  const q = (useSearchParams().get("q") ?? "").trim();
  const [value, setValue] = useState(q);
  // A new query in the address (the header search) refills the field (adjusted during render).
  const [seen, setSeen] = useState(q);
  if (seen !== q) {
    setSeen(q);
    setValue(q);
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = value.trim();
    router.replace(next ? `${account.search}?q=${encodeURIComponent(next)}` : account.search);
  };

  return (
    <>
      <h1 className={s.title}>{q ? <>Results for <em>&ldquo;{q}&rdquo;</em></> : <>Search</>}</h1>
      <form role="search" className={s.form} onSubmit={submit}>
        <label htmlFor="page-search" className={s.srOnly}>
          Search jewelry, diamonds and pages
        </label>
        <input id="page-search" type="search" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Oval halo, LE2004, 1-2ct oval DEF, a stock ID" className={s.input} autoComplete="off" />
        <button type="submit" className={s.primary}>
          Search
        </button>
      </form>
      <Results q={q} />
    </>
  );
}

export default function SearchPage() {
  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <section className={s.page}>
          <div className={s.wrap}>
            <nav aria-label="Breadcrumb" className={s.crumbs}>
              <Link href="/">Home</Link>
              <span aria-hidden>/</span>
              <span aria-current="page">Search</span>
            </nav>
            <Suspense fallback={<h1 className={s.title}>Search</h1>}>
              <SearchView />
            </Suspense>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
