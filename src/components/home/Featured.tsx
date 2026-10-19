"use client";

/**
 * 6. Hot this week (BRD R-03), on Tanishq's new arrivals pattern, fed from
 * the featuring list the admin console owns (lib/merch.ts, defaults in
 * content/featuring.ts). A
 * photographic band (copy and a count chip on the left, the photograph
 * dissolving in from the right) with a row of product cards riding over its
 * lower edge. The row is a native horizontal scroller with snap, driven by
 * the arrow buttons on desktop and by touch on phones. Each card: the render
 * on its category's story ground (hovering crossfades to the piece's second
 * view or metal), the name and design line, the metals it comes in, and the
 * dealer price door.
 */

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Eyebrow from "@/components/ui/Eyebrow";
import { metals, productById, productMetals, renderSrc, type Product } from "@/content/catalog";
import { useMerch } from "@/lib/merch";
import { account } from "@/content/site";
import { groundStyle } from "@/content/grounds";
import { useRevealIn } from "./useRevealIn";
import h from "./home.module.css";
import s from "./Featured.module.css";

function altView(p: Product) {
  if (p.angles?.[0]) return p.angles[0];
  const yg = p.variants?.yg;
  if (yg && yg !== p.image) return yg;
  return null;
}

function LockIcon() {
  return (
    <svg aria-hidden viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="6" width="9" height="6.5" rx="1" />
      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
    </svg>
  );
}

function Card({ p }: { p: Product }) {
  const alt = altView(p);
  const ms = productMetals(p);
  return (
    <article className={s.card}>
      <Link href={`/jewelry/${p.category}`} className={s.cardLink} aria-label={`${p.name}, ${p.detail}`}>
        <span className={s.well} style={groundStyle(p.category)}>
          <Image src={renderSrc(p.image)} alt="" width={600} height={600} sizes="300px" className={`${s.render} ${alt ? s.renderBase : ""}`} />
          {alt && <Image src={renderSrc(alt)} alt="" width={600} height={600} sizes="300px" className={`${s.render} ${s.renderAlt}`} loading="lazy" />}
          {p.video && <span className={s.tag}>360</span>}
        </span>
        <span className={s.meta}>
          <span className={s.name}>{p.name}</span>
          <span className={s.detail}>{p.detail}</span>
        </span>
      </Link>
      <div className={s.foot}>
        <span className={s.metals} aria-label={`Shown in ${ms.map((m) => metals.find((x) => x.id === m)?.label).join(", ")}`}>
          {ms.map((m) => (
            <span key={m} className={s.metal} style={{ background: metals.find((x) => x.id === m)?.swatch }} />
          ))}
        </span>
        <Link href={account.login} className={s.price}>
          <LockIcon />
          Dealer price
        </Link>
      </div>
    </article>
  );
}

export default function Featured() {
  const ref = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const { hot } = useMerch();
  const items = useMemo(() => hot.map((id) => productById(id)).filter((p): p is Product => Boolean(p)), [hot]);
  useRevealIn(ref);

  const measure = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const id = window.requestAnimationFrame(measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      window.cancelAnimationFrame(id);
    };
  }, [measure]);

  const scroll = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 20 : 320;
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };

  return (
    <section ref={ref} id="featured" className={`${h.section} ${s.section}`} aria-labelledby="featured-title" data-chapter="featured" hidden={items.length === 0}>
      <div className={h.wrap}>
        <div className={s.band}>
          <Image src="/media/photos/sb-3594.webp" alt="" fill sizes="(min-width: 900px) 70vw, 100vw" className={s.bandImage} />
          <div className={s.bandCopy}>
            <span data-rise>
              <Eyebrow>Featured by Surreal</Eyebrow>
            </span>
            <h2 id="featured-title" className={s.bandTitle} data-split>
              Hot <em>this week</em>
            </h2>
            <p className={s.bandLine} data-rise>
              <span className={s.count}>{items.length} pieces</span>
              Picked by the Surreal team. Dealer pricing and ordering after you log in.
            </p>
          </div>
          <div className={s.arrows}>
            <button type="button" className={s.arrow} onClick={() => scroll(-1)} disabled={edge.start} aria-label="Scroll back">
              <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 10H4M9 5l-5 5 5 5" />
              </svg>
            </button>
            <button type="button" className={s.arrow} onClick={() => scroll(1)} disabled={edge.end} aria-label="Scroll forward">
              <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <ul ref={railRef} className={s.rail} aria-label="Hot this week" data-lenis-prevent-wheel>
        {items.map((p) => (
          <li key={p.id} className={s.item} data-rise>
            <Card p={p} />
          </li>
        ))}
      </ul>
      <div className={h.wrap}>
        <div className={s.after} data-rise>
          <Link href="/jewelry" className={`t-nav ${s.viewAll}`}>
            View the full catalog
          </Link>
        </div>
      </div>
    </section>
  );
}
