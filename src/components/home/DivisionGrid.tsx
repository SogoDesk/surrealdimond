"use client";

/**
 * 3. Shop by category: the nine jewelry types as square white render tiles
 * and a tenth tile that leads to the full catalog of sixteen divisions. On
 * hover a tile lifts, a pale sky light blooms behind the piece, the render
 * scales and an arrow slides in beside the label.
 */

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { divisions, divisionTypes } from "@/content/divisions";
import { renderSrc } from "@/content/catalog";
import SectionHead from "./SectionHead";
import { useRevealIn } from "./useRevealIn";
import h from "./home.module.css";
import s from "./DivisionGrid.module.css";

function ArrowSmall() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export default function DivisionGrid() {
  const ref = useRef<HTMLElement>(null);
  useRevealIn(ref);

  return (
    <section ref={ref} className={`${h.section} ${s.section}`} aria-labelledby="divisions-title" data-chapter="divisions">
      <div className={h.wrap}>
        <SectionHead
          id="divisions-title"
          eyebrow="The collection"
          title={
            <>
              Shop by <em>category</em>
            </>
          }
          sub="Nine types of fine jewelry, all set with lab grown diamonds we grow ourselves."
        />
        <ul className={s.grid}>
          {divisionTypes.map((d, i) => (
            <li key={d.id} data-rise>
              <Link href={d.href} className={s.tile}>
                <span className={s.well}>
                  <span className={s.glow} aria-hidden />
                  <span className={`t-index ${s.index}`} aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {d.image && <Image src={renderSrc(d.image)} alt="" width={600} height={600} sizes="(min-width: 1280px) 17vw, (min-width: 768px) 30vw, 44vw" className={s.render} />}
                </span>
                <span className={s.label}>
                  <span>{d.label}</span>
                  <span className={s.arrow}>
                    <ArrowSmall />
                  </span>
                </span>
              </Link>
            </li>
          ))}
          <li data-rise>
            <Link href="/jewelry" className={`${s.tile} ${s.all}`}>
              <span className={s.allInner}>
                <span className={s.allFigure}>{divisions.length}</span>
                <span className={s.allText}>divisions, from engagement rings to the seasonal catalogs</span>
                <span className={`t-nav ${s.allCta}`}>
                  View all
                  <ArrowSmall />
                </span>
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
