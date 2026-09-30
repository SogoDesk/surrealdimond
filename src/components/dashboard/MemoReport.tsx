"use client";

/**
 * Open memo items (BRD R-28), inside the dashboard shell: the live site's
 * memo reconciliation, rebuilt. The table has the live columns (Sold?, memo
 * date, memo number, stock number, price, shape, size, cut, color, clarity)
 * plus days on memo, colored by age (up to 30 days, 31 to 60, over 60). Above
 * it: the figures (items, carats, stones and jewelry, the oldest item, the
 * last reconciliation) and filters (stones or jewelry, search, sort).
 *
 * Reconciliation follows the live form: tick the items sold, confirm the
 * list is accurate, or note a discrepancy, then send; the report gets an RC
 * number and the sold items are tagged "Reported sold". The data
 * is the dealer's memo requests from the diamond page; the demo account also
 * shows labelled sample lines (src/content/memoSample.ts). RightClick
 * supplies the real memo with daily prices (C-07). Download as CSV.
 */

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import ShapeIcon from "@/components/brand/ShapeIcon";
import { formatCarat, metals, productById, productHref, type Product } from "@/content/catalog";
import { SHAPE_LABEL, stoneById, type StoneShape } from "@/content/diamonds";
import { sampleMemo } from "@/content/memoSample";
import { brand } from "@/content/site";
import { downloadCsv } from "@/lib/csv";
import { useDealer } from "@/lib/dealer";
import { useNow } from "@/lib/useNow";
import { sendMemoReport, useMemoReports, useMemos, type MemoReport as Report } from "@/lib/memo";
import s from "./pages.module.css";

interface MemoLine {
  id: string;
  memo: string;
  date: string;
  stock: string;
  kind: "stone" | "jewelry";
  title: string;
  shape?: StoneShape;
  carat: number;
  cut?: string;
  color?: string;
  clarity?: string;
  sample: boolean;
  href?: string;
}

type Kind = "all" | "stone" | "jewelry";
type Sort = "oldest" | "newest" | "carat";
const day = 864e5;
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const age = (iso: string, now: number) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / day));
const band = (days: number) => (days > 60 ? "long" : days > 30 ? "watch" : "current");

export default function MemoReport() {
  const dealer = useDealer();
  const memos = useMemos();
  const now = useNow();
  const reports = useMemoReports();
  const [kind, setKind] = useState<Kind>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("oldest");
  const [sold, setSold] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState<Report | null>(null);

  const lines = useMemo<MemoLine[]>(() => {
    const fromRequests: MemoLine[] = memos.map((m) => {
      const st = stoneById(m.stoneId);
      return {
        id: `${m.number}|${m.stoneId}`,
        memo: m.number,
        date: m.requestedAt,
        stock: m.stoneId,
        kind: "stone",
        title: st ? `${st.carat.toFixed(2)} ct ${SHAPE_LABEL[st.shape]}` : `Stone ${m.stoneId}`,
        shape: st?.shape,
        carat: st?.carat ?? 0,
        cut: st?.cut ?? undefined,
        color: st?.color,
        clarity: st?.clarity,
        sample: false,
        href: `/diamonds?stone=${m.stoneId}`,
      };
    });
    const samples: MemoLine[] = dealer?.demo
      ? sampleMemo.map((x) => {
          const p: Product | undefined = x.productId ? productById(x.productId) : undefined;
          return {
            id: `${x.memo}|${x.stock}`,
            memo: x.memo,
            date: new Date(now - x.daysAgo * day).toISOString(),
            stock: x.stock,
            kind: x.kind,
            title: x.kind === "jewelry" ? `${p?.name ?? "Jewelry"}, ${metals.find((m) => m.id === x.metal)?.label ?? ""}` : `${x.carat.toFixed(2)} ct ${x.shape ? SHAPE_LABEL[x.shape] : ""}`,
            shape: x.shape,
            carat: x.carat,
            cut: x.cut,
            color: x.color,
            clarity: x.clarity,
            sample: true,
            href: p ? productHref(p) : undefined,
          };
        })
      : [];
    return [...fromRequests, ...samples];
  }, [memos, dealer?.demo, now]);

  const reportedSold = useMemo(() => new Set(reports.flatMap((r) => r.sold)), [reports]);
  const open = lines.filter((l) => !reportedSold.has(l.id));
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = lines.filter((l) => (kind === "all" || l.kind === kind) && (!term || [l.memo, l.stock, l.title, l.color, l.clarity].join(" ").toLowerCase().includes(term)));
    return list.sort((a, b) => (sort === "carat" ? b.carat - a.carat : sort === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
  }, [lines, kind, q, sort]);

  const carats = Math.round(open.reduce((n, l) => n + l.carat, 0) * 100) / 100;
  const oldest = open.reduce((n, l) => Math.max(n, age(l.date, now)), 0);
  const stonesCount = open.filter((l) => l.kind === "stone").length;

  const toggleSold = (id: string) =>
    setSold((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (sold.size === 0 && !confirmed && !note.trim()) {
      setError("Tick the items sold, confirm the list, or note a discrepancy.");
      return;
    }
    setError("");
    const report = sendMemoReport({ sold: [...sold], confirmed, note: note.trim() });
    setSent(report);
    setSold(new Set());
    setConfirmed(false);
    setNote("");
  };

  const exportCsv = () =>
    downloadCsv(`surreal-memo-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Memo date", "Memo number", "Stock number", "Item", "Shape", "Size (ct)", "Cut", "Color", "Clarity", "Days on memo", "Reported sold"],
      ...shown.map((l) => [l.date.slice(0, 10), l.memo, l.stock, l.title, l.shape ? SHAPE_LABEL[l.shape] : "", l.carat.toFixed(2), l.cut ?? "", l.color ?? "", l.clarity ?? "", age(l.date, now), reportedSold.has(l.id) ? "Yes" : ""]),
    ]);

  return (
    <div className={s.page}>
      <nav aria-label="Breadcrumb" className={s.crumbs}>
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden>/</span>
        <span aria-current="page">Open memo items</span>
      </nav>
      <header className={s.head}>
        <div>
          <p className={s.kicker}>Memo reconciliation</p>
          <h1 className={s.title}>
            Open <em>memo items</em>
          </h1>
          <p className={s.lead}>Your long-term memo diamonds and jewelry, with prices updated daily. Report what has sold, and confirm the list or tell us what differs.</p>
        </div>
        <Link href="/diamonds" className={s.secondary}>
          Request a stone on memo
        </Link>
      </header>

      {dealer?.demo && (
        <p className={s.sampleNote}>
          <strong>Sample memo.</strong> The demo account shows sample lines, marked Sample. Your memo arrives from Surreal&apos;s inventory system with daily prices.
        </p>
      )}

      <dl className={s.figures}>
        <div>
          <dt>Items on memo</dt>
          <dd className="tabular">{open.length}</dd>
          <span>
            {stonesCount} {stonesCount === 1 ? "stone" : "stones"}, {open.length - stonesCount} jewelry
          </span>
        </div>
        <div>
          <dt>Total carats</dt>
          <dd className="tabular">{carats}</dd>
          <span>Across open items</span>
        </div>
        <div>
          <dt>Oldest item</dt>
          <dd className="tabular">{oldest}</dd>
          <span>Days on memo</span>
        </div>
        <div>
          <dt>Last reconciled</dt>
          <dd className={s.figureSmall}>{reports[0] ? shortDate(reports[0].sentAt) : "Not yet"}</dd>
          <span>{reports[0] ? reports[0].number : "Send your first report below"}</span>
        </div>
      </dl>

      {lines.length === 0 ? (
        <div className={s.emptyBig}>
          <p className={s.emptyTitle}>Nothing on memo</p>
          <p>Stones you request on memo from the diamond search appear here for reconciliation.</p>
          <Link href="/diamonds" className={s.primary}>
            Find a stone
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className={s.toolbar}>
            <div className={s.chips} role="group" aria-label="Show">
              {(["all", "stone", "jewelry"] as Kind[]).map((k) => (
                <button key={k} type="button" className={s.chip} aria-pressed={kind === k} onClick={() => setKind(k)}>
                  {k === "all" ? "All items" : k === "stone" ? "Diamonds" : "Jewelry"}
                </button>
              ))}
            </div>
            <label className={s.searchBox}>
              <span className={s.srOnly}>Search memo</span>
              <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <circle cx="9" cy="9" r="5.5" />
                <path d="m13.5 13.5 3.5 3.5" />
              </svg>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Memo or stock number, grade" />
            </label>
            <label className={s.sortBox}>
              <span>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="oldest">Longest on memo</option>
                <option value="newest">Newest first</option>
                <option value="carat">Largest first</option>
              </select>
            </label>
            <button type="button" className={s.textBtn} onClick={exportCsv}>
              Download CSV
            </button>
          </div>

          <div className={s.legend} aria-hidden>
            <span data-band="current">Up to 30 days</span>
            <span data-band="watch">31 to 60 days</span>
            <span data-band="long">Over 60 days</span>
          </div>

          <div className={s.memoWrap}>
            <table className={s.memoTable}>
              <thead>
                <tr>
                  <th scope="col">Sold</th>
                  <th scope="col">Memo date</th>
                  <th scope="col">Memo</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Item</th>
                  <th scope="col">Size</th>
                  <th scope="col">Cut</th>
                  <th scope="col">Color</th>
                  <th scope="col">Clarity</th>
                  <th scope="col">Price</th>
                  <th scope="col">Days</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((l) => {
                  const days = age(l.date, now);
                  const done = reportedSold.has(l.id);
                  return (
                    <tr key={l.id} data-sold={done ? "" : undefined} data-picked={sold.has(l.id) ? "" : undefined}>
                      <td>
                        <input type="checkbox" className={s.check} checked={done || sold.has(l.id)} disabled={done} onChange={() => toggleSold(l.id)} aria-label={`Sold: ${l.title}, stock ${l.stock}`} />
                      </td>
                      <td>{shortDate(l.date)}</td>
                      <td className="tabular">{l.memo}</td>
                      <td className="tabular">{l.stock}</td>
                      <td className={s.itemCell}>
                        <span className={s.itemIcon} aria-hidden>
                          {l.shape ? <ShapeIcon shape={l.shape} /> : <span className={s.jewelDot} />}
                        </span>
                        <span className={s.itemText}>
                          {l.href ? (
                            <Link href={l.href} className={s.lineName}>
                              {l.title}
                            </Link>
                          ) : (
                            <span className={s.lineName}>{l.title}</span>
                          )}
                          <span className={s.itemTags}>
                            {l.kind === "jewelry" ? "Jewelry" : "Loose diamond"}
                            {l.sample && <span className={s.sampleTag}>Sample</span>}
                            {done && <span className={s.soldTag}>Reported sold</span>}
                          </span>
                        </span>
                      </td>
                      <td className="tabular">{l.kind === "jewelry" ? formatCarat(l.carat) + " tw" : l.carat.toFixed(2)}</td>
                      <td>{l.cut ?? "N/A"}</td>
                      <td>{l.color ?? "N/A"}</td>
                      <td>{l.clarity ?? "N/A"}</td>
                      <td className={s.price}>On price list</td>
                      <td>
                        <span className={s.age} data-band={band(days)}>
                          {days}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {shown.length === 0 && <p className={s.count}>No memo items match.</p>}
          </div>

          <section className={s.reconcile} aria-labelledby="reconcile-title">
            <div>
              <h2 id="reconcile-title" className={s.panelTitle}>
                Reconcile your memo
              </h2>
              <p className={s.reconcileLine}>
                {sold.size > 0 ? `${sold.size} ${sold.size === 1 ? "item" : "items"} ticked as sold.` : "Tick any item you have sold in the Sold column."} Sold items are replaced right away.
              </p>
            </div>
            <label className={s.confirm}>
              <input type="checkbox" className={s.check} checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              <span>I confirm the list above is accurate</span>
            </label>
            <label className={s.noteField}>
              <span className={s.label}>
                Note a discrepancy<span className={s.optional}> (optional)</span>
              </span>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example, stock SD085918 is not in our store" />
            </label>
            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}
            <div className={s.reconcileDoors}>
              <button type="submit" className={s.primary}>
                Send reconciliation
              </button>
              <span className={s.hintText}>
                Questions about your memo? Call {brand.office.phone} or{" "}
                <Link href="/contact?type=order" className={s.textLink}>
                  send us a note
                </Link>
                .
              </span>
            </div>
            {sent && (
              <p className={s.notice} role="status">
                Reconciliation {sent.number} sent{sent.sold.length ? `, ${sent.sold.length} ${sent.sold.length === 1 ? "item" : "items"} reported sold` : ""}
                {sent.confirmed ? ", list confirmed" : ""}
                {sent.note ? ", with your note" : ""}. Preview: it is kept in this browser until the memo system connects.
              </p>
            )}
          </section>
        </form>
      )}
    </div>
  );
}
