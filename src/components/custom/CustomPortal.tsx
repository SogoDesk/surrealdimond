"use client";

/**
 * The Custom Portal (BRD R-22, with the R-23 preview demo). The live Custom
 * Orders form, redesigned in four parts: about you (active account or new,
 * company and location, name, email, phone), the piece (item type, metal,
 * gold color or two tone, style number, CAD requested, finger size and
 * matching bands for rings, other details), the center stone (shape, carat
 * weight or exact mm size, color within the F+ promise), and timing and
 * references (in-store delivery deadline, PO number, images, special
 * instructions). Beside it, sticky on desktop, the live preview and a summary
 * of the piece. The live form takes new accounts too, so a visitor can send
 * the request without logging in; a signed-in dealer's details fill in.
 * Requests are kept in this browser for the preview with a CU number; images
 * stay on the device until file storage is chosen (M1). A hidden field
 * catches spam bots, as on the live form.
 */

import Link from "next/link";
import { useEffect, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import Assurance from "@/components/brand/Assurance";
import ShapeIcon from "@/components/brand/ShapeIcon";
import { brand } from "@/content/site";
import { useDealer } from "@/lib/dealer";
import { createLocalStore } from "@/lib/localStore";
import StonePreview, { CUSTOM_SHAPES, stoneSize, type CustomShape, type GoldColor, type ItemType, type MetalKind, type StoneColor } from "./StonePreview";
import s from "./custom.module.css";

const SHAPE_NAME: Record<CustomShape, string> = { round: "Round", princess: "Princess", oval: "Oval", pear: "Pear", cushion: "Cushion", emerald: "Emerald Cut", asscher: "Asscher" };
const ITEMS: { id: ItemType; label: string }[] = [
  { id: "ring", label: "Ring" },
  { id: "pendant", label: "Pendant" },
  { id: "earring", label: "Earring" },
  { id: "bracelet", label: "Bracelet or bangle" },
  { id: "other", label: "Other" },
];
const METALS: { id: MetalKind; label: string }[] = [
  { id: "14k", label: "14K gold" },
  { id: "18k", label: "18K gold" },
  { id: "platinum", label: "Platinum" },
];
const GOLDS: { id: GoldColor; label: string; swatch: string }[] = [
  { id: "yellow", label: "Yellow", swatch: "linear-gradient(135deg, #f8e7b2, #c99a3e)" },
  { id: "white", label: "White", swatch: "linear-gradient(135deg, #ffffff, #b9c1ca)" },
  { id: "rose", label: "Rose", swatch: "linear-gradient(135deg, #f8dccf, #c7846b)" },
  { id: "two-tone", label: "Two tone", swatch: "linear-gradient(135deg, #f8e7b2 0 50%, #d0d6dd 50% 100%)" },
];
const COLORS: StoneColor[] = ["D", "E", "F"];

interface Values {
  account: "" | "active" | "new";
  company: string;
  name: string;
  email: string;
  phone: string;
  item: ItemType | "";
  metal: MetalKind | "";
  gold: GoldColor | "";
  twoTone: string;
  style: string;
  cad: "" | "yes" | "no";
  finger: string;
  matching: "" | "yes" | "no";
  details: string;
  shape: CustomShape;
  carat: string;
  mm: string;
  color: StoneColor;
  deadline: string;
  po: string;
  notes: string;
  website: string;
}
type Key = keyof Values;

interface CustomRequest {
  number: string;
  item: string;
  shape: string;
  carat: string;
  images: string[];
  sentAt: string;
}
const isRequests = (v: unknown): v is CustomRequest[] => Array.isArray(v);
const requests = createLocalStore<CustomRequest[]>("surreal-custom", [], isRequests);

const MAX_FILES = 6;
const MAX_BYTES = 10 * 1024 * 1024;
interface Upload {
  id: string;
  file: File;
  url: string;
}

const today = () => new Date().toISOString().slice(0, 10);

function ItemIcon({ id }: { id: ItemType }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 32 32" className={s.itemIcon} aria-hidden>
      {id === "ring" && (
        <>
          <circle cx="16" cy="19.5" r="8.5" {...p} />
          <path d="M12.5 8.5h7l2 2.4L16 15.5l-5.5-4.6Z" {...p} />
        </>
      )}
      {id === "pendant" && (
        <>
          <path d="M5 3c2 8 7 12 11 12s9-4 11-12" {...p} strokeDasharray="2 1.6" />
          <path d="M16 15v2.5" {...p} />
          <path d="M16 17.5c3.2 3.2 5.2 6 5.2 8a5.2 5.2 0 0 1-10.4 0c0-2 2-4.8 5.2-8Z" {...p} />
        </>
      )}
      {id === "earring" && (
        <>
          <circle cx="10" cy="16" r="4.5" {...p} />
          <circle cx="22" cy="16" r="4.5" {...p} />
          <circle cx="10" cy="16" r="1.8" {...p} />
          <circle cx="22" cy="16" r="1.8" {...p} />
        </>
      )}
      {id === "bracelet" && (
        <>
          <ellipse cx="16" cy="16" rx="12" ry="7.5" {...p} />
          <ellipse cx="16" cy="16" rx="9" ry="5" {...p} />
          <path d="M14 8.2h4l1 1.6-3 2.4-3-2.4Z" {...p} />
        </>
      )}
      {id === "other" && (
        <>
          <path d="M9 10h14l5 6-12 11L4 16Z" {...p} />
          <path d="M4 16h24M9 10l-1.5 6L16 27l8.5-11L23 10" {...p} />
        </>
      )}
    </svg>
  );
}

/** A row of choice pills acting as a radio group. */
function Choice<T extends string>({ label, options, value, onChange, error, id }: { label: string; options: { id: T; label: ReactNode }[]; value: T | ""; onChange: (v: T) => void; error?: string; id: string }) {
  return (
    <div className={s.field}>
      <span className={s.label} id={`${id}-label`}>
        {label}
      </span>
      <div className={s.pills} role="radiogroup" aria-labelledby={`${id}-label`} aria-invalid={Boolean(error)} id={id} tabIndex={-1}>
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={s.pill} onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
      {error && <span className={s.error}>{error}</span>}
    </div>
  );
}

export default function CustomPortal() {
  const dealer = useDealer();
  const [values, setValues] = useState<Values | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [uploadNote, setUploadNote] = useState("");
  const [dragging, setDragging] = useState(false);
  const [sent, setSent] = useState<CustomRequest | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewOut, setPreviewOut] = useState(false);

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  // Phones: when the preview card has scrolled away, a small floating preview keeps the piece in sight.
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setPreviewOut(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const form: Values = values ?? {
    account: dealer ? "active" : "",
    company: dealer?.store ?? "",
    name: dealer?.contact ?? "",
    email: dealer?.email ?? "",
    phone: "",
    item: "",
    metal: "",
    gold: "",
    twoTone: "",
    style: "",
    cad: "",
    finger: "",
    matching: "",
    details: "",
    shape: "round",
    carat: "1.00",
    mm: "",
    color: "E",
    deadline: "",
    po: "",
    notes: "",
    website: "",
  };
  const set = <K extends Key>(k: K, v: Values[K]) => {
    setValues({ ...form, [k]: v });
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  const carat = Number(form.carat) || 0;
  const size = stoneSize(form.shape, carat || 1);
  const isRing = form.item === "ring";

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...uploads];
    let skipped = 0;
    for (const file of Array.from(list)) {
      if (next.length >= MAX_FILES || !file.type.startsWith("image/") || file.size > MAX_BYTES) {
        skipped += 1;
        continue;
      }
      const url = URL.createObjectURL(file);
      urls.current.push(url);
      next.push({ id: `${file.name}-${file.size}-${file.lastModified}`, file, url });
    }
    setUploads(next);
    setUploadNote(skipped ? `${skipped} ${skipped === 1 ? "file was" : "files were"} left out: images only, up to ${MAX_FILES}, 10 MB each.` : "");
  };
  const removeUpload = (id: string) => {
    const gone = uploads.find((u) => u.id === id);
    if (gone) URL.revokeObjectURL(gone.url);
    setUploads(uploads.filter((u) => u.id !== id));
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (form.website) return;
    const found: Partial<Record<Key, string>> = {};
    if (!form.account) found.account = "Tell us whether you have an active Surreal account.";
    if (!form.company.trim()) found.company = "Enter the company name and location.";
    if (!form.name.trim()) found.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) found.email = "Enter a valid email address.";
    if (form.phone.replace(/\D/g, "").length < 10) found.phone = "Enter a ten digit phone number.";
    if (!form.item) found.item = "Choose the item type.";
    if (!form.metal) found.metal = "Choose the metal.";
    if (form.metal && form.metal !== "platinum" && !form.gold) found.gold = "Choose the gold color.";
    if (form.gold === "two-tone" && form.metal !== "platinum" && !form.twoTone.trim()) found.twoTone = "Say which parts take which color.";
    if (form.item !== "other" && !(carat > 0) && !form.mm.trim()) found.carat = "Enter the carat weight or the exact mm size.";
    if (!form.deadline) found.deadline = "Choose the in-store delivery deadline.";
    else if (form.deadline < today()) found.deadline = "Choose a date from today on.";
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      const el = document.getElementById(`c-${first}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return;
    }
    const request: CustomRequest = {
      number: `CU-${String(Date.now()).slice(-6)}`,
      item: ITEMS.find((i) => i.id === form.item)?.label ?? "",
      shape: SHAPE_NAME[form.shape],
      carat: form.mm.trim() ? `${form.mm.trim()} mm` : `${carat.toFixed(2)} ct`,
      images: uploads.map((u) => u.file.name),
      sentAt: new Date().toISOString(),
    };
    requests.set((list) => [request, ...list]);
    setSent(request);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const input = (k: Key, label: string, opts: { type?: string; optional?: boolean; hint?: string; wide?: boolean; min?: string; step?: string; placeholder?: string } = {}) => (
    <label className={`${s.field} ${opts.wide ? s.wide : ""}`}>
      <span className={s.label}>
        {label}
        {opts.optional && <span className={s.optional}> (optional)</span>}
      </span>
      <input
        id={`c-${k}`}
        className={s.input}
        type={opts.type ?? "text"}
        min={opts.min}
        step={opts.step}
        placeholder={opts.placeholder}
        inputMode={opts.type === "number" ? "decimal" : undefined}
        value={form[k]}
        onChange={(e) => set(k, e.target.value as Values[typeof k])}
        aria-invalid={Boolean(errors[k])}
        aria-describedby={errors[k] ? `ce-${k}` : undefined}
      />
      {opts.hint && !errors[k] && <span className={s.hint}>{opts.hint}</span>}
      {errors[k] && (
        <span id={`ce-${k}`} className={s.error}>
          {errors[k]}
        </span>
      )}
    </label>
  );

  const metalLine = form.metal === "platinum" ? "Platinum" : form.metal ? `${form.metal.toUpperCase()} ${form.gold ? GOLDS.find((g) => g.id === form.gold)?.label.toLowerCase() : ""} gold`.replace(/\s+/g, " ") : "Metal to choose";
  const summary: [string, string][] = [
    ["Item", ITEMS.find((i) => i.id === form.item)?.label ?? "To choose"],
    ["Metal", metalLine],
    ["Center stone", `${form.mm.trim() ? `${form.mm.trim()} mm` : `${(carat || 0).toFixed(2)} ct`} ${SHAPE_NAME[form.shape]}, ${form.color} color`],
    ["Face up, about", `${size.length.toFixed(1)} × ${size.width.toFixed(1)} mm`],
    ["CAD", form.cad === "yes" ? "Requested" : form.cad === "no" ? "Not needed" : "Not said"],
  ];

  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <section className={s.section} aria-labelledby="custom-title">
          <div className={s.wrap}>
            <nav aria-label="Breadcrumb" className={s.crumbs}>
              <Link href="/">Home</Link>
              <span aria-hidden>/</span>
              <span aria-current="page">Custom Portal</span>
            </nav>

            <header className={s.head}>
              <div>
                <p className={s.eyebrow}>Custom Portal</p>
                <h1 id="custom-title" className={s.title}>
                  From a sketch <em>to a setting</em>
                </h1>
                <p className={s.lead}>
                  Begin a custom design with our team. Our state of the art CAD department can make just about any jewelry item, and we get back to you
                  promptly after your request arrives.
                </p>
              </div>
              <ul className={s.promises}>
                <li>
                  <strong>F+ color, VS+ clarity</strong>
                  <span>Diamond quality on every custom item</span>
                </li>
                <li>
                  <strong>CAD on request</strong>
                  <span>Approve the design before it is made</span>
                </li>
                <li>
                  <strong>Handcrafted</strong>
                  <span>By the finest craftspeople</span>
                </li>
              </ul>
            </header>

            <div className={s.layout}>
              <aside className={s.side} aria-label="Live preview">
                <div className={s.preview} ref={previewRef}>
                  <div className={s.previewHead}>
                    <span className={s.previewTitle}>Live preview</span>
                    <span className={s.demoTag}>Demo</span>
                  </div>
                  <div className={s.previewStage}>
                    <StonePreview
                      item={form.item}
                      metal={form.metal}
                      gold={form.gold}
                      shape={form.shape}
                      carat={carat}
                      color={form.color}
                      matching={isRing && form.matching === "yes"}
                      fingerSize={isRing ? form.finger.trim() : undefined}
                    />
                  </div>
                  <dl className={s.summary}>
                    {summary.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className={s.previewNote}>Sizes are drawn to scale but approximate. Your CAD shows the exact design.</p>
                </div>
              </aside>

              <div className={s.main}>
                {sent ? (
                  <div className={s.sent} role="status">
                    <span className={s.tick} aria-hidden>
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5 10 17l9-10" />
                      </svg>
                    </span>
                    <p className={s.sentNumber}>{sent.number}</p>
                    <p>
                      Custom request sent: {sent.item === "Other" ? "a custom piece" : `a ${sent.item.toLowerCase()}`} with a {sent.carat} {sent.shape.toLowerCase()} center stone
                      {sent.images.length ? `, ${sent.images.length} ${sent.images.length === 1 ? "image" : "images"} attached` : ""}. Our team gets back to you
                      promptly. Questions: {brand.office.phone}.
                    </p>
                    <p className={s.previewNote}>Preview: the request is kept in this browser; request emails and image storage connect with the dealer platform.</p>
                    <div className={s.doors}>
                      <button
                        type="button"
                        className={s.primary}
                        onClick={() => {
                          setSent(null);
                          setValues(null);
                          uploads.forEach((u) => URL.revokeObjectURL(u.url));
                          setUploads([]);
                        }}
                      >
                        Start another request
                      </button>
                      <Link href="/jewelry" className={s.secondary}>
                        Browse the catalog
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form className={s.form} onSubmit={submit} noValidate>
                    <label className={s.trap} aria-hidden>
                      Leave this field empty
                      <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} />
                    </label>

                    <fieldset className={s.group}>
                      <legend className={s.legend}>
                        <span className={s.step}>1</span>Tell us about you
                      </legend>
                      <Choice
                        id="c-account"
                        label="Do you have an active Surreal account?"
                        options={[
                          { id: "active", label: "Yes, I have an active account" },
                          { id: "new", label: "I'm a new account" },
                        ]}
                        value={form.account}
                        onChange={(v) => set("account", v)}
                        error={errors.account}
                      />
                      <div className={s.grid}>
                        {input("company", "Company name and location", { wide: true, placeholder: "Store name, city, state" })}
                        {input("name", "Your name")}
                        {input("phone", "Phone", { type: "tel" })}
                        {input("email", "Email", { type: "email", wide: true })}
                      </div>
                    </fieldset>

                    <fieldset className={s.group}>
                      <legend className={s.legend}>
                        <span className={s.step}>2</span>The piece
                      </legend>
                      <div className={s.field}>
                        <span className={s.label} id="c-item-label">
                          Item type
                        </span>
                        <div className={s.items} role="radiogroup" aria-labelledby="c-item-label" id="c-item" tabIndex={-1} aria-invalid={Boolean(errors.item)}>
                          {ITEMS.map((it) => (
                            <button key={it.id} type="button" role="radio" aria-checked={form.item === it.id} className={s.itemBtn} onClick={() => set("item", it.id)}>
                              <ItemIcon id={it.id} />
                              {it.label}
                            </button>
                          ))}
                        </div>
                        {errors.item && <span className={s.error}>{errors.item}</span>}
                      </div>
                      <Choice id="c-metal" label="Metal" options={METALS} value={form.metal} onChange={(v) => set("metal", v)} error={errors.metal} />
                      {form.metal !== "platinum" && (
                        <div className={s.field}>
                          <span className={s.label} id="c-gold-label">
                            Gold color
                          </span>
                          <div className={s.pills} role="radiogroup" aria-labelledby="c-gold-label" id="c-gold" tabIndex={-1} aria-invalid={Boolean(errors.gold)}>
                            {GOLDS.map((g) => (
                              <button key={g.id} type="button" role="radio" aria-checked={form.gold === g.id} className={s.pill} onClick={() => set("gold", g.id)}>
                                <span className={s.swatch} style={{ background: g.swatch }} aria-hidden />
                                {g.label}
                              </button>
                            ))}
                          </div>
                          {errors.gold && <span className={s.error}>{errors.gold}</span>}
                        </div>
                      )}
                      <div className={s.grid}>
                        {form.gold === "two-tone" && form.metal !== "platinum" && input("twoTone", "Two tone, specify", { wide: true, hint: "For example, white gold head on a yellow gold shank" })}
                        {input("style", "Style number", { optional: true, hint: "If the piece starts from one of ours" })}
                        <Choice
                          id="c-cad"
                          label="CAD requested"
                          options={[
                            { id: "yes", label: "Yes" },
                            { id: "no", label: "No" },
                          ]}
                          value={form.cad}
                          onChange={(v) => set("cad", v)}
                        />
                        {isRing && input("finger", "Finger or ring size", { optional: true, placeholder: "For example, 6.5" })}
                        {isRing && (
                          <Choice
                            id="c-matching"
                            label="Design matching bands?"
                            options={[
                              { id: "yes", label: "Yes" },
                              { id: "no", label: "No" },
                            ]}
                            value={form.matching}
                            onChange={(v) => set("matching", v)}
                          />
                        )}
                        <label className={`${s.field} ${s.wide}`}>
                          <span className={s.label}>
                            Other details<span className={s.optional}> (optional)</span>
                          </span>
                          <textarea className={s.textarea} rows={3} value={form.details} onChange={(e) => set("details", e.target.value)} placeholder="Setting style, side stones, engraving, finish" />
                        </label>
                      </div>
                    </fieldset>

                    <fieldset className={s.group}>
                      <legend className={s.legend}>
                        <span className={s.step}>3</span>The center stone
                      </legend>
                      <div className={s.field}>
                        <span className={s.label} id="c-shape-label">
                          Center stone shape
                        </span>
                        <div className={s.shapes} role="radiogroup" aria-labelledby="c-shape-label">
                          {CUSTOM_SHAPES.map((sh) => (
                            <button key={sh} type="button" role="radio" aria-checked={form.shape === sh} className={s.shapeBtn} onClick={() => set("shape", sh)}>
                              <ShapeIcon shape={sh} className={s.shapeIcon} />
                              {SHAPE_NAME[sh]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className={s.field}>
                        <label className={s.label} htmlFor="c-carat">
                          Carat weight
                        </label>
                        <div className={s.caratRow}>
                          <input
                            type="range"
                            className={s.range}
                            min={0.25}
                            max={10}
                            step={0.05}
                            value={Math.min(Math.max(carat || 0.25, 0.25), 10)}
                            onChange={(e) => set("carat", Number(e.target.value).toFixed(2))}
                            aria-label="Carat weight slider"
                          />
                          <span className={s.caratInput}>
                            <input
                              id="c-carat"
                              className={s.input}
                              type="number"
                              inputMode="decimal"
                              min={0.1}
                              max={15}
                              step={0.01}
                              value={form.carat}
                              onChange={(e) => set("carat", e.target.value)}
                              aria-invalid={Boolean(errors.carat)}
                            />
                            <span>ct</span>
                          </span>
                        </div>
                        {errors.carat ? <span className={s.error}>{errors.carat}</span> : <span className={s.hint}>About {size.length.toFixed(1)} × {size.width.toFixed(1)} mm face up for this shape.</span>}
                      </div>
                      <div className={s.grid}>
                        {input("mm", "Or the exact mm size", { optional: true, placeholder: "For example, 8.5 x 6.0" })}
                        <div className={s.field}>
                          <span className={s.label} id="c-color-label">
                            Diamond color
                          </span>
                          <div className={s.scale} role="radiogroup" aria-labelledby="c-color-label">
                            {COLORS.map((c) => (
                              <button key={c} type="button" role="radio" aria-checked={form.color === c} className={s.scaleCell} onClick={() => set("color", c)}>
                                {c}
                              </button>
                            ))}
                          </div>
                          <span className={s.hint}>F+ color and VS+ clarity on every custom item.</span>
                        </div>
                      </div>
                    </fieldset>

                    <fieldset className={s.group}>
                      <legend className={s.legend}>
                        <span className={s.step}>4</span>Timing and references
                      </legend>
                      <div className={s.grid}>
                        {input("deadline", "In-store delivery deadline", { type: "date", min: today() })}
                        {input("po", "PO number", { optional: true })}
                      </div>
                      <div className={s.field}>
                        <span className={s.label}>
                          Images<span className={s.optional}> (optional)</span>
                        </span>
                        <div
                          className={s.drop}
                          data-dragging={dragging ? "" : undefined}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                          }}
                          onDragLeave={() => setDragging(false)}
                          onDrop={onDrop}
                        >
                          <svg aria-hidden viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                          </svg>
                          <span>
                            Drop sketches or photos here, or{" "}
                            <button type="button" className={s.linkBtn} onClick={() => fileRef.current?.click()}>
                              choose files
                            </button>
                          </span>
                          <span className={s.hint}>Images only, up to {MAX_FILES}, 10 MB each</span>
                          <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={(e) => {
                              addFiles(e.target.files);
                              e.target.value = "";
                            }}
                          />
                        </div>
                        {uploadNote && <span className={s.error}>{uploadNote}</span>}
                        {uploads.length > 0 && (
                          <ul className={s.thumbs}>
                            {uploads.map((u) => (
                              <li key={u.id}>
                                {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL, not an optimisable asset */}
                                <img src={u.url} alt={u.file.name} />
                                <button type="button" className={s.thumbRemove} onClick={() => removeUpload(u.id)} aria-label={`Remove ${u.file.name}`}>
                                  <svg aria-hidden viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                                    <path d="M3 3l10 10M13 3 3 13" />
                                  </svg>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <label className={s.field}>
                        <span className={s.label}>
                          Special instructions and comments<span className={s.optional}> (optional)</span>
                        </span>
                        <textarea className={s.textarea} rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                      </label>
                    </fieldset>

                    <div className={s.submitRow}>
                      <button type="submit" className={s.primary}>
                        Send the custom request
                      </button>
                      <p className={s.hint}>
                        Questions first? Call {brand.office.phone}, {brand.office.hours}.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {!sent && (
          <button
            type="button"
            className={s.mini}
            data-show={previewOut ? "" : undefined}
            aria-hidden={!previewOut}
            tabIndex={previewOut ? 0 : -1}
            onClick={() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          >
            <span className={s.miniStage}>
              <StonePreview
                item={form.item}
                metal={form.metal}
                gold={form.gold}
                shape={form.shape}
                carat={carat}
                color={form.color}
                matching={isRing && form.matching === "yes"}
              />
            </span>
            <span className={s.miniText}>
              <strong>Live preview</strong>
              {`${(carat || 0).toFixed(2)} ct ${SHAPE_NAME[form.shape]}, ${form.color}`}
            </span>
          </button>
        )}

        <section className={s.how} aria-labelledby="custom-how">
          <div className={s.wrap}>
            <h2 id="custom-how" className={s.howTitle}>
              How a custom piece <em>comes together</em>
            </h2>
            <ol className={s.howSteps}>
              {[
                ["Send the brief", "The piece, the stone and your in-store deadline, with any sketches or photos."],
                ["We get back to you", "Our team replies promptly after your request arrives."],
                ["Approve the CAD", "When you ask for CAD, our CAD department draws the design for your sign-off."],
                ["Handcrafted", "Made by the finest craftspeople, with F+ color, VS+ clarity diamonds."],
              ].map(([t, b], i) => (
                <li key={t}>
                  <span className={s.howNum}>0{i + 1}</span>
                  <strong>{t}</strong>
                  <span>{b}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Assurance />
        <Footer />
      </main>
    </>
  );
}
