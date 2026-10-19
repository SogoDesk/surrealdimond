"use client";

/**
 * The product page below the fold (see ProductPage.tsx for the order).
 * Copy stays inside the verified facts: the dealer site's pricing note, its
 * delivery cutoff, payment methods, memo program, custom request form and
 * the Made to Order grades.
 */

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import StoreCard from "@/components/store/StoreCard";
import { useQuickViewList } from "@/components/store/useQuickViewList";
import { renderForSelection, type PieceSelection } from "@/components/shop/filters";
import {
  caratOptions,
  categories,
  categoryLabel,
  formatCarat,
  metals,
  productMetals,
  products,
  renderSrc,
  shapes,
  styleRef,
  type Category,
  type Metal,
  type Product,
  type Shape,
} from "@/content/catalog";
import { editorial } from "@/content/editorial";
import { groundStyle } from "@/content/grounds";
import { account, brand } from "@/content/site";
import s from "./product.module.css";

const Arrow = () => (
  <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

/* ---------- 2. Program banners ---------- */

export function ProgramBanners({ product }: { product: Product }) {
  const ring = product.category === "engagement";
  return (
    <section className={s.banners} aria-label="Programs">
      <div className={s.wrap}>
        <div className={s.bannerGrid}>
          <Link href="/diamonds/made-to-order" className={`${s.banner} ${s.bannerDark}`}>
            <span className={s.bannerMedia}>
              <Image src="/media/photos/sb-3984-sm.webp" alt="" fill sizes="(min-width: 900px) 30vw, 60vw" />
            </span>
            <span className={s.bannerCopy}>
              <span className={s.bannerEyebrow}>Made to Order (M2O)</span>
              <span className={s.bannerTitle}>{ring ? "Grow the center stone to order" : "A diamond grown to order"}</span>
              <span className={s.bannerLine}>Any shape, any carat weight. Under 4 ct FG+ color and VS+ clarity, with an IGI certificate.</span>
              <span className={s.bannerCta}>
                Start an M2O order <Arrow />
              </span>
            </span>
          </Link>
          <Link href="/custom" className={`${s.banner} ${s.bannerLight}`}>
            <span className={s.bannerMedia}>
              <Image src="/media/banners/social-8.webp" alt="" fill sizes="(min-width: 900px) 30vw, 60vw" />
            </span>
            <span className={s.bannerCopy}>
              <span className={s.bannerEyebrow}>Custom jewelry</span>
              <span className={s.bannerTitle}>Change anything about it</span>
              <span className={s.bannerLine}>Our CAD department can make just about any jewelry item, in 14K, 18K or platinum.</span>
              <span className={s.bannerCta}>
                Start a custom request <Arrow />
              </span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. Jewelry details ---------- */

function Accordion({ title, icon, children, open: startOpen = false }: { title: string; icon: ReactNode; children: ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <div className={s.acc} data-open={open ? "true" : undefined}>
      <button type="button" className={s.accHead} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className={s.accIcon} aria-hidden>
          {icon}
        </span>
        {title}
        <svg aria-hidden viewBox="0 0 10 10" width="10" height="10" className={s.accChevron} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3.75 5 6.75l3-3" />
        </svg>
      </button>
      {open && <div className={s.accBody}>{children}</div>}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={s.spec}>
      <span className={s.specValue}>{value}</span>
      <span className={s.specLabel}>{label}</span>
    </div>
  );
}

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

export function Details({ product, selection, ringSize }: { product: Product; selection: PieceSelection; ringSize: string | null }) {
  const [tab, setTab] = useState<"details" | "pricing">("details");
  const ref = styleRef(product);
  const shape = shapes.find((x) => x.id === product.shape)?.label;
  const metalLabel = metals.find((m) => m.id === selection.metal)?.label ?? "";
  const pictured = productMetals(product)
    .map((m) => metals.find((x) => x.id === m)?.label)
    .join(", ");
  const cat = categories.find((c) => c.id === product.category);
  const image = renderForSelection(product, selection) ?? product.image;

  return (
    <section className={s.details} aria-labelledby="details-title">
      <div className={s.wrap}>
        <div className={s.detailsHead}>
          <h2 id="details-title" className={s.sectionTitle}>
            Jewelry <em>details</em>
          </h2>
          <div className={s.tabs} role="tablist" aria-label="Details">
            <button type="button" role="tab" aria-selected={tab === "details"} className={s.tab} onClick={() => setTab("details")}>
              Product details
            </button>
            <button type="button" role="tab" aria-selected={tab === "pricing"} className={s.tab} onClick={() => setTab("pricing")}>
              Dealer pricing
            </button>
          </div>
        </div>

        <div className={s.detailsLayout}>
          <div className={s.detailsMain} role="tabpanel">
            {tab === "details" ? (
              <>
                <Accordion title="Metal details" open icon={icon(<><circle cx="10" cy="11" r="5.5" /><path d="M7.5 3.5h5l1.5 2-4 3-4-3Z" /></>)}>
                  <div className={s.specGrid}>
                    <Spec label="Selected metal" value={metalLabel} />
                    <Spec label="Available in" value={pictured} />
                    {ringSize && <Spec label="Ring size" value={`US ${ringSize}`} />}
                  </div>
                </Accordion>
                <Accordion title="Diamond details" icon={icon(<><path d="M6 3.5h8l3 4-7 9-7-9Z" /><path d="M3 7.5h14" /></>)}>
                  <div className={s.specGrid}>
                    <Spec label="Origin" value="Lab grown, CVD" />
                    <Spec label="Grown by" value="Surreal" />
                    <Spec label="Total carat weight" value={formatCarat(selection.carat)} />
                    <Spec label="Offered in" value={caratOptions[product.category].map(formatCarat).join(", ")} />
                    {shape && <Spec label="Center stone" value={shape} />}
                  </div>
                </Accordion>
                <Accordion title="General details" icon={icon(<><rect x="3.5" y="3.5" width="13" height="13" rx="1.5" /><path d="M7 8h6M7 11h6M7 14h3" /></>)}>
                  <div className={s.specGrid}>
                    <Spec label="Category" value={categoryLabel(product.category)} />
                    {ref && <Spec label="Reference" value={ref} />}
                    <Spec label="Views" value={product.video ? "Renders and 360 video" : "Renders"} />
                    <Spec label="Certificates" value="On request" />
                  </div>
                </Accordion>
                <Accordion title="Description" icon={icon(<path d="M4 5h12M4 9h12M4 13h8" />)}>
                  <p className={s.accText}>
                    {product.name}: {product.detail.toLowerCase()}. {cat?.blurb}
                  </p>
                </Accordion>
              </>
            ) : (
              <div className={s.pricing}>
                <div className={s.pricingLock} aria-hidden>
                  <svg viewBox="0 0 14 14" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2.5" y="6" width="9" height="6.5" rx="1" />
                    <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
                  </svg>
                </div>
                <p className={s.pricingTitle}>Your price, after you log in</p>
                <p className={s.accText}>
                  Prices on the dealer site are asset prices. For short-term memo pricing, call the office at {brand.office.phone}. Open memo items are repriced daily in your
                  dashboard.
                </p>
                <div className={s.pricingDoors}>
                  <Link href={account.login} className={s.primary}>
                    Dealer log in
                  </Link>
                  <Link href={account.apply} className={s.secondaryLink}>
                    Become a dealer
                  </Link>
                </div>
              </div>
            )}
          </div>
          <figure className={s.detailsFigure}>
            {ref && <figcaption className={`${s.figRef} tabular`}>Ref. {ref}</figcaption>}
            <span className={s.figImage} style={groundStyle(product.category)}>
              <Image src={renderSrc(image)} alt={`${product.name} in ${metalLabel.toLowerCase()}`} width={1000} height={1000} sizes="(min-width: 1024px) 34vw, 90vw" />
            </span>
            <p className={s.figNote}>
              <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 1.5l1.6 4.1L14 7.2l-4.4 1.6L8 13l-1.6-4.2L2 7.2l4.4-1.6Z" />
              </svg>
              Certificates can be provided on request.
            </p>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. See it in person ---------- */

export function InPerson({ product }: { product: Product }) {
  const thumbs = [product.image, ...products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 2).map((p) => p.image)];
  return (
    <section className={s.person} aria-labelledby="person-title">
      <div className={s.wrap}>
        <div className={s.personBand}>
          <span className={s.personThumbs} aria-hidden>
            {thumbs.map((t) => (
              <span key={t} className={s.personThumb}>
                <Image src={renderSrc(t)} alt="" width={160} height={160} sizes="80px" />
              </span>
            ))}
          </span>
          <span className={s.personCopy}>
            <span id="person-title" className={s.personTitle}>
              Loved it online? <em>See it in New York.</em>
            </span>
            <span className={s.personLine}>
              Schedule an appointment at our {brand.office.label}, {brand.office.address1}.
            </span>
          </span>
          <button type="button" className={s.primary} onClick={() => openContactDrawer("other", "visit")}>
            Schedule an appointment
            <Arrow />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- 5. You may also like ---------- */

function CardGrid({ list, emptyNote }: { list: Product[]; emptyNote?: string }) {
  const [shown, setShown] = useState(10);
  const quick = useQuickViewList(list);
  if (list.length === 0) return emptyNote ? <p className={s.emptyNote}>{emptyNote}</p> : null;
  return (
    <>
      <ul className={s.cardGrid}>
        {list.slice(0, shown).map((p) => (
          <li key={p.id}>
            <StoreCard product={p} preferredMetal={null} onQuickView={quick.open} />
          </li>
        ))}
      </ul>
      {quick.drawer}
      {shown < list.length && (
        <div className={s.loadRow}>
          <button type="button" className={s.loadBtn} onClick={() => setShown((n) => n + 10)}>
            Load more
          </button>
        </div>
      )}
    </>
  );
}

export function Similar({ product }: { product: Product }) {
  const [mode, setMode] = useState<"all" | "similar">("all");
  const all = useMemo(() => products.filter((p) => p.category === product.category && p.id !== product.id), [product]);
  const similar = useMemo(() => {
    if (product.shape) return products.filter((p) => p.id !== product.id && p.shape === product.shape);
    const ms = productMetals(product);
    return all.filter((p) => productMetals(p).some((m) => ms.includes(m)) && (p.video ? 1 : 0) === (product.video ? 1 : 0));
  }, [product, all]);
  const list = mode === "all" ? all : similar;

  return (
    <section id="similar" className={s.block} aria-labelledby="similar-title">
      <div className={s.wrap}>
        <div className={s.blockHead}>
          <h2 id="similar-title" className={s.sectionTitle}>
            You may <em>also like</em>
          </h2>
          <div className={s.tabs} role="tablist" aria-label="Designs">
            <button type="button" role="tab" aria-selected={mode === "all"} className={s.tab} onClick={() => setMode("all")}>
              All designs
            </button>
            <button type="button" role="tab" aria-selected={mode === "similar"} className={s.tab} onClick={() => setMode("similar")}>
              Similar designs
            </button>
          </div>
        </div>
        <CardGrid key={mode} list={list} emptyNote="No similar designs yet." />
      </div>
    </section>
  );
}

/* ---------- 6. Complete the look ---------- */

const PAIRS: Record<Category, Category[]> = {
  engagement: ["wedding-bands", "earrings", "necklaces", "bracelets"],
  "wedding-bands": ["engagement", "rings", "earrings", "bracelets"],
  earrings: ["necklaces", "pendants", "bracelets", "rings"],
  necklaces: ["earrings", "bracelets", "rings", "pendants"],
  pendants: ["earrings", "bracelets", "necklaces", "rings"],
  rings: ["bracelets", "earrings", "wedding-bands", "necklaces"],
  bracelets: ["rings", "earrings", "necklaces", "pendants"],
  "sterling-silver": ["pendants", "earrings", "bracelets", "rings"],
};

export function CompleteLook({ product }: { product: Product }) {
  const picks = PAIRS[product.category]
    .map((c) => products.find((p) => p.category === c && p.featured) ?? products.find((p) => p.category === c))
    .filter((p): p is Product => Boolean(p));
  const photo = editorial[product.category].wide[0] ?? editorial[product.category].single[0];
  const quick = useQuickViewList(picks);
  return (
    <section className={`${s.block} ${s.blockPaper}`} aria-labelledby="look-title">
      <div className={s.wrap}>
        <div className={s.blockHead}>
          <h2 id="look-title" className={s.sectionTitle}>
            Complete <em>the look</em>
          </h2>
          <p className={s.blockSub}>Pieces from across the catalog that sit well beside the {product.name}.</p>
        </div>
        <div className={s.look}>
          <figure className={s.lookPhoto}>
            <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" />
            <figcaption className={s.lookCaption}>
              <span>Campaign</span>
              {photo.caption}
            </figcaption>
          </figure>
          <ul className={s.lookGrid}>
            {picks.map((p) => (
              <li key={p.id}>
                <StoreCard product={p} preferredMetal={null} onQuickView={quick.open} />
              </li>
            ))}
          </ul>
          {quick.drawer}
        </div>
      </div>
    </section>
  );
}

/* ---------- 7. Explore by center stone or metal ---------- */

export function Explore({ product }: { product: Product }) {
  const byShape = Boolean(product.shape);
  const [shape, setShape] = useState<Shape>(product.shape ?? "round");
  const [metal, setMetal] = useState<Metal>(productMetals(product)[0]);
  const list = byShape ? products.filter((p) => p.shape === shape) : products.filter((p) => p.category === product.category && productMetals(p).includes(metal));
  const chips = byShape
    ? shapes.filter((x) => products.some((p) => p.shape === x.id)).map((x) => ({ id: x.id, label: x.label, on: shape === x.id, pick: () => setShape(x.id) }))
    : metals
        .filter((m) => products.some((p) => p.category === product.category && productMetals(p).includes(m.id)))
        .map((m) => ({ id: m.id, label: m.label, on: metal === m.id, pick: () => setMetal(m.id), swatch: m.swatch }));
  const more = byShape ? `/jewelry/engagement?shape=${shape}` : `/jewelry/${product.category}?metal=${metal}`;
  const shown = list.slice(0, 12);
  const quick = useQuickViewList(shown);

  return (
    <section className={s.block} aria-labelledby="explore-title">
      <div className={s.wrap}>
        <div className={s.blockHead}>
          <h2 id="explore-title" className={s.sectionTitle}>
            Explore by <em>{byShape ? "center stone" : "metal"}</em>
          </h2>
          <Link href={more} className={s.textLink}>
            View all
          </Link>
        </div>
        <div className={s.exploreChips} role="group" aria-label={byShape ? "Center stone" : "Metal"}>
          {chips.map((c) => (
            <button key={c.id} type="button" className={s.exploreChip} aria-pressed={c.on} onClick={c.pick}>
              {"swatch" in c && c.swatch ? <span className={s.metalDot} style={{ background: c.swatch }} aria-hidden /> : <ShapeGlyph id={c.id as Shape} />}
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <ul className={s.rail}>
        {shown.map((p) => (
          <li key={p.id} className={s.railItem}>
            <StoreCard product={p} preferredMetal={byShape ? null : metal} onQuickView={quick.open} />
          </li>
        ))}
      </ul>
      {quick.drawer}
    </section>
  );
}

function ShapeGlyph({ id }: { id: Shape }) {
  const d: Record<Shape, ReactNode> = {
    round: <circle cx="10" cy="10" r="6.5" />,
    oval: <ellipse cx="10" cy="10" rx="5" ry="7" />,
    emerald: <path d="M7 3h6l3 3v8l-3 3H7l-3-3V6Z" />,
    radiant: <path d="M7 3.5h6l2.5 2.5v8L13 16.5H7L4.5 14V6Z" />,
    princess: <rect x="4" y="4" width="12" height="12" />,
    pear: <path d="M10 3c3 3.5 5.5 6.5 5.5 9a5.5 5.5 0 0 1-11 0C4.5 9.5 7 6.5 10 3Z" />,
  };
  return (
    <svg aria-hidden viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
      {d[id]}
    </svg>
  );
}

/* ---------- 8. Dealer questions ---------- */

const QUESTIONS: { q: string; a: ReactNode }[] = [
  {
    q: "How do I see the price of this piece?",
    a: (
      <>
        Log in to your dealer account. Prices on the dealer site are asset prices; for short-term memo pricing, call the office at{" "}
        <a href={brand.office.phoneHref}>{brand.office.phone}</a>.
      </>
    ),
  },
  { q: "Can jewelry come on memo?", a: "Surreal runs a long-term memo program for diamonds and jewelry. Open memo items are repriced daily, and you reconcile them from your Retailer Dashboard." },
  { q: "When will an order arrive?", a: "Order before 4:00pm EST to receive next day delivery." },
  { q: "How can we pay?", a: "By credit or debit card, ACH or wire transfer at checkout. Check and Zelle are arranged with the office." },
  { q: "Is a certificate included?", a: "Certificates can be provided on request. Made to Order diamonds always come with an IGI grading certificate." },
  {
    q: "Can it be made in another metal, size or design?",
    a: "Yes. Send a custom request: our CAD department can make just about any jewelry item, in 14K, 18K or platinum, with F+ color and VS+ clarity diamonds.",
  },
];

export function DealerQuestions() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className={`${s.block} ${s.blockPaper}`} aria-labelledby="faq-title">
      <div className={`${s.wrap} ${s.faq}`}>
        <div className={s.faqIntro}>
          <h2 id="faq-title" className={s.sectionTitle}>
            Dealer <em>questions</em>
          </h2>
          <p className={s.blockSub}>Anything else, call {brand.office.phone}, {brand.office.hours}.</p>
          <button type="button" className={s.secondary} onClick={() => openContactDrawer("other", "contact")}>
            Ask a question
          </button>
        </div>
        <ul className={s.faqList}>
          {QUESTIONS.map((item, i) => (
            <li key={item.q} className={s.faqItem} data-open={open === i ? "true" : undefined}>
              <button type="button" className={s.faqQ} aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span className={`t-index ${s.faqIndex}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className={s.faqText}>{item.q}</span>
                <span className={s.faqPlus} aria-hidden />
              </button>
              {open === i && <div className={s.faqA}>{item.a}</div>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
