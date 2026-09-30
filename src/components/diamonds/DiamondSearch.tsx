"use client";

/**
 * The diamond page (BRD 5.3), one line per stone in the Nivoda manner dealers
 * already like (R-14).
 *
 * Top: breadcrumb, title with the stone count, the dealer site's pricing note
 * and the sample feed notice. Then the quick filters (R-16): ten shape icons,
 * carat from and to with presets, color and clarity as ranges picked on
 * their scales, cut and lab; More filters opens polish, symmetry,
 * fluorescence, ratio and source. The results bar holds the count, Clear and
 * Sort. The list (R-17 columns until Surreal's attribute sheet arrives):
 * compare, shape, carat, color, clarity, cut, polish, symmetry,
 * fluorescence, measurements, ratio, table, depth, lab and certificate,
 * stock ID, shipment, price and the row doors (Quick View, Add to cart). On
 * phones each stone becomes a compact card. A row opens Quick View (R-15).
 *
 * Stones on a placed order or on memo leave the list at once (R-18, B-01).
 * The Made to Order entry (R-19) sits above the list and again after it,
 * carrying the search into the M2O request. Up to four stones can be
 * compared side by side. ?stone= opens a stone's Quick View directly.
 */

import Link from "next/link";
import { Suspense, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import Assurance from "@/components/brand/Assurance";
import ShapeIcon from "@/components/brand/ShapeIcon";
import { CLARITIES, COLORS, FLUORESCENCE, GRADES, LABS, SHAPES, SHAPE_LABEL, measurements, shipment, stoneById, stones, type Grade, type Stone } from "@/content/diamonds";
import { account, brand } from "@/content/site";
import { addStone, useCart } from "@/lib/cart";
import { useDealer } from "@/lib/dealer";
import { useUnavailable } from "@/lib/memo";
import { EMPTY, SORT_LABEL, activeCount, describe, m2oHref, matches, sortStones, type DiamondQuery, type SortKey } from "./query";
import StoneDrawer from "./StoneDrawer";
import s from "./diamonds.module.css";

const PAGE = 50;
const CARAT_PRESETS: [string, number, number | null][] = [
  ["0.5 to 1", 0.5, 1],
  ["1 to 2", 1, 2],
  ["2 to 3", 2, 3],
  ["3 to 5", 3, 5],
  ["5 to 8", 5, 8],
  ["8 and up", 8, null],
];
const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const short = (g: Grade | null) => (g === null ? "N/A" : g === "Excellent" ? "EX" : g === "Very Good" ? "VG" : g === "Ideal" ? "ID" : "G");

export default function DiamondSearch() {
  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <Suspense fallback={<SearchView params={null} />}>
          <WithParams />
        </Suspense>
        <Assurance />
        <Footer />
      </main>
    </>
  );
}

function WithParams() {
  const params = useSearchParams();
  return <SearchView params={params} />;
}

/** A range picked on a grade scale: first click sets both ends, the second sets the other end. */
function ScaleRange({ label, scale, value, onChange }: { label: string; scale: readonly string[]; value: [number, number] | null; onChange: (v: [number, number] | null) => void }) {
  const [anchor, setAnchor] = useState<number | null>(null);
  const pick = (i: number) => {
    if (anchor === null || !value) {
      setAnchor(i);
      onChange([i, i]);
    } else {
      onChange([Math.min(anchor, i), Math.max(anchor, i)]);
      setAnchor(null);
    }
  };
  return (
    <div className={s.filter}>
      <span className={s.filterLabel}>
        {label}
        {value && (
          <button
            type="button"
            className={s.filterClear}
            onClick={() => {
              onChange(null);
              setAnchor(null);
            }}
          >
            Any
          </button>
        )}
      </span>
      <div className={s.scale} role="group" aria-label={`${label} range`}>
        {scale.map((g, i) => (
          <button key={g} type="button" className={s.scaleCell} aria-pressed={value ? i >= value[0] && i <= value[1] : false} onClick={() => pick(i)}>
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chips<T extends string>({ label, options, value, onChange, format }: { label: string; options: readonly T[]; value: T[]; onChange: (v: T[]) => void; format?: (v: T) => string }) {
  return (
    <div className={s.filter}>
      <span className={s.filterLabel}>{label}</span>
      <div className={s.chips}>
        {options.map((o) => (
          <button key={o} type="button" className={s.chip} aria-pressed={value.includes(o)} onClick={() => onChange(toggle(value, o))}>
            {format ? format(o) : o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Range({ label, min, max, step, onChange, unit }: { label: string; min: number | null; max: number | null; step: number; onChange: (lo: number | null, hi: number | null) => void; unit?: string; children?: ReactNode }) {
  const num = (v: string) => (v === "" ? null : Number(v));
  return (
    <div className={s.range}>
      <span className={s.filterLabel}>{label}</span>
      <div className={s.rangeInputs}>
        <input type="number" inputMode="decimal" step={step} min={0} placeholder="From" value={min ?? ""} onChange={(e) => onChange(num(e.target.value), max)} aria-label={`${label} from`} />
        <span aria-hidden>to</span>
        <input type="number" inputMode="decimal" step={step} min={0} placeholder="To" value={max ?? ""} onChange={(e) => onChange(min, num(e.target.value))} aria-label={`${label} to`} />
        {unit && <span className={s.unit}>{unit}</span>}
      </div>
    </div>
  );
}

function SearchView({ params }: { params: URLSearchParams | null }) {
  const dealer = useDealer();
  const cart = useCart();
  const gone = useUnavailable();
  const [q, setQ] = useState<DiamondQuery>(EMPTY);
  const [more, setMore] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [compare, setCompare] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ?stone= opens that stone's Quick View once (adjusted during render).
  const linked = params?.get("stone") ?? null;
  const [seenLinked, setSeenLinked] = useState<string | null>(null);
  if (linked && linked !== seenLinked && stoneById(linked)) {
    setSeenLinked(linked);
    setOpenId(linked);
    setDrawerOpen(true);
  }

  const update = (patch: Partial<DiamondQuery>) => {
    setQ((prev) => ({ ...prev, ...patch }));
    setShown(PAGE);
  };

  const available = useMemo(() => stones.filter((st) => !gone.has(st.id)), [gone]);
  const results = useMemo(() => sortStones(available.filter((st) => matches(st, q)), q.sort), [available, q]);
  const counts = activeCount(q);
  const inCart = new Set(cart.map((l) => l.stoneId).filter(Boolean));
  const openStone = openId ? stoneById(openId) ?? null : null;
  const position = openId ? results.findIndex((st) => st.id === openId) : -1;
  const compared = compare.map((id) => stoneById(id)).filter((st): st is Stone => Boolean(st));

  const open = (id: string) => {
    setOpenId(id);
    setDrawerOpen(true);
  };
  const step = (d: 1 | -1) => {
    const next = results[position + d];
    if (next) setOpenId(next.id);
  };
  const add = (st: Stone) => addStone(st.id, st.carat);
  const loginFor = (st: Stone) => `${account.login}?next=${encodeURIComponent(`/diamonds?stone=${st.id}`)}`;

  const m2oBanner = (
    <Link href={m2oHref(q)} className={s.m2o}>
      <span className={s.m2oIcon} aria-hidden>
        <ShapeIcon shape={q.shapes[0] ?? "oval"} detail />
      </span>
      <span className={s.m2oText}>
        <strong>Not finding the stone? Grow it to order.</strong>
        <span>
          Made to Order{describe(q) ? ` for ${describe(q)}` : ""}: any shape, any carat weight, IGI certified. Your search fills in the request.
        </span>
      </span>
      <span className={s.m2oCta}>Start an M2O request</span>
    </Link>
  );

  return (
    <>
      <section className={s.head} aria-labelledby="diamonds-title">
        <div className={s.wrap}>
          <nav aria-label="Breadcrumb" className={s.crumbs}>
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span aria-current="page">Lab Diamond Search</span>
          </nav>
          <div className={s.titleRow}>
            <div>
              <h1 id="diamonds-title" className={s.title}>
                Lab Diamond <em>Search</em> <span className={s.titleCount}>({available.length} stones)</span>
              </h1>
              <p className={s.lead}>
                CVD diamonds we grow, primarily DEF color and VVS clarity, up to 15 carats, with supplier stones alongside. All prices shown are for asset; for short-term memo
                pricing, call {brand.office.phone}.
              </p>
            </div>
            <p className={s.sampleNote}>
              <strong>Sample feed.</strong> These stones show the layout. Live inventory arrives with the RightClick connection and supplier feeds.
            </p>
          </div>

          <div className={s.shapes} role="group" aria-label="Shape">
            {SHAPES.map((sh) => (
              <button key={sh} type="button" className={s.shape} aria-pressed={q.shapes.includes(sh)} onClick={() => update({ shapes: toggle(q.shapes, sh) })}>
                <ShapeIcon shape={sh} className={s.shapeIcon} />
                <span>{SHAPE_LABEL[sh]}</span>
              </button>
            ))}
          </div>

          <div className={s.filters}>
            <div className={s.caratBox}>
              <Range label="Carat" min={q.caratMin} max={q.caratMax} step={0.1} unit="ct" onChange={(lo, hi) => update({ caratMin: lo, caratMax: hi })} />
              <div className={s.presets}>
                {CARAT_PRESETS.map(([label, lo, hi]) => (
                  <button key={label} type="button" className={s.preset} aria-pressed={q.caratMin === lo && q.caratMax === hi} onClick={() => update(q.caratMin === lo && q.caratMax === hi ? { caratMin: null, caratMax: null } : { caratMin: lo, caratMax: hi })}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <ScaleRange label="Color" scale={COLORS} value={q.color} onChange={(v) => update({ color: v })} />
            <ScaleRange label="Clarity" scale={CLARITIES} value={q.clarity} onChange={(v) => update({ clarity: v })} />
            <Chips label="Cut (round)" options={["Ideal", "Excellent", "Very Good"] as const} value={q.cut.filter((c): c is "Ideal" | "Excellent" | "Very Good" => c !== "Good")} onChange={(v) => update({ cut: v })} />
            <Chips label="Lab" options={LABS} value={q.lab} onChange={(v) => update({ lab: v })} />
          </div>

          {more && (
            <div className={s.moreFilters}>
              <div className={s.filter}>
                <span className={s.filterLabel}>Polish, at least</span>
                <div className={s.chips}>
                  {GRADES.slice(0, 3).map((g) => (
                    <button key={g} type="button" className={s.chip} aria-pressed={q.polish === g} onClick={() => update({ polish: q.polish === g ? null : g })}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className={s.filter}>
                <span className={s.filterLabel}>Symmetry, at least</span>
                <div className={s.chips}>
                  {GRADES.slice(0, 3).map((g) => (
                    <button key={g} type="button" className={s.chip} aria-pressed={q.symmetry === g} onClick={() => update({ symmetry: q.symmetry === g ? null : g })}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <Chips label="Fluorescence" options={FLUORESCENCE} value={q.fluorescence} onChange={(v) => update({ fluorescence: v })} />
              <Range label="Ratio" min={q.ratioMin} max={q.ratioMax} step={0.01} onChange={(lo, hi) => update({ ratioMin: lo, ratioMax: hi })} />
              <div className={s.filter}>
                <span className={s.filterLabel}>Source</span>
                <div className={s.chips}>
                  {(["surreal", "supplier"] as const).map((src) => (
                    <button key={src} type="button" className={s.chip} aria-pressed={q.source === src} onClick={() => update({ source: q.source === src ? null : src })}>
                      {src === "surreal" ? "Grown by Surreal" : "Supplier stones"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className={s.results} aria-label="Stones">
        <div className={s.bar}>
          <div className={s.barLeft}>
            <span className={`${s.count} tabular`} aria-live="polite">
              {results.length} {results.length === 1 ? "stone" : "stones"}
            </span>
            <button type="button" className={s.moreBtn} aria-expanded={more} onClick={() => setMore((m) => !m)}>
              {more ? "Fewer filters" : "More filters"}
              {counts.more > 0 && <span className={s.badge}>{counts.more}</span>}
            </button>
            {counts.quick + counts.more > 0 && (
              <button type="button" className={s.clear} onClick={() => update({ ...EMPTY, sort: q.sort })}>
                Clear all
              </button>
            )}
          </div>
          <label className={s.sort}>
            <span>Sort by</span>
            <select value={q.sort} onChange={(e) => update({ sort: e.target.value as SortKey })}>
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={s.wrap}>
          {m2oBanner}
          {results.length === 0 ? (
            <div className={s.empty}>
              <p className={s.emptyTitle}>No stones match these filters.</p>
              <p>Widen the search, or grow the stone to order with the request above.</p>
              <button type="button" className={s.secondary} onClick={() => update({ ...EMPTY, sort: q.sort })}>
                Clear all
              </button>
            </div>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th scope="col" className={s.colCheck}>
                      <span className={s.srOnly}>Compare</span>
                    </th>
                    <th scope="col">Shape</th>
                    <th scope="col" className={s.num}>Carat</th>
                    <th scope="col">Color</th>
                    <th scope="col">Clarity</th>
                    <th scope="col">Cut</th>
                    <th scope="col">Pol</th>
                    <th scope="col">Sym</th>
                    <th scope="col">Fluor</th>
                    <th scope="col">Measurements</th>
                    <th scope="col" className={s.num}>Ratio</th>
                    <th scope="col" className={s.num}>Table</th>
                    <th scope="col" className={s.num}>Depth</th>
                    <th scope="col">Lab, certificate</th>
                    <th scope="col">Stock ID</th>
                    <th scope="col">Shipment</th>
                    <th scope="col">Price</th>
                    <th scope="col">
                      <span className={s.srOnly}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, shown).map((st) => {
                    const carted = inCart.has(st.id);
                    return (
                      <tr key={st.id} data-open={openId === st.id && drawerOpen ? "true" : undefined} onClick={() => open(st.id)}>
                        <td className={s.colCheck} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={compare.includes(st.id)}
                            disabled={!compare.includes(st.id) && compare.length >= 4}
                            onChange={() => setCompare(toggle(compare, st.id))}
                            aria-label={`Compare ${st.carat} ct ${SHAPE_LABEL[st.shape]}`}
                          />
                        </td>
                        <td>
                          <span className={s.shapeCell} data-summary={` · ${st.carat.toFixed(2)} ct · ${st.color} ${st.clarity}`}>
                            <ShapeIcon shape={st.shape} className={s.rowIcon} />
                            {SHAPE_LABEL[st.shape]}
                          </span>
                        </td>
                        <td className={`${s.num} ${s.strong}`}>{st.carat.toFixed(2)}</td>
                        <td className={s.strong}>{st.color}</td>
                        <td className={s.strong}>{st.clarity}</td>
                        <td>{short(st.cut)}</td>
                        <td>{short(st.polish)}</td>
                        <td>{short(st.symmetry)}</td>
                        <td>{st.fluorescence}</td>
                        <td className={s.nowrap}>{measurements(st)}</td>
                        <td className={s.num}>{st.ratio.toFixed(2)}</td>
                        <td className={s.num}>{st.tablePct.toFixed(1)}%</td>
                        <td className={s.num}>{st.depthPct.toFixed(1)}%</td>
                        <td className={s.nowrap}>
                          <span className={s.lab}>{st.lab}</span> {st.certificate}
                        </td>
                        <td className={s.nowrap}>{st.id}</td>
                        <td>
                          <span className={s.ship} data-source={st.source}>
                            {shipment(st)}
                          </span>
                        </td>
                        <td className={s.nowrap}>
                          {dealer ? (
                            <span className={s.priceCell}>On price list</span>
                          ) : (
                            <Link href={loginFor(st)} className={s.priceLock} onClick={(e) => e.stopPropagation()}>
                              Log in
                            </Link>
                          )}
                        </td>
                        <td className={s.actions} onClick={(e) => e.stopPropagation()}>
                          <button type="button" className={s.view} onClick={() => open(st.id)} aria-label={`Quick view, ${st.carat} ct ${SHAPE_LABEL[st.shape]}`}>
                            <svg aria-hidden viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                              <path d="M1.5 10S5 4 10 4s8.5 6 8.5 6-3.5 6-8.5 6-8.5-6-8.5-6Z" />
                              <circle cx="10" cy="10" r="2.5" />
                            </svg>
                          </button>
                          {dealer ? (
                            <button type="button" className={s.add} disabled={carted} onClick={() => add(st)}>
                              {carted ? "In cart" : "Add"}
                            </button>
                          ) : (
                            <Link href={loginFor(st)} className={s.add}>
                              Add
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {results.length > 0 && (
            <div className={s.loadRow}>
              <span className="tabular">
                Showing {Math.min(shown, results.length)} of {results.length}
              </span>
              {shown < results.length && (
                <button type="button" className={s.secondary} onClick={() => setShown((n) => n + PAGE)}>
                  Show {Math.min(PAGE, results.length - shown)} more
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {compared.length > 0 && (
        <div className={s.tray} role="region" aria-label="Compare stones">
          <div className={s.trayInner}>
            <ul className={s.trayList}>
              {compared.map((st) => (
                <li key={st.id}>
                  <ShapeIcon shape={st.shape} className={s.trayIcon} />
                  <span>
                    {st.carat.toFixed(2)} {st.color} {st.clarity}
                  </span>
                  <button type="button" onClick={() => setCompare(compare.filter((id) => id !== st.id))} aria-label={`Remove ${st.id} from compare`}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <span className={s.trayHint}>{compared.length < 4 ? `Pick up to ${4 - compared.length} more` : "Four stones picked"}</span>
            <button type="button" className={s.primary} disabled={compared.length < 2} onClick={() => setComparing(true)}>
              Compare {compared.length}
            </button>
          </div>
        </div>
      )}

      {comparing && (
        <div className={s.compareRoot} role="dialog" aria-modal="true" aria-label="Compare stones" data-lenis-prevent onKeyDown={(e) => e.key === "Escape" && setComparing(false)}>
          <div className={s.compareBackdrop} onClick={() => setComparing(false)} />
          <div className={s.compare}>
            <header className={s.compareHead}>
              <p className={s.compareTitle}>
                Compare <em>stones</em>
              </p>
              <button type="button" className={s.iconBtn} onClick={() => setComparing(false)} aria-label="Close compare" autoFocus>
                <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                  <path d="M3 3l10 10M13 3 3 13" />
                </svg>
              </button>
            </header>
            <div className={s.compareGrid} style={{ gridTemplateColumns: `140px repeat(${compared.length}, minmax(0, 1fr))` }}>
              <span />
              {compared.map((st) => (
                <div key={st.id} className={s.compareStone}>
                  <ShapeIcon shape={st.shape} detail className={s.compareIcon} />
                  <strong>
                    {st.carat.toFixed(2)} ct {SHAPE_LABEL[st.shape]}
                  </strong>
                </div>
              ))}
              {(
                [
                  ["Color", (st: Stone) => st.color],
                  ["Clarity", (st: Stone) => st.clarity],
                  ["Cut", (st: Stone) => st.cut ?? "N/A"],
                  ["Polish", (st: Stone) => st.polish],
                  ["Symmetry", (st: Stone) => st.symmetry],
                  ["Fluorescence", (st: Stone) => st.fluorescence],
                  ["Measurements", (st: Stone) => measurements(st)],
                  ["Ratio", (st: Stone) => st.ratio.toFixed(2)],
                  ["Table", (st: Stone) => `${st.tablePct.toFixed(1)}%`],
                  ["Depth", (st: Stone) => `${st.depthPct.toFixed(1)}%`],
                  ["Lab", (st: Stone) => `${st.lab} ${st.certificate}`],
                  ["Shipment", (st: Stone) => shipment(st)],
                  ["Stock ID", (st: Stone) => st.id],
                ] as [string, (st: Stone) => string][]
              ).map(([label, get]) => (
                <div key={label} className={s.compareRow}>
                  <span className={s.compareLabel}>{label}</span>
                  {compared.map((st) => (
                    <span key={st.id} className="tabular">
                      {get(st)}
                    </span>
                  ))}
                </div>
              ))}
              <span />
              {compared.map((st) => (
                <div key={st.id} className={s.compareDoors}>
                  <button
                    type="button"
                    className={s.secondary}
                    onClick={() => {
                      setComparing(false);
                      open(st.id);
                    }}
                  >
                    Quick view
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <StoneDrawer stone={openStone} open={drawerOpen} position={Math.max(position, 0)} total={results.length} onClose={() => setDrawerOpen(false)} onStep={step} />
    </>
  );
}
