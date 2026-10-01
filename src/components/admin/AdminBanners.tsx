"use client";

/**
 * Banners (BRD R-02, R-35): the homepage hero slides. Each row shows the
 * wide desktop artwork and the square phone image, the label (the image's
 * description for screen readers) and where the slide leads, a switch to
 * show or hide it, and up and down to set the order. Add a banner by picking
 * a desktop and a phone image from the media library, a label and a link.
 * Added banners can be deleted; Surreal's own set can only be switched off.
 * At least one banner stays on. Changes show on the homepage at once.
 */

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SITE_LINKS as LINKS } from "@/content/admin";
import { heroSlides } from "@/content/home";
import { move, resetMerch, setMerch, useMerch, type Banner } from "@/lib/merch";
import { useAdminAccess } from "./AdminShell";
import s from "./admin.module.css";

const DESKTOP = Array.from({ length: 8 }, (_, i) => `/media/banners/web-${i + 1}.webp`);
const PHONE = [..."12345678", ..."abcdefghi"].map((c) => `/media/banners/social-${c}.webp`);
const own = new Set(heroSlides.map((b) => b.id));

export default function AdminBanners() {
  const readOnly = useAdminAccess() !== "edit";
  const { banners } = useMerch();
  const [adding, setAdding] = useState(false);
  const [desktop, setDesktop] = useState(DESKTOP[0]);
  const [phone, setPhone] = useState(PHONE[0]);
  const [label, setLabel] = useState("");
  const [href, setHref] = useState(LINKS[0].href);
  const [error, setError] = useState("");

  const write = (next: Banner[]) => setMerch((m) => ({ ...m, banners: next }));
  const onCount = banners.filter((b) => b.active).length;
  const update = (i: number, patch: Partial<Banner>) => write(banners.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (label.trim().length < 3) {
      setError("Describe the banner in a few words; screen readers read it aloud.");
      return;
    }
    write([{ id: `b-${Date.now().toString(36)}`, desktop, mobile: phone, href, label: label.trim(), active: true }, ...banners]);
    setAdding(false);
    setLabel("");
    setError("");
  };

  return (
    <div className={s.page}>
      <header className={s.pageHead}>
        <div>
          <p className={s.kicker}>Banners</p>
          <h1 className={s.pageTitle}>Homepage hero slides</h1>
          <p className={s.pageLine}>
            {onCount} of {banners.length} on. They rotate at the top of the homepage in this order.
          </p>
        </div>
        <span className={s.cardTools}>
          <Link href="/" className={s.textBtn} target="_blank" rel="noreferrer">
            Open the homepage
          </Link>
          {!readOnly && (
            <>
              <button type="button" className={s.textBtn} onClick={resetMerch}>
                Reset all storefront settings
              </button>
              <button type="button" className={s.primary} onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
                {adding ? "Close" : "Add a banner"}
              </button>
            </>
          )}
        </span>
      </header>

      {adding && !readOnly && (
        <form className={s.card} onSubmit={add} noValidate>
          <h2 className={s.cardTitle}>New banner</h2>
          <div className={s.field}>
            <span className={s.label}>Desktop artwork, wide</span>
            <div className={s.pickGrid} role="radiogroup" aria-label="Desktop artwork">
              {DESKTOP.map((src) => (
                <button key={src} type="button" role="radio" aria-checked={desktop === src} className={s.pickImg} onClick={() => setDesktop(src)}>
                  <Image src={src} alt="" width={240} height={80} sizes="160px" />
                </button>
              ))}
            </div>
          </div>
          <div className={s.field}>
            <span className={s.label}>Phone image, square</span>
            <div className={`${s.pickGrid} ${s.pickGridSquare}`} role="radiogroup" aria-label="Phone image">
              {PHONE.map((src) => (
                <button key={src} type="button" role="radio" aria-checked={phone === src} className={s.pickImg} onClick={() => setPhone(src)}>
                  <Image src={src} alt="" width={120} height={120} sizes="80px" />
                </button>
              ))}
            </div>
          </div>
          <div className={s.formRow}>
            <label className={s.field}>
              <span className={s.label}>Label</span>
              <input className={s.input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="For example, Oval halo rings" aria-invalid={error ? true : undefined} />
              {error && <span className={s.error}>{error}</span>}
            </label>
            <label className={s.field}>
              <span className={s.label}>Leads to</span>
              <select className={s.select} value={href} onChange={(e) => setHref(e.target.value)}>
                {LINKS.map((l) => (
                  <option key={l.href} value={l.href}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className={s.muted}>Images come from Surreal&apos;s banner library. Uploads arrive with file storage (M1).</p>
          <div>
            <button type="submit" className={s.primary}>
              Add to the homepage
            </button>
          </div>
        </form>
      )}

      <ol className={s.bannerList}>
        {banners.map((b, i) => (
          <li key={b.id} className={s.banner} data-off={b.active ? undefined : ""}>
            <span className={s.orderIndex}>{i + 1}</span>
            <span className={s.bannerDesk}>
              <Image src={b.desktop} alt="" width={360} height={120} sizes="240px" />
            </span>
            <span className={s.bannerPhone}>
              <Image src={b.mobile} alt="" width={120} height={120} sizes="64px" />
            </span>
            <span className={s.bannerFields}>
              <input className={s.input} value={b.label} onChange={(e) => update(i, { label: e.target.value })} disabled={readOnly} aria-label={`Label for banner ${i + 1}`} />
              <select className={s.select} value={b.href} onChange={(e) => update(i, { href: e.target.value })} disabled={readOnly} aria-label={`Link for banner ${i + 1}`}>
                {!LINKS.some((l) => l.href === b.href) && <option value={b.href}>{b.href}</option>}
                {LINKS.map((l) => (
                  <option key={l.href} value={l.href}>
                    {l.label}
                  </option>
                ))}
              </select>
            </span>
            <span className={s.orderTools}>
              <button
                type="button"
                role="switch"
                aria-checked={b.active}
                aria-label={`Show banner ${i + 1}`}
                className={s.switch}
                disabled={readOnly || (b.active && onCount === 1)}
                title={b.active && onCount === 1 ? "At least one banner stays on" : undefined}
                onClick={() => update(i, { active: !b.active })}
              >
                <span />
              </button>
              <button type="button" className={s.iconBtn} onClick={() => write(move(banners, i, -1))} disabled={readOnly || i === 0} aria-label={`Move banner ${i + 1} up`}>
                <svg aria-hidden viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M2 7.5l4-4 4 4" />
                </svg>
              </button>
              <button type="button" className={s.iconBtn} onClick={() => write(move(banners, i, 1))} disabled={readOnly || i === banners.length - 1} aria-label={`Move banner ${i + 1} down`}>
                <svg aria-hidden viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M2 4.5l4 4 4-4" />
                </svg>
              </button>
              {!own.has(b.id) && (
                <button type="button" className={s.iconBtn} onClick={() => write(banners.filter((x) => x.id !== b.id))} disabled={readOnly} aria-label={`Delete banner ${i + 1}`}>
                  <svg aria-hidden viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                    <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                  </svg>
                </button>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
