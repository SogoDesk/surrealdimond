"use client";

/**
 * Pop-up banner (console): the homepage offer or festive message
 * (lib/promo.ts). The form on the left edits a draft; the preview on the
 * right shows it over a dimmed page, as visitors will see it. Publish makes
 * the draft live under a new version, so visitors who closed the last banner
 * see this one; Discard returns the draft to what is live. Preview on the
 * homepage opens the live banner at once (/?promo=preview).
 *
 * Fields: on or off; layout (photograph beside the text, full photograph,
 * text only) and color (light, navy); the photograph; eyebrow, title, italic
 * words, message, offer code, button and where it leads, small print; and
 * when it shows: after how many seconds, to whom, how often it returns, and
 * the start and end dates (New York time). A view-only role sees the form
 * disabled.
 */

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PromoCard } from "@/components/home/PromoPopup";
import { SITE_LINKS } from "@/content/admin";
import { DEFAULT_PROMO, nyToday, promoStatus, publishPromo, usePromo, type Promo, type PromoAudience, type PromoLayout, type PromoRepeat, type PromoStatus, type PromoTone } from "@/lib/promo";
import { useAdminAccess } from "./AdminShell";
import s from "./admin.module.css";

const IMAGES = [
  ...["sb-3996", "sb-3984", "sb-4091", "sb-3970", "sb-3502", "sb-3631", "sb-3730", "sb-3067", "sb-3240", "sb-3738"].map((n) => `/media/photos/${n}-sm.webp`),
  ...[..."12345678", ..."abc"].map((c) => `/media/banners/social-${c}.webp`),
];
const LAYOUTS: { id: PromoLayout; label: string }[] = [
  { id: "split", label: "Photo beside text" },
  { id: "image", label: "Full photo" },
  { id: "text", label: "Text only" },
];
const TONES: { id: PromoTone; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "navy", label: "Navy" },
];
const AUDIENCES: { id: PromoAudience; label: string }[] = [
  { id: "everyone", label: "Everyone" },
  { id: "visitors", label: "Visitors not signed in" },
  { id: "dealers", label: "Signed-in dealers" },
];
const REPEATS: { id: PromoRepeat; label: string }[] = [
  { id: "visit", label: "Every visit" },
  { id: "day", label: "Again after a day" },
  { id: "week", label: "Again after a week" },
  { id: "once", label: "Only once" },
];
const DELAYS = [3, 5, 8, 12, 20];
const STATUS_LABEL: Record<PromoStatus, string> = { off: "Off", scheduled: "Scheduled", live: "Live now", ended: "Ended" };

function Segments<T extends string>({ label, options, value, onChange, disabled }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; disabled: boolean }) {
  return (
    <div className={s.field}>
      <span className={s.label}>{label}</span>
      <div className={s.seg} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={s.segBtn} onClick={() => onChange(o.id)} disabled={disabled}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminPromo() {
  const readOnly = useAdminAccess() !== "edit";
  const live = usePromo();
  const [draft, setDraft] = useState<Promo>(live);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Promo>(k: K, v: Promo[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  };
  const changed = JSON.stringify({ ...draft, version: "" }) !== JSON.stringify({ ...live, version: "" });
  const status = promoStatus(live);
  const linkKnown = SITE_LINKS.some((l) => l.href === draft.href);

  const publish = () => {
    if (draft.title.trim().length < 3) return setError("Give the banner a title.");
    if (draft.cta.trim() && !draft.href.trim()) return setError("Choose where the button leads.");
    if (draft.start && draft.end && draft.end < draft.start) return setError("The end date comes before the start date.");
    setError("");
    setDraft(publishPromo({ ...draft, title: draft.title.trim(), emphasis: draft.emphasis.trim(), code: draft.code.trim().toUpperCase() }));
    setSaved(true);
  };

  const text = (k: "eyebrow" | "title" | "emphasis" | "code" | "cta" | "fineprint", label: string, opts: { hint?: string; placeholder?: string; optional?: boolean } = {}) => (
    <label className={s.field}>
      <span className={s.label}>
        {label}
        {opts.optional && <span className={s.optionalText}> (optional)</span>}
      </span>
      <input className={s.input} value={draft[k]} onChange={(e) => set(k, e.target.value)} placeholder={opts.placeholder} disabled={readOnly} />
      {opts.hint && <span className={s.muted}>{opts.hint}</span>}
    </label>
  );

  return (
    <div className={s.page}>
      <header className={s.pageHead}>
        <div>
          <p className={s.kicker}>Pop-up banner</p>
          <h1 className={s.pageTitle}>The homepage pop-up</h1>
          <p className={s.pageLine}>An offer, a festive message or an event, shown over the homepage after a few seconds with the page dimmed behind it. Visitors close it with the cross.</p>
        </div>
        <span className={s.cardTools}>
          <span className={s.promoStatus} data-status={status}>
            {STATUS_LABEL[status]}
          </span>
          <Link href="/?promo=preview" className={s.textBtn} target="_blank" rel="noreferrer">
            Preview on the homepage
          </Link>
        </span>
      </header>

      <div className={s.promoLayout}>
        <div className={s.promoForm}>
          <section className={s.card} aria-labelledby="promo-look">
            <div className={s.cardHead}>
              <h2 id="promo-look" className={s.cardTitle}>
                Look
              </h2>
              <label className={s.switchRow}>
                <span>{draft.active ? "On" : "Off"}</span>
                <button type="button" role="switch" aria-checked={draft.active} aria-label="Show the pop-up" className={s.switch} disabled={readOnly} onClick={() => set("active", !draft.active)}>
                  <span />
                </button>
              </label>
            </div>
            <Segments label="Layout" options={LAYOUTS} value={draft.layout} onChange={(v) => set("layout", v)} disabled={readOnly} />
            <Segments label="Color" options={TONES} value={draft.tone} onChange={(v) => set("tone", v)} disabled={readOnly} />
            {draft.layout !== "text" && (
              <div className={s.field}>
                <span className={s.label}>Photograph</span>
                <div className={`${s.pickGrid} ${s.pickGridSquare}`} role="radiogroup" aria-label="Photograph">
                  {IMAGES.map((src) => (
                    <button key={src} type="button" role="radio" aria-checked={draft.image === src} className={s.pickImg} onClick={() => set("image", src)} disabled={readOnly}>
                      <Image src={src} alt="" width={120} height={120} sizes="80px" />
                    </button>
                  ))}
                </div>
                <span className={s.muted}>From Surreal&apos;s photography and banner library. Uploads arrive with file storage.</span>
              </div>
            )}
          </section>

          <section className={s.card} aria-labelledby="promo-words">
            <h2 id="promo-words" className={s.cardTitle}>
              Words
            </h2>
            {text("eyebrow", "Eyebrow", { placeholder: "For example, Holiday season", optional: true })}
            <div className={s.formRow}>
              {text("title", "Title", { placeholder: "For example, Gifts that grow" })}
              {text("emphasis", "Italic words", { placeholder: "For example, with your store", optional: true, hint: "Set in italic after the title." })}
            </div>
            <label className={s.field}>
              <span className={s.label}>
                Message<span className={s.optionalText}> (optional)</span>
              </span>
              <textarea className={s.textarea} rows={3} value={draft.message} onChange={(e) => set("message", e.target.value)} disabled={readOnly} />
            </label>
            <div className={s.formRow}>
              {text("code", "Offer code", { placeholder: "For example, HOLIDAY", optional: true, hint: "Shown as a chip visitors can copy." })}
              {text("fineprint", "Small print", { placeholder: "For example, Valid on orders placed by Dec 15", optional: true })}
            </div>
            <div className={s.formRow}>
              {text("cta", "Button", { placeholder: "For example, Shop the edit", optional: true })}
              <label className={s.field}>
                <span className={s.label}>Button leads to</span>
                <select className={s.select} value={draft.href} onChange={(e) => set("href", e.target.value)} disabled={readOnly}>
                  {!linkKnown && <option value={draft.href}>{draft.href || "Choose a page"}</option>}
                  {SITE_LINKS.map((l) => (
                    <option key={l.href} value={l.href}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className={s.card} aria-labelledby="promo-when">
            <h2 id="promo-when" className={s.cardTitle}>
              When and to whom
            </h2>
            <div className={s.formRow}>
              <label className={s.field}>
                <span className={s.label}>Show after</span>
                <select className={s.select} value={draft.delay} onChange={(e) => set("delay", Number(e.target.value))} disabled={readOnly}>
                  {DELAYS.map((d) => (
                    <option key={d} value={d}>
                      {d} seconds
                    </option>
                  ))}
                </select>
              </label>
              <label className={s.field}>
                <span className={s.label}>Show to</span>
                <select className={s.select} value={draft.audience} onChange={(e) => set("audience", e.target.value as PromoAudience)} disabled={readOnly}>
                  {AUDIENCES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={s.field}>
              <span className={s.label}>After a visitor closes it</span>
              <select className={s.select} value={draft.repeat} onChange={(e) => set("repeat", e.target.value as PromoRepeat)} disabled={readOnly}>
                {REPEATS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <div className={s.formRow}>
              <label className={s.field}>
                <span className={s.label}>
                  Starts<span className={s.optionalText}> (optional)</span>
                </span>
                <input type="date" className={s.input} value={draft.start} onChange={(e) => set("start", e.target.value)} disabled={readOnly} />
              </label>
              <label className={s.field}>
                <span className={s.label}>
                  Ends<span className={s.optionalText}> (optional)</span>
                </span>
                <input type="date" className={s.input} value={draft.end} min={draft.start || undefined} onChange={(e) => set("end", e.target.value)} disabled={readOnly} />
              </label>
            </div>
            <p className={s.muted}>Dates follow New York time; today is {nyToday()}. Publishing shows the banner again to visitors who closed the last one.</p>
          </section>
        </div>

        <aside className={s.promoSide} aria-label="Preview">
          <div className={s.promoPreview}>
            <div className={s.promoPage} aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <div className={s.promoScrim} aria-hidden />
            <div className={s.promoCard}>
              <PromoCard promo={draft} onClose={() => undefined} />
            </div>
          </div>
          {!readOnly && (
            <div className={s.promoActions}>
              {error && (
                <p className={s.error} role="alert">
                  {error}
                </p>
              )}
              {saved && !changed && (
                <p className={s.note} role="status">
                  Published. The homepage shows it now.
                </p>
              )}
              <button type="button" className={s.primary} onClick={publish} disabled={!changed}>
                {changed ? "Publish" : "Published"}
              </button>
              <button type="button" className={s.textBtn} onClick={() => setDraft(live)} disabled={!changed}>
                Discard changes
              </button>
              <button type="button" className={s.textBtn} onClick={() => setDraft({ ...DEFAULT_PROMO, version: live.version })}>
                Start from the default
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
