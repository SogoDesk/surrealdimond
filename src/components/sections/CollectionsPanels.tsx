"use client";

/**
 * Panels for the Collections gallery: the paper category card, the lifestyle
 * interlude, the loose diamonds card with its plan-view brilliant drawing, the
 * trailing See everything panel, and the masked rolling counter.
 *
 * Every panel is an <li data-panel> so the gallery stays an ordered list for
 * keyboard and screen readers. Elements marked data-parallax are moved by the
 * gallery's own ScrollTrigger; facet paths marked data-facet are drawn with
 * DrawSVG when the loose diamonds card enters.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import Button from "@/components/ui/Button";
import { registerGsap, gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import s from "./Collections.module.css";

export const pad2 = (n: number) => String(n).padStart(2, "0");

const RENDER_SIZES = "(min-width: 768px) 24vw, 54vw";
const PHOTO_SIZES = "(min-width: 768px) 53vw, 100vw";

function Arrow({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" className={className} fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M3 12h17M14 5.5l6.5 6.5-6.5 6.5" />
    </svg>
  );
}

export interface CategoryCardProps {
  number: number;
  label: string;
  href: string;
  image: string;
  alt: string;
}

export function CategoryCard({ number, label, href, image, alt }: CategoryCardProps) {
  return (
    <li data-panel="card" className={s.card}>
      <Link href={href} data-cursor="view" className={s.cardLink} aria-label={`${label}, shop the category`}>
        <span className={`t-index ${s.index}`}>{pad2(number)}</span>
        <span className={s.renderWell}>
          <span data-parallax className={s.renderMove}>
            <Image
              src={`/media/renders/${image}.webp`}
              alt={alt}
              width={1200}
              height={1200}
              sizes={RENDER_SIZES}
              draggable={false}
              className={`render-multiply ${s.render}`}
            />
          </span>
        </span>
        <span className={`t-card-title ${s.title}`}>{label}</span>
        <Arrow className={s.arrow} />
      </Link>
    </li>
  );
}

export interface InterludeProps {
  src: string;
  width: number;
  height: number;
  caption: string;
  alt: string;
}

export function Interlude({ src, width, height, caption, alt }: InterludeProps) {
  return (
    <li data-panel="interlude" className={s.interlude}>
      <figure data-cursor="view" className={s.interludeFrame}>
        <span data-parallax className={s.photoMove}>
          <Image src={src} alt={alt} width={width} height={height} sizes={PHOTO_SIZES} draggable={false} className={s.photo} />
        </span>
        <span aria-hidden className={s.scrim} />
        <figcaption className={s.caption}>{caption}</figcaption>
      </figure>
    </li>
  );
}

/* Plan view of a round brilliant: girdle, table, star, bezel and upper girdle facet lines. */
const C = 110;
const GIRDLE = 100;
const TABLE = 54;
const STAR = 78;

function point(deg: number, r: number): string {
  const a = (deg * Math.PI) / 180;
  return `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`;
}

function brilliantPaths(): string[] {
  const paths: string[] = [];
  const table = Array.from({ length: 8 }, (_, k) => point(k * 45, TABLE));
  paths.push(`M${table.join(" L")} Z`);
  for (let k = 0; k < 8; k += 1) {
    const t0 = table[k];
    const t1 = table[(k + 1) % 8];
    const star = point(k * 45 + 22.5, STAR);
    const starPrev = point(k * 45 - 22.5, STAR);
    const bezelTip = point(k * 45, GIRDLE);
    const girdle = point(k * 45 + 22.5, GIRDLE);
    paths.push(`M${t0} L${star} L${t1}`);
    paths.push(`M${starPrev} L${bezelTip} L${star}`);
    paths.push(`M${t0} L${bezelTip}`);
    paths.push(`M${star} L${girdle}`);
  }
  return paths;
}

export function BrilliantPlan() {
  const paths = useMemo(() => brilliantPaths(), []);
  return (
    <svg viewBox="0 0 220 220" className={s.brilliant} role="img" aria-label="Plan view of a round brilliant cut" data-brilliant>
      <g className={s.brilliantSpin} fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke">
        <circle data-facet cx={C} cy={C} r={GIRDLE} vectorEffect="non-scaling-stroke" />
        {paths.map((d, i) => (
          <path key={i} data-facet d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}

export function LooseDiamondsCard({ number, label, href }: { number: number; label: string; href: string }) {
  return (
    <li data-panel="loose" className={s.card}>
      <Link href={href} data-cursor="view" className={s.cardLink} aria-label={`${label}, search loose diamonds`}>
        <span className={`t-index ${s.index}`}>{pad2(number)}</span>
        <span className={s.renderWell}>
          <span className={s.brilliantWell}>
            <BrilliantPlan />
            <span className={`t-eyebrow ${s.brilliantLabel}`}>Search loose diamonds</span>
          </span>
        </span>
        <span className={`t-card-title ${s.title}`}>{label}</span>
        <Arrow className={s.arrow} />
      </Link>
    </li>
  );
}

export function TrailingPanel({ href }: { href: string }) {
  return (
    <li data-panel="trailing" className={s.trailing}>
      <Button variant="tertiary" href={href}>
        See everything
      </Button>
    </li>
  );
}

/* Masked digit roll for the 01 / 11 counter. */
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function Digit({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    registerGsap();
    const el = ref.current;
    if (!el) return;
    gsap.to(el, { y: `${-value}em`, duration: prefersReducedMotion() ? 0 : 0.6, ease: "surreal", overwrite: true });
  }, [value]);
  return (
    <span className={s.digitMask} aria-hidden>
      <span ref={ref} className={s.digitColumn}>
        {DIGITS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </span>
    </span>
  );
}

export function RollingCounter({ value, total }: { value: number; total: number }) {
  const clamped = Math.max(1, Math.min(total, value));
  return (
    <span className={`t-index ${s.counter}`} role="status" aria-live="polite" aria-label={`Panel ${clamped} of ${total}`}>
      <Digit value={Math.floor(clamped / 10)} />
      <Digit value={clamped % 10} />
      <span aria-hidden className={s.counterTotal}>
        {" / "}
        {pad2(total)}
      </span>
    </span>
  );
}
