"use client";

/**
 * The console overview's charts, in plain HTML so they inherit the console's
 * type and need no library:
 *
 * - BarList: one measure across categories (stones by shape, by carat,
 *   pieces by category). Horizontal bars in one hue from a single baseline,
 *   14px thick with a rounded data end, the value at each tip. Hovering or
 *   focusing a bar shows its value and share of the total.
 * - ShareBar: parts of one whole along a single bar (receivables by age,
 *   dealer logins by status), the segments split by a 2px gap and coloured
 *   on an ordered ramp, with a legend that doubles as the table: every
 *   segment's label, value and share.
 *
 * Every chart has a table view, so no value depends on hover or on colour.
 */

import { useRef, useState, type ReactNode } from "react";
import s from "./admin.module.css";

export interface BarRow {
  key: string;
  label: string;
  value: number;
  icon?: ReactNode;
}

interface Tip {
  key: string;
  x: number;
  y: number;
}

const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%");

function ViewToggle({ table, onChange, label }: { table: boolean; onChange: (t: boolean) => void; label: string }) {
  return (
    <div className={s.vizToggle} role="group" aria-label={`${label}: chart or table`}>
      <button type="button" aria-pressed={!table} onClick={() => onChange(false)}>
        Chart
      </button>
      <button type="button" aria-pressed={table} onClick={() => onChange(true)}>
        Table
      </button>
    </div>
  );
}

export function ChartCard({ id, title, line, tools, children }: { id: string; title: string; line?: ReactNode; tools?: ReactNode; children: ReactNode }) {
  return (
    <section className={s.card} aria-labelledby={id}>
      <div className={s.cardHead}>
        <div>
          <h2 id={id} className={s.cardTitle}>
            {title}
          </h2>
          {line && <p className={s.muted}>{line}</p>}
        </div>
        {tools}
      </div>
      {children}
    </section>
  );
}

export function BarList({ id, title, line, dimension, rows, unit, format = (v) => v.toLocaleString("en-US") }: { id: string; title: string; line?: ReactNode; dimension: string; rows: BarRow[]; unit: string; format?: (v: number) => string }) {
  const [table, setTable] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);
  const plot = useRef<HTMLDivElement>(null);
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((n, r) => n + r.value, 0);

  // The tip sits above the hovered bar's end, kept inside the card.
  const show = (key: string, el: HTMLElement) => {
    const box = plot.current?.getBoundingClientRect();
    const bar = el.querySelector<HTMLElement>("[data-bar]")?.getBoundingClientRect();
    if (!box || !bar) return;
    setTip({ key, x: Math.max(0, Math.min(bar.right - box.left - 24, box.width - 200)), y: el.getBoundingClientRect().top - box.top });
  };
  const active = tip ? rows.find((r) => r.key === tip.key) : null;

  return (
    <ChartCard id={id} title={title} line={line} tools={<ViewToggle table={table} onChange={setTable} label={title} />}>
      {table ? (
        <table className={s.vizTable}>
          <thead>
            <tr>
              <th scope="col">{dimension}</th>
              <th scope="col">{unit[0].toUpperCase() + unit.slice(1)}</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.label}</th>
                <td>{format(r.value)}</td>
                <td>{pct(r.value, total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div ref={plot} className={s.barPlot} onPointerLeave={() => setTip(null)}>
          {rows.map((r) => (
            <div
              key={r.key}
              className={s.barRow}
              tabIndex={0}
              aria-label={`${r.label}: ${format(r.value)} ${unit}, ${pct(r.value, total)}`}
              data-active={tip?.key === r.key || undefined}
              onPointerEnter={(e) => show(r.key, e.currentTarget)}
              onFocus={(e) => show(r.key, e.currentTarget)}
              onBlur={() => setTip(null)}
            >
              <span className={s.barLabel}>
                {r.icon}
                {r.label}
              </span>
              <span className={s.barTrack}>
                <span data-bar className={s.barFill} style={{ width: `calc((100% - 48px) * ${r.value / max})` }} />
                <span className={s.barValue}>{format(r.value)}</span>
              </span>
            </div>
          ))}
          {active && tip && (
            <div className={s.vizTip} style={{ left: tip.x, top: tip.y }} role="presentation">
              <strong>
                {format(active.value)} {unit}
              </strong>
              <span>
                {active.label} · {pct(active.value, total)} of {format(total)}
              </span>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
}

export interface Segment {
  key: string;
  label: string;
  value: number;
  /** A step on the chart's ordered ramp. */
  tone: string;
}

export function ShareBar({ label, segments, format = (v) => v.toLocaleString("en-US"), unit }: { label: string; segments: Segment[]; format?: (v: number) => string; unit?: string }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const plot = useRef<HTMLDivElement>(null);
  const total = segments.reduce((n, g) => n + g.value, 0);
  const on = segments.filter((g) => g.value > 0);
  const active = tip ? segments.find((g) => g.key === tip.key) : null;

  const show = (key: string, el: HTMLElement) => {
    const box = plot.current?.getBoundingClientRect();
    const seg = el.getBoundingClientRect();
    if (!box) return;
    setTip({ key, x: seg.left - box.left + seg.width / 2, y: seg.top - box.top });
  };

  return (
    <div className={s.share}>
      <div ref={plot} className={s.sharePlot} onPointerLeave={() => setTip(null)}>
        <div className={s.shareBar} role="img" aria-label={`${label}: ${on.map((g) => `${g.label} ${format(g.value)}`).join(", ")}`}>
          {on.map((g) => (
            <span
              key={g.key}
              className={s.shareSeg}
              data-tone={g.tone}
              style={{ flexGrow: g.value }}
              tabIndex={0}
              aria-label={`${g.label}: ${format(g.value)}, ${pct(g.value, total)}`}
              data-active={tip?.key === g.key || undefined}
              onPointerEnter={(e) => show(g.key, e.currentTarget)}
              onFocus={(e) => show(g.key, e.currentTarget)}
              onBlur={() => setTip(null)}
            />
          ))}
          {on.length === 0 && <span className={s.shareEmpty} />}
        </div>
        {active && tip && (
          <div className={`${s.vizTip} ${s.vizTipCenter}`} style={{ left: tip.x, top: tip.y }} role="presentation">
            <strong>
              {format(active.value)}
              {unit ? ` ${unit}` : ""}
            </strong>
            <span>
              {active.label} · {pct(active.value, total)}
            </span>
          </div>
        )}
      </div>
      <table className={s.shareLegend}>
        <caption className={s.srOnly}>{label}</caption>
        <tbody>
          {segments.map((g) => (
            <tr key={g.key}>
              <th scope="row">
                <span className={s.legendKey}>
                  <span className={s.swatch} data-tone={g.tone} aria-hidden />
                  {g.label}
                </span>
              </th>
              <td>{format(g.value)}</td>
              <td>{pct(g.value, total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
