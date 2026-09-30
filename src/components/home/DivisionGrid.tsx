"use client";

/**
 * 3. Shop by category: one strong campaign photograph per jewelry type (BRD
 * R-04, R-05) and a tenth tile that leads to the full catalog of sixteen
 * divisions. On hover a tile lifts, the photograph gives way to the type's
 * render on its story ground, and an arrow slides in beside the label.
 */

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { divisions, divisionTypes } from "@/content/divisions";
import { renderSrc, type Category } from "@/content/catalog";
import { groundStyle } from "@/content/grounds";
import SectionHead from "./SectionHead";
import { useRevealIn } from "./useRevealIn";
import h from "./home.module.css";
import s from "./DivisionGrid.module.css";

/** Each type's story ground, by the catalog category it draws from. */
const GROUND: Record<string, Category> = {
  engagement: "engagement",
  "wedding-bands": "wedding-bands",
  rings: "rings",
  "stud-earrings": "earrings",
  earrings: "earrings",
  bracelets: "bracelets",
  "flexi-bangles": "bracelets",
  pendants: "pendants",
  necklaces: "necklaces",
};

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
                <span className={s.well} style={groundStyle(GROUND[d.id] ?? "engagement")}>
                  {d.image && <Image src={renderSrc(d.image)} alt="" width={600} height={600} sizes="(min-width: 1280px) 17vw, (min-width: 768px) 30vw, 44vw" className={s.render} />}
                  {d.photo && <Image src={d.photo} alt="" fill sizes="(min-width: 1280px) 17vw, (min-width: 768px) 30vw, 44vw" className={s.photo} />}
                  <span className={`t-index ${s.index}`} aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
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
