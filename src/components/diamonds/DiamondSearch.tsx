"use client";

/**
 * The diamond page (BRD 5.3), one line per stone in the Nivoda manner dealers
 * already like (R-14), simplified after the client's feedback of 27 October
 * 2026 (F-B1 to F-B4, F-C1).
 *
 * Top: breadcrumb, title with the stone count, the dealer site's pricing note
 * and the sample feed notice. Then the quick filters (R-16): ten shape icons,
 * carat from and to with presets, color and clarity as ranges picked on
 * their scales, measurements (length, width, depth in mm) and cut; More
 * filters opens lab, polish, symmetry, fluorescence, ratio and source. The
 * sticky results bar holds the count, Next day delivery only, More filters,
 * Clear, Request Made to Order (always in reach) and a short Sort. The list
 * keeps the essentials: compare, shape, carat, color, clarity, cut,
 * measurements, lab, delivery, price and the row doors (Quick View, Add to
 * cart); every other specification is in Quick View. On phones each stone
 * becomes a compact card. A row opens Quick View (R-15).
 *
 * Stones on a placed order or on memo leave the list at once (R-18, B-01).
 * The Made to Order entry (R-19) sits above the list and in the bar,
 * carrying the search into the M2O request. Up to four stones can be
 * compared side by side. ?stone= opens a stone's Quick View directly, and
 * the filters can arrive in the address (query.ts, fromParams).
 *
 * Below the list, the story (DiamondStory) for retailers who are not dealers
 * yet; a signed-out visitor gets a line under the lead that jumps to it.
 */

import Link from "next/link";
import { Suspense, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import Assurance from "@/components/brand/Assurance";
import ShapeIcon from "@/components/brand/ShapeIcon";
import { CLARITIES, COLORS, FLUORESCENCE, GRADES, LABS, SHAPES, SHAPE_LABEL, measurements, shipment, shipsNextDay, stoneById, stones, type Grade, type Stone } from "@/content/diamonds";
import { account, brand } from "@/content/site";
import { addStone, useCart } from "@/lib/cart";
import { useDealer } from "@/lib/dealer";
import { useUnavailable } from "@/lib/memo";
import { EMPTY, PRICE_SORTS, SORT_LABEL, activeCount, describe, fromParams, hasMeasurements, m2oHref, matches, sortStones, type DiamondQuery, type SortKey } from "./query";
import StoneDrawer from "./StoneDrawer";
import DiamondStory from "./DiamondStory";
import { scrollToTarget } from "@/lib/scroll";
import s from "./diamonds.module.css";
import { formatUSD, stonePrice } from "@/lib/pricing";
import { CUTOFF_LABEL, formatLeft, useCutoffMinutes } from "@/lib/cutoff";

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

const MEASURES = [
  ["Length", "lengthMin", "lengthMax"],
  ["Width", "widthMin", "widthMax"],
  ["Depth", "depthMin", "depthMax"],
] as const;

/** Length, width and depth ranges in millimetres (F-B1; layout until Surreal's reference, C-16). */
function Measurements({ q, onChange }: { q: DiamondQuery; onChange: (patch: Partial<DiamondQuery>) => void }) {
  const num = (v: string) => (v === "" ? null : Number(v));
  return (
    <div className={s.filter}>
      <span className={s.filterLabel}>
        Measurements, mm
        {hasMeasurements(q) && (
          <button type="button" className={s.filterClear} onClick={() => onChange({ lengthMin: null, lengthMax: null, widthMin: null, widthMax: null, depthMin: null, depthMax: null })}>
            Any
          </button>
        )}
      </span>
      <div className={s.measure}>
        {MEASURES.map(([label, lo, hi]) => (
          <div key={label} className={s.measureRow}>
            <span>{label}</span>
            <input type="number" inputMode="decimal" step={0.1} min={0} placeholder="From" value={q[lo] ?? ""} onChange={(e) => onChange({ [lo]: num(e.target.value) })} aria-label={`${label} from, mm`} />
            <input type="number" inputMode="decimal" step={0.1} min={0} placeholder="To" value={q[hi] ?? ""} onChange={(e) => onChange({ [hi]: num(e.target.value) })} aria-label={`${label} to, mm`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
    </svg>
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

  // Filters in the address (the homepage shape strip, the site search) apply once per address.
  const linkedKey = params ? ["shape", "cmin", "cmax", "color", "clarity", "lab", "next"].map((k) => params.get(k) ?? "").join("|") : "";
  const [seenKey, setSeenKey] = useState("");
  if (linkedKey !== seenKey) {
    setSeenKey(linkedKey);
    const patch = fromParams(params);
    if (patch) setQ({ ...EMPTY, ...patch });
  }

  const update = (patch: Partial<DiamondQuery>) => {
    setQ((prev) => ({ ...prev, ...patch }));
    setShown(PAGE);
  };

  // Price sorts need a price: without a dealer the list falls back to the default order.
  const sort: SortKey = !dealer && PRICE_SORTS.includes(q.sort) ? "featured" : q.sort;
  const sorts = (Object.keys(SORT_LABEL) as SortKey[]).filter((k) => dealer || !PRICE_SORTS.includes(k));
  const left = useCutoffMinutes();

  const available = useMemo(() => stones.filter((st) => !gone.has(st.id)), [gone]);
  const results = useMemo(() => sortStones(available.filter((st) => matches(st, q)), sort), [available, q, sort]);
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
  /** A door in the story below: apply its filters (none keeps the search as it is) and go back up to the stones. */
  const applyFromStory = (patch: Partial<DiamondQuery>) => {
    if (Object.keys(patch).length) update({ ...EMPTY, sort: q.sort, ...patch });
    scrollToTarget("#diamonds-title", -180);
  };
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
              <p className={s.storyLink}>
                Programs:
                <Link href="/diamonds/made-to-order">Made to Order</Link>
                <span aria-hidden>·</span>
                <Link href="/legacy">Diamond Legacy</Link>
                <span aria-hidden>·</span>
                <Link href="/custom">Custom jewelry</Link>
              </p>
              {!dealer && (
                <p className={s.storyLink}>
                  New to Surreal?{" "}
                  <button type="button" onClick={() => scrollToTarget("#diamond-story", -60)}>
                    How our diamonds are grown
                  </button>
                  <span aria-hidden>·</span>
                  <Link href={account.apply}>Become a dealer</Link>
                </p>
              )}
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
            <Measurements q={q} onChange={update} />
            <Chips label="Cut (round)" options={["Ideal", "Excellent", "Very Good"] as const} value={q.cut.filter((c): c is "Ideal" | "Excellent" | "Very Good" => c !== "Good")} onChange={(v) => update({ cut: v })} />
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
              <Chips label="Lab" options={LABS} value={q.lab} onChange={(v) => update({ lab: v })} />
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
            <button type="button" className={s.nextDayBtn} aria-pressed={q.nextDay} onClick={() => update({ nextDay: !q.nextDay })}>
              <TruckIcon />
              Next day delivery
            </button>
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
          <div className={s.barRight}>
            <Link href={m2oHref(q)} className={s.m2oBtn}>
              <ShapeIcon shape={q.shapes[0] ?? "oval"} className={s.m2oBtnIcon} />
              Request Made to Order
            </Link>
            <label className={s.sort}>
              <span>Sort by</span>
              <select value={sort} onChange={(e) => update({ sort: e.target.value as SortKey })}>
                {sorts.map((k) => (
                  <option key={k} value={k}>
                    {SORT_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className={s.wrap}>
          {m2oBanner}
          <div className={s.listNote}>
            <span className={s.deliveryLine}>
              <span className={s.shipChip} data-next>
                <TruckIcon />
                Next day delivery
              </span>
              {left !== null ? (
                <span>
                  Order within <strong className="tabular">{formatLeft(left)}</strong> to receive it tomorrow.
                </span>
              ) : (
                <span>On stones marked so, for orders placed before {CUTOFF_LABEL}.</span>
              )}
              <span className={s.deliveryOther}>Supplier stones: lead time confirmed with your order.</span>
            </span>
            <span className={s.specHint}>Select a stone for every specification: polish, symmetry, fluorescence, ratio, table, depth and certificate.</span>
          </div>
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
                    <th scope="col">Measurements, mm</th>
                    <th scope="col">Lab</th>
                    <th scope="col">Delivery</th>
                    <th scope="col" className={s.num}>Price</th>
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
                        <td className={`${s.colCheck} ${s.cCheck}`} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={compare.includes(st.id)}
                            disabled={!compare.includes(st.id) && compare.length >= 4}
                            onChange={() => setCompare(toggle(compare, st.id))}
                            aria-label={`Compare ${st.carat} ct ${SHAPE_LABEL[st.shape]}`}
                          />
                        </td>
                        <td className={s.cShape}>
                          <span className={s.shapeCell} data-summary={` · ${st.carat.toFixed(2)} ct · ${st.color} ${st.clarity}`}>
                            <ShapeIcon shape={st.shape} className={s.rowIcon} />
                            {SHAPE_LABEL[st.shape]}
                          </span>
                        </td>
                        <td className={`${s.num} ${s.strong}`}>{st.carat.toFixed(2)}</td>
                        <td className={s.strong}>{st.color}</td>
                        <td className={s.strong}>{st.clarity}</td>
                        <td className={st.cut ? undefined : s.muted}>{short(st.cut)}</td>
                        <td className={`${s.nowrap} ${s.cMeasure}`}>
                          {st.length.toFixed(2)} × {st.width.toFixed(2)} × {st.depth.toFixed(2)}
                        </td>
                        <td>
                          <span className={s.lab}>{st.lab}</span>
                        </td>
                        <td className={s.cShip}>
                          <span className={s.shipChip} data-next={shipsNextDay(st) || undefined}>
                            {shipsNextDay(st) && <TruckIcon />}
                            {shipment(st)}
                          </span>
                        </td>
                        <td className={`${s.nowrap} ${s.num} ${s.cPrice}`}>
                          {dealer ? (
                            <span className={`${s.priceCell} tabular`}>{formatUSD(stonePrice(st))}</span>
                          ) : (
                            <Link href={loginFor(st)} className={s.priceLock} onClick={(e) => e.stopPropagation()}>
                              Log in
                            </Link>
                          )}
                        </td>
                        <td className={`${s.actions} ${s.cActions}`} onClick={(e) => e.stopPropagation()}>
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

      <DiamondStory onApply={applyFromStory} />

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
        <div className={s.compareRoot} role="dialog" aria-modal="true" aria-label="Compare stones" onKeyDown={(e) => e.key === "Escape" && setComparing(false)}>
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
