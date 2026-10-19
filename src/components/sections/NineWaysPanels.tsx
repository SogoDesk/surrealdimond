/**
 * Panels for the Nine ways to begin carousel (restored from the 9e31102
 * homepage): the category card with its campaign photograph, the loose
 * diamonds card with its plan-view brilliant drawing, and the closing card
 * for all divisions. Every panel is an <li> so the carousel stays a list for
 * keyboard and screen readers.
 */

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { renderSrc } from "@/content/catalog";
import s from "./NineWays.module.css";

const pad2 = (n: number) => String(n).padStart(2, "0");

const RENDER_SIZES = "(min-width: 768px) 14vw, 36vw";
const PHOTO_SIZES = "(min-width: 768px) 18vw, 46vw";

function Arrow({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" className={className} fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M3 12h17M14 5.5l6.5 6.5-6.5 6.5" />
    </svg>
  );
}

/**
 * A category: its one campaign photograph (BRD R-04), which gives way on hover
 * to the type's render on its story ground, as on the old Shop by category.
 */
export function CategoryCard({ number, label, href, photo, render, ground }: { number: number; label: string; href: string; photo: string; render?: string; ground: CSSProperties }) {
  return (
    <li className={s.card}>
      <Link href={href} className={`${s.cardLink} ${s.photoCard}`} aria-label={`${label}, shop the category`} draggable={false}>
        <span className={s.ground} style={ground} aria-hidden>
          {render && <Image src={renderSrc(render)} alt="" width={600} height={600} sizes={RENDER_SIZES} draggable={false} className={`render-multiply ${s.render}`} />}
        </span>
        <Image src={photo} alt="" fill sizes={PHOTO_SIZES} draggable={false} className={s.photo} />
        <span aria-hidden className={s.scrim} />
        <span className={`t-index ${s.index}`}>{pad2(number)}</span>
        <span className={s.title}>{label}</span>
        <Arrow className={s.arrow} />
      </Link>
    </li>
  );
}

/** The closing card: every division, with the count. */
export function AllDivisionsCard({ count, href }: { count: number; href: string }) {
  return (
    <li className={s.card}>
      <Link href={href} className={`${s.cardLink} ${s.allCard}`} draggable={false}>
        <span className={s.allFigure}>{count}</span>
        <span className={s.allText}>divisions, from engagement rings to the seasonal catalogs</span>
        <span className={`t-nav ${s.allCta}`}>
          View all
          <Arrow />
        </span>
      </Link>
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

const BRILLIANT_PATHS: string[] = (() => {
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
})();

function BrilliantPlan() {
  return (
    <svg viewBox="0 0 220 220" className={s.brilliant} aria-hidden>
      <g className={s.brilliantSpin} fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round">
        <circle cx={C} cy={C} r={GIRDLE} vectorEffect="non-scaling-stroke" />
        {BRILLIANT_PATHS.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}

export function LooseDiamondsCard({ number, label, href }: { number: number; label: string; href: string }) {
  return (
    <li className={s.card}>
      <Link href={href} className={s.cardLink} aria-label={`${label}, search loose diamonds`} draggable={false}>
        <span className={`t-index ${s.index}`}>{pad2(number)}</span>
        <span className={s.renderWell}>
          <span className={s.brilliantWell}>
            <BrilliantPlan />
            <span className={`t-eyebrow ${s.brilliantLabel}`}>Search the feed</span>
          </span>
        </span>
        <span className={s.title}>{label}</span>
        <Arrow className={s.arrow} />
      </Link>
    </li>
  );
}
