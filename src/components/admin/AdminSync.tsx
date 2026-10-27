"use client";

/**
 * RightClick sync (F-E4, F-E5): what the site pulls from RightClick and how
 * often, with the API call budget against RightClick's limit of 30 calls a
 * minute. Intervals and the dealer traffic estimates are editable, and the
 * budget follows, so a refresh interval can be checked before it is chosen.
 * Until RightClick is connected (C-07) the connection card says so and no
 * call is made. The plan is in src/lib/sync.ts and docs/RIGHTCLICK.md.
 *
 * Administrator and Manager edit; Finance and Sales view; HR has no access.
 */

import { BUSINESS_HOURS, ON_DEMAND, QUEUE_PER_MINUTE, RC_LIMIT_PER_MINUTE, SYNC_JOBS, budget, everyLabel, resetSyncSettings, setSyncSettings, useSyncSettings, type SyncSettings } from "@/lib/sync";
import { useAdminAccess } from "./AdminShell";
import s from "./admin.module.css";

const PRESETS: { id: string; label: string; every: Record<string, number> }[] = [
  { id: "near", label: "Near real time", every: { changes: 1, stones: 15, jewelry: 30, invoices: 5, receipts: 5, memo: 15, customers: 15 } },
  { id: "recommended", label: "Recommended", every: {} },
  { id: "light", label: "Light", every: { changes: 30, stones: 240, jewelry: 1440, invoices: 60, receipts: 60, memo: 240, customers: 1440 } },
];

const VERDICT = {
  comfortable: "Comfortably under the limit",
  tight: "Workable, but close to the queue's ceiling",
  over: "Over the queue's ceiling: lengthen some intervals",
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const HOW = [
  ["One queue, one session", "Every call waits its turn, one every 3 seconds at most, on one stored session from one fixed address."],
  ["Bulk, not per item", "One call brings every customer's open invoices; one brings every stock movement since the last run."],
  ["Changes often, full lists less often", "The light movements call keeps the diamond page current; the full stone list catches anything missed."],
  ["Per dealer only on demand", "A dealer's balance and statement are fetched when they open Billing, then kept for 15 minutes."],
  ["Live check before selling", "Ordering or memoing a stone checks it live and places a hold in RightClick first, so nothing sells twice."],
  ["Last good data on failure", "If RightClick does not answer, the site keeps the last good data with its time, retries with growing gaps, and shows it here."],
];

export default function AdminSync() {
  const access = useAdminAccess();
  const readOnly = access !== "edit";
  const settings = useSyncSettings();
  const b = budget(settings);

  const setEvery = (id: string, minutes: number) => setSyncSettings((cur: SyncSettings) => ({ ...cur, every: { ...cur.every, [id]: minutes } }));
  const setPerHour = (id: string, n: number) => setSyncSettings((cur: SyncSettings) => ({ ...cur, perHour: { ...cur.perHour, [id]: Math.max(0, Math.min(10000, n)) } }));
  const applyPreset = (every: Record<string, number>) => setSyncSettings((cur: SyncSettings) => ({ ...cur, every: { ...Object.fromEntries(SYNC_JOBS.map((j) => [j.id, j.every])), ...every } }));
  const presetOn = (every: Record<string, number>) => SYNC_JOBS.every((j) => (settings.every[j.id] ?? j.every) === (every[j.id] ?? j.every));

  const pct = (n: number) => `${Math.min(100, (n / RC_LIMIT_PER_MINUTE) * 100)}%`;

  return (
    <div className={s.page}>
      <header className={s.pageHead}>
        <div>
          <p className={s.kicker}>RightClick sync</p>
          <h1 className={s.pageTitle}>Stock, invoices and memo from RightClick</h1>
          <p className={s.pageLine}>
            What the site pulls from RightClick, how often, and what that costs in API calls. RightClick blocks any address that makes more than {RC_LIMIT_PER_MINUTE} calls a minute, so
            the plan pulls in bulk and only what changed. Change an interval to see the budget move.
          </p>
        </div>
      </header>

      <section className={s.syncStatus} aria-labelledby="conn-title">
        <span className={s.syncDot} data-state="off" aria-hidden />
        <div>
          <h2 id="conn-title" className={s.cardTitle}>
            Not connected yet
          </h2>
          <p className={s.muted}>
            Waiting on RightClick access (C-07): an API user for the site with its key, password and serial number, and our fixed address allowed. Until then the diamond page,
            invoices and memo run on sample data, and no call is made.
          </p>
        </div>
        <dl className={s.syncLast}>
          <div>
            <dt>Last good sync</dt>
            <dd>None yet</dd>
          </div>
          <div>
            <dt>Session</dt>
            <dd>None</dd>
          </div>
        </dl>
      </section>

      <dl className={`${s.stats} ${s.statsFour}`}>
        <div className={s.stat}>
          <dt>Calls a day</dt>
          <dd>{fmt(b.perDay)}</dd>
          <span>
            {fmt(b.scheduledPerDay)} scheduled, {fmt(b.onDemandPerDay)} from dealers
          </span>
        </div>
        <div className={s.stat}>
          <dt>Busy-hour average</dt>
          <dd>{b.busyAverage.toFixed(1)}</dd>
          <span>Calls a minute, of {RC_LIMIT_PER_MINUTE} allowed</span>
        </div>
        <div className={s.stat}>
          <dt>Worst minute</dt>
          <dd>{b.worstMinute}</dd>
          <span>Every job at once; the queue clears it in {b.drainSeconds} s</span>
        </div>
        <div className={s.stat}>
          <dt>A month</dt>
          <dd>{fmt(b.perDay * 30)}</dd>
          <span>Calls, if CFI bills per call</span>
        </div>
      </dl>

      <section className={s.card} aria-labelledby="budget-title">
        <div className={s.cardHead}>
          <div>
            <h2 id="budget-title" className={s.cardTitle}>
              Calls a minute
            </h2>
            <p className={s.muted}>Busy-hour average against the queue&apos;s ceiling ({QUEUE_PER_MINUTE}) and RightClick&apos;s limit ({RC_LIMIT_PER_MINUTE}).</p>
          </div>
          <span className={s.statusChip} data-status={b.verdict === "comfortable" ? "active" : b.verdict === "tight" ? "memo" : "error"}>
            {VERDICT[b.verdict]}
          </span>
        </div>
        <div className={s.meterBar} role="img" aria-label={`${b.busyAverage.toFixed(1)} calls a minute on average; queue ceiling ${QUEUE_PER_MINUTE}; limit ${RC_LIMIT_PER_MINUTE}`}>
          <span className={s.meterFill} style={{ width: pct(b.busyAverage) }} />
          <span className={s.meterMark} style={{ left: pct(QUEUE_PER_MINUTE) }} data-label="Queue" />
          <span className={s.meterMark} style={{ left: "100%" }} data-label="Limit" />
        </div>
        <div className={s.cardTools}>
          {PRESETS.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={presetOn(p.every)} className={s.segBtn} disabled={readOnly} onClick={() => applyPreset(p.every)}>
              {p.label}
            </button>
          ))}
          {!readOnly && (
            <button type="button" className={s.textBtn} onClick={resetSyncSettings}>
              Reset estimates too
            </button>
          )}
        </div>
      </section>

      <section className={s.card} aria-labelledby="jobs-title">
        <h2 id="jobs-title" className={s.cardTitle}>
          Schedule
        </h2>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Job</th>
                <th scope="col">Every</th>
                <th scope="col">Calls a run</th>
                <th scope="col">Calls a day</th>
                <th scope="col">Feeds</th>
              </tr>
            </thead>
            <tbody>
              {SYNC_JOBS.map((j) => {
                const every = settings.every[j.id] ?? j.every;
                return (
                  <tr key={j.id}>
                    <th scope="row" className={s.wrapCell}>
                      <span className={s.personCell}>
                        <span className={s.pieceName}>{j.label}</span>
                        <span className={s.muted}>{j.what}</span>
                      </span>
                    </th>
                    <td>
                      {j.options.length > 1 ? (
                        <select className={s.selectSm} value={every} disabled={readOnly} onChange={(e) => setEvery(j.id, Number(e.target.value))} aria-label={`${j.label} every`}>
                          {j.options.map((m) => (
                            <option key={m} value={m}>
                              {everyLabel(m)}
                              {m === j.every ? " (recommended)" : ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        j.id === "session" ? "When it expires" : everyLabel(every)
                      )}
                    </td>
                    <td className="tabular">{j.calls}</td>
                    <td className="tabular">{fmt((j.calls * 1440) / every)}</td>
                    <td className={s.notesCell}>{j.feeds}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={s.card} aria-labelledby="demand-title">
        <div>
          <h2 id="demand-title" className={s.cardTitle}>
            On demand
          </h2>
          <p className={s.muted}>Calls made when a dealer does something, over a {BUSINESS_HOURS} hour business day. The hourly figures are estimates; set them to Surreal&apos;s.</p>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Calls each</th>
                <th scope="col">An hour</th>
                <th scope="col">Calls a day</th>
              </tr>
            </thead>
            <tbody>
              {ON_DEMAND.map((d) => {
                const n = settings.perHour[d.id] ?? d.perHour;
                return (
                  <tr key={d.id}>
                    <th scope="row" className={s.wrapCell}>
                      <span className={s.personCell}>
                        <span className={s.pieceName}>{d.label}</span>
                        <span className={s.muted}>{d.what}</span>
                      </span>
                    </th>
                    <td className="tabular">{d.calls}</td>
                    <td>
                      <input className={`${s.input} ${s.numInput}`} type="number" min={0} max={10000} value={n} disabled={readOnly} onChange={(e) => setPerHour(d.id, Number(e.target.value) || 0)} aria-label={`${d.label}, an hour`} />
                    </td>
                    <td className="tabular">{fmt(d.calls * n * BUSINESS_HOURS)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={s.card} aria-labelledby="how-title">
        <h2 id="how-title" className={s.cardTitle}>
          How the sync keeps calls low
        </h2>
        <ul className={s.howList}>
          {HOW.map(([title, line]) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className={s.note}>
          RightClick has no call to record a payment. A payment taken on the site goes to Surreal&apos;s card processor, finance posts the receipt in RightClick, and the next
          &ldquo;Payments and credits posted&rdquo; run clears it from &ldquo;pending posting&rdquo;.
        </p>
      </section>
    </div>
  );
}
