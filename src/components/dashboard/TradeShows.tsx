"use client";

/**
 * Trade show appointments (BRD R-26), inside the dashboard shell: the shows
 * Surreal exhibits at (src/content/tradeShows.ts, empty until the calendar
 * arrives, Q9), each with Book a time, and a meeting request form: the
 * show, the days that suit, a time of day, how many are coming and notes.
 * Sent requests are listed with a TS number and can be withdrawn. In the
 * preview they are kept in this browser; the console's inbox replaces that.
 */

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { tradeShows } from "@/content/tradeShows";
import { account } from "@/content/site";
import { cancelShowMeeting, requestShowMeeting, useShowMeetings, type ShowMeeting } from "@/lib/account";
import p from "./pages.module.css";
import s from "./account.module.css";

const TIMES: ShowMeeting["time"][] = ["Any time", "Morning", "Midday", "Afternoon"];

export default function TradeShows() {
  const meetings = useShowMeetings();
  const [show, setShow] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState<ShowMeeting | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const book = (name: string) => {
    setShow(name);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    if (!show.trim()) return setError("Name the show you will be at.");
    if (!get("days")) return setError("Tell us the days that suit you.");
    const meeting = requestShowMeeting({ show: show.trim(), days: get("days"), time: get("time") as ShowMeeting["time"], people: Math.max(1, Number(get("people")) || 1), notes: get("notes") });
    setSent(meeting);
    setError("");
    setShow("");
    e.currentTarget.reset();
  };

  return (
    <div className={p.page}>
      <nav aria-label="Breadcrumb" className={p.crumbs}>
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden>/</span>
        <span aria-current="page">Trade show appointments</span>
      </nav>
      <header className={p.head}>
        <div>
          <p className={p.kicker}>Your account</p>
          <h1 className={p.title}>Trade show appointments</h1>
          <p className={p.lead}>Meet the Surreal team at the shows. Book a time ahead and we hold it for you, with the stones and pieces you want to see.</p>
        </div>
      </header>

      <div className={s.columns}>
        <section className={p.panel} aria-labelledby="ts-shows">
          <h2 id="ts-shows" className={p.panelTitle}>
            Where to find us
          </h2>
          {tradeShows.length === 0 ? (
            <p className={s.empty}>
              Our show calendar is on its way. Tell us which show you are going to and the days that suit, and we will set a time with you.
            </p>
          ) : (
            <ul className={s.shows}>
              {tradeShows.map((t) => (
                <li key={t.id} className={s.show}>
                  <span>
                    <span className={s.showName}>{t.name}</span>
                    <span className={s.showMeta}>
                      {" "}
                      {t.city}, {t.dates}
                      {t.booth ? `, booth ${t.booth}` : ""}
                    </span>
                  </span>
                  <button type="button" className={p.secondary} onClick={() => book(t.name)}>
                    Book a time
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className={s.empty}>
            Not going to a show? <Link href={account.appointment} className={p.textLink}>Meet us in New York</Link> instead.
          </p>
        </section>

        <section className={p.panel} aria-labelledby="ts-book">
          <h2 id="ts-book" className={p.panelTitle}>
            Request a meeting
          </h2>
          <form ref={formRef} className={s.form} onSubmit={submit} noValidate>
            <label className={`${s.field} ${s.wideField}`}>
              <span>Show</span>
              <input name="show" value={show} onChange={(e) => setShow(e.target.value)} list="ts-show-list" placeholder="The show you will be at" />
              <datalist id="ts-show-list">
                {tradeShows.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </label>
            <label className={s.field}>
              <span>Days that suit</span>
              <input name="days" placeholder="e.g. the first two days" />
            </label>
            <label className={s.field}>
              <span>Time of day</span>
              <select name="time" defaultValue="Any time">
                {TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className={s.field}>
              <span>People coming</span>
              <input name="people" type="number" min={1} max={20} defaultValue={1} />
            </label>
            <label className={`${s.field} ${s.wideField}`}>
              <span>Notes (optional)</span>
              <textarea name="notes" placeholder="Stones or pieces you want to see" />
            </label>
            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}
            {sent && !error && (
              <p className={p.notice} role="status">
                Request {sent.number} sent. We will confirm a time for {sent.show} by email.
              </p>
            )}
            <button type="submit" className={p.primary}>
              Send request
            </button>
          </form>
        </section>
      </div>

      {meetings.length > 0 && (
        <section className={p.panel} aria-labelledby="ts-sent">
          <h2 id="ts-sent" className={p.panelTitle}>
            Your meeting requests
          </h2>
          <ul className={s.meetings}>
            {meetings.map((m) => (
              <li key={m.number} className={s.meeting}>
                <span className={s.meetingNumber}>{m.number}</span>
                <span>
                  <strong>{m.show}</strong>, {m.days}, {m.time.toLowerCase()}, {m.people} {m.people === 1 ? "person" : "people"}
                </span>
                <span className={p.status}>Requested</span>
                <button type="button" className={p.textBtn} onClick={() => cancelShowMeeting(m.number)}>
                  Withdraw
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
