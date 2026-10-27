"use client";

/**
 * Inventory (BRD R-32): the full view, in two tabs.
 *
 * Jewelry: every piece with its render, style number, category, the metals
 * it is offered in and its default metal (R-12, R-13, C-02), both editable:
 * a toggle per metal (a metal with no render yet shows the made to order
 * placeholder until one is added) and the metal it opens in, with a reset to
 * the catalog's own. Then two switches that
 * write to the storefront at once (R-33): Hot this week on the homepage, and
 * Featured to the top of its category page. Search, category filter, CSV.
 *
 * Diamonds: every stone in the feed with its grades, lab and certificate,
 * source and status (available, on memo, ordered; B-01), a link to the
 * stone on the diamond page. Search by stock or certificate, shape and
 * status filters, CSV. The feed is the sample until RightClick (C-07).
 *
 * A view-only role sees the switches disabled.
 */

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import ShapeIcon from "@/components/brand/ShapeIcon";
import { categories, categoryLabel, defaultMetalOf, imageMetals, metals, productMetals, products, renderSrc, styleRef, type Category, type Metal, type Product } from "@/content/catalog";
import { SHAPES, SHAPE_LABEL, stones, type StoneShape } from "@/content/diamonds";
import { groundStyle } from "@/content/grounds";
import { useOrders } from "@/lib/cart";
import { downloadCsv } from "@/lib/csv";
import { setMerch, useMerch } from "@/lib/merch";
import { clearMetalOption, setMetalOption, useMetalOptions, withMetals } from "@/lib/metals";
import { useMemos } from "@/lib/memo";
import { useOrderWorkMap, workOf } from "@/lib/orderStatus";
import { useAdminAccess } from "./AdminShell";
import s from "./admin.module.css";

type Tab = "jewelry" | "diamonds";
type StoneStatus = "available" | "memo" | "ordered";
const STATUS_LABEL: Record<StoneStatus, string> = { available: "Available", memo: "On memo", ordered: "Ordered" };
const PAGE = 40;
const metalLabel = (id: string) => metals.find((m) => m.id === id)?.label ?? id;

function Switch({ on, label, disabled, onChange }: { on: boolean; label: string; disabled: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={s.switch} disabled={disabled} onClick={onChange}>
      <span />
    </button>
  );
}

export default function AdminInventory() {
  const access = useAdminAccess();
  const readOnly = access !== "edit";
  const merch = useMerch();
  const metalOptions = useMetalOptions();
  const orders = useOrders();
  const memos = useMemos();
  const [tab, setTab] = useState<Tab>("jewelry");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [shape, setShape] = useState<StoneShape | "all">("all");
  const [status, setStatus] = useState<StoneStatus | "all">("all");
  const [shown, setShown] = useState(PAGE);

  const orderWork = useOrderWorkMap();
  const ordered = useMemo(() => new Set(orders.filter((o) => workOf(orderWork, o).status !== "cancelled").flatMap((o) => o.lines.map((l) => l.stoneId).filter(Boolean) as string[])), [orders, orderWork]);
  const onMemo = useMemo(() => new Set(memos.map((m) => m.stoneId)), [memos]);
  const stoneStatus = (id: string): StoneStatus => (ordered.has(id) ? "ordered" : onMemo.has(id) ? "memo" : "available");

  const pieces = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products
      .filter((p) => (cat === "all" || p.category === cat) && (!term || [p.name, p.detail, styleRef(p) ?? "", p.id].join(" ").toLowerCase().includes(term)))
      .map((p) => withMetals(p, metalOptions));
  }, [q, cat, metalOptions]);

  const toggleMetal = (p: Product, m: Metal) => {
    const on = productMetals(p);
    const next = on.includes(m) ? on.filter((x) => x !== m) : [...on, m];
    if (next.length) setMetalOption(p.id, next, defaultMetalOf(p));
  };

  const gems = useMemo(() => {
    const term = q.trim().toLowerCase();
    return stones.filter(
      (st) =>
        (shape === "all" || st.shape === shape) &&
        (status === "all" || (ordered.has(st.id) ? "ordered" : onMemo.has(st.id) ? "memo" : "available") === status) &&
        (!term || [st.id, st.certificate, st.color, st.clarity].join(" ").toLowerCase().includes(term)),
    );
  }, [q, shape, status, ordered, onMemo]);

  const toggleHot = (id: string) => setMerch((m) => ({ ...m, hot: m.hot.includes(id) ? m.hot.filter((x) => x !== id) : [...m.hot, id] }));
  const togglePin = (id: string, page: string) =>
    setMerch((m) => {
      const list = m.pins[page] ?? [];
      return { ...m, pins: { ...m.pins, [page]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] } };
    });

  const switchTab = (t: Tab) => {
    setTab(t);
    setQ("");
    setShown(PAGE);
  };

  const exportCsv = () =>
    tab === "jewelry"
      ? downloadCsv("surreal-jewelry.csv", [
          ["Id", "Name", "Style", "Category", "Metals", "Default metal", "Hot this week", "Featured on its page"],
          ...pieces.map((p) => [p.id, p.name, styleRef(p) ?? "", categoryLabel(p.category), productMetals(p).map(metalLabel).join(" / "), metalLabel(defaultMetalOf(p)), merch.hot.includes(p.id) ? "Yes" : "", (merch.pins[p.category] ?? []).includes(p.id) ? "Yes" : ""]),
        ])
      : downloadCsv("surreal-diamonds.csv", [
          ["Stock", "Shape", "Carat", "Color", "Clarity", "Cut", "Polish", "Symmetry", "Fluorescence", "Lab", "Certificate", "Source", "Status"],
          ...gems.map((st) => [st.id, SHAPE_LABEL[st.shape], st.carat.toFixed(2), st.color, st.clarity, st.cut ?? "", st.polish, st.symmetry, st.fluorescence, st.lab, st.certificate, st.source, STATUS_LABEL[stoneStatus(st.id)]]),
        ]);

  return (
    <div className={s.page}>
      <header className={s.pageHead}>
        <div>
          <p className={s.kicker}>Inventory</p>
          <h1 className={s.pageTitle}>Every piece and stone</h1>
          <p className={s.pageLine}>
            Changes here reach the storefront straight away: the metals each piece is offered in and the one it opens in, Hot this week on the
            homepage, and featured pieces at the top of their category page. A metal marked * has no render yet and shows the made to order
            placeholder.
          </p>
        </div>
      </header>

      <div className={s.tabs} role="tablist" aria-label="Inventory">
        <button type="button" role="tab" aria-selected={tab === "jewelry"} className={s.tab} onClick={() => switchTab("jewelry")}>
          Jewelry <span>{products.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "diamonds"} className={s.tab} onClick={() => switchTab("diamonds")}>
          Diamonds <span>{stones.length}</span>
        </button>
      </div>

      <div className={s.toolbar}>
        <label className={s.search}>
          <span className={s.srOnly}>Search</span>
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder={tab === "jewelry" ? "Name, style number or design" : "Stock ID, certificate or grade"} />
        </label>
        {tab === "jewelry" ? (
          <select className={s.select} value={cat} onChange={(e) => setCat(e.target.value as Category | "all")} aria-label="Category">
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        ) : (
          <>
            <select className={s.select} value={shape} onChange={(e) => { setShape(e.target.value as StoneShape | "all"); setShown(PAGE); }} aria-label="Shape">
              <option value="all">All shapes</option>
              {SHAPES.map((sh) => (
                <option key={sh} value={sh}>
                  {SHAPE_LABEL[sh]}
                </option>
              ))}
            </select>
            <select className={s.select} value={status} onChange={(e) => { setStatus(e.target.value as StoneStatus | "all"); setShown(PAGE); }} aria-label="Status">
              <option value="all">Any status</option>
              <option value="available">Available</option>
              <option value="memo">On memo</option>
              <option value="ordered">Ordered</option>
            </select>
          </>
        )}
        <span className={s.count}>{tab === "jewelry" ? `${pieces.length} pieces` : `${gems.length} stones`}</span>
        <button type="button" className={s.textBtn} onClick={exportCsv}>
          Download CSV
        </button>
      </div>

      {tab === "diamonds" && <p className={s.note}>Sample feed. The live list comes from RightClick and the supplier feeds, refreshed about every 30 minutes.</p>}

      <div className={s.tableWrap}>
        {tab === "jewelry" ? (
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Piece</th>
                <th scope="col">Style</th>
                <th scope="col">Category</th>
                <th scope="col">Metals</th>
                <th scope="col">Default</th>
                <th scope="col">Hot this week</th>
                <th scope="col">Featured on its page</th>
              </tr>
            </thead>
            <tbody>
              {pieces.slice(0, shown).map((p) => (
                <tr key={p.id}>
                  <th scope="row">
                    <span className={s.piece}>
                      <span className={s.pieceThumb} style={groundStyle(p.category)}>
                        <Image src={renderSrc(p.image)} alt="" width={120} height={120} sizes="44px" />
                      </span>
                      <span>
                        <Link href={`/jewelry/${p.category}/${p.id}`} className={s.pieceName} target="_blank" rel="noreferrer">
                          {p.name}
                        </Link>
                        <span className={s.muted}>{p.detail}</span>
                      </span>
                    </span>
                  </th>
                  <td className="tabular">{styleRef(p) ?? "None"}</td>
                  <td>{categoryLabel(p.category)}</td>
                  <td>
                    <span className={s.metalToggles} role="group" aria-label={`Metals for ${p.name}`}>
                      {metals.map((m) => {
                        const on = productMetals(p).includes(m.id);
                        const pictured = imageMetals(p).includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            className={s.metalToggle}
                            aria-pressed={on}
                            disabled={readOnly || (on && productMetals(p).length === 1)}
                            title={`${m.label}${pictured ? "" : ", no render yet"}`}
                            onClick={() => toggleMetal(p, m.id)}
                          >
                            <span style={{ background: m.swatch }} />
                            {m.id.toUpperCase()}
                            {!pictured && on && <em aria-label="no render yet">*</em>}
                          </button>
                        );
                      })}
                    </span>
                  </td>
                  <td>
                    <span className={s.defaultCell}>
                      <select
                        className={s.selectSm}
                        value={defaultMetalOf(p)}
                        disabled={readOnly || productMetals(p).length < 2}
                        aria-label={`Default metal for ${p.name}`}
                        onChange={(e) => setMetalOption(p.id, productMetals(p), e.target.value as Metal)}
                      >
                        {metals
                          .filter((m) => productMetals(p).includes(m.id))
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                      </select>
                      {metalOptions[p.id] && !readOnly && (
                        <button type="button" className={s.textBtn} onClick={() => clearMetalOption(p.id)}>
                          Reset
                        </button>
                      )}
                    </span>
                  </td>
                  <td>
                    <Switch on={merch.hot.includes(p.id)} label={`Hot this week: ${p.name}`} disabled={readOnly} onChange={() => toggleHot(p.id)} />
                  </td>
                  <td>
                    <Switch on={(merch.pins[p.category] ?? []).includes(p.id)} label={`Featured on ${categoryLabel(p.category)}: ${p.name}`} disabled={readOnly} onChange={() => togglePin(p.id, p.category)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Stock</th>
                <th scope="col">Shape</th>
                <th scope="col">Carat</th>
                <th scope="col">Color</th>
                <th scope="col">Clarity</th>
                <th scope="col">Cut</th>
                <th scope="col">Lab, certificate</th>
                <th scope="col">Source</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className={s.srOnly}>View</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {gems.slice(0, shown).map((st) => {
                const stt = stoneStatus(st.id);
                return (
                  <tr key={st.id}>
                    <th scope="row" className="tabular">
                      {st.id}
                    </th>
                    <td>
                      <span className={s.shapeCell}>
                        <ShapeIcon shape={st.shape} className={s.shapeIcon} />
                        {SHAPE_LABEL[st.shape]}
                      </span>
                    </td>
                    <td className="tabular">{st.carat.toFixed(2)}</td>
                    <td>{st.color}</td>
                    <td>{st.clarity}</td>
                    <td>{st.cut ?? "N/A"}</td>
                    <td className="tabular">
                      {st.lab} {st.certificate}
                    </td>
                    <td>{st.source === "surreal" ? "Surreal" : "Supplier"}</td>
                    <td>
                      <span className={s.statusChip} data-status={stt}>
                        {STATUS_LABEL[stt]}
                      </span>
                    </td>
                    <td>
                      <Link href={`/diamonds?stone=${st.id}`} className={s.textBtn} target="_blank" rel="noreferrer">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {(tab === "jewelry" ? pieces.length : gems.length) > shown && (
        <button type="button" className={s.more} onClick={() => setShown((n) => n + PAGE)}>
          Show {PAGE} more
        </button>
      )}
    </div>
  );
}
