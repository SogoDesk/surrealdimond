"use client";

/**
 * 4. Collections bento: the five named collections from the live jewelry
 * menu. Four have no photography yet, so each tile is carried by its drawn
 * motif (DivisionMotif) full bleed, with the name set over it; Sterling Silver
 * shows its real render. Constellation takes the tall tile. Lines draw in on
 * entry and the stars twinkle on a slow loop (CSS); on hover the motif drifts
 * larger and the arrow fills. Constellation opens from its bottom edge, the
 * others wipe in from alternating sides.
 */

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import DivisionMotif from "@/components/brand/DivisionMotif";
import Button from "@/components/ui/Button";
import { divisionCollections, type Division } from "@/content/divisions";
import { renderSrc } from "@/content/catalog";
import SectionHead from "./SectionHead";
import { useRevealIn } from "./useRevealIn";
import h from "./home.module.css";
import s from "./CollectionsBento.module.css";

const TONE: Record<string, "dark" | "light"> = {
  constellation: "dark",
  "enamour-enamel": "light",
  "laser-pierced": "dark",
  vermeil: "light",
  "sterling-silver": "light",
};

function Tile({ d, featured = false }: { d: Division; featured?: boolean }) {
  return (
    <Link href={d.href} className={s.tile} data-tone={TONE[d.id] ?? "light"} data-featured={featured ? "true" : undefined} data-id={d.id}>
      <span className={s.art} aria-hidden>
        {d.motif && !d.image && <DivisionMotif motif={d.motif} className={s.motif} />}
        {d.image && (
          <span className={s.render}>
            <Image src={renderSrc(d.image)} alt="" width={800} height={800} sizes="(min-width: 900px) 24vw, 80vw" />
          </span>
        )}
      </span>
      <span className={s.copy}>
        <span className={s.kicker}>Collection</span>
        <span className={s.name}>{d.label.replace(" Collection", "")}</span>
        {d.note && <span className={s.note}>{d.note}</span>}
      </span>
      <span className={s.go} aria-hidden>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12 12 4M6 4h6v6" />
        </svg>
      </span>
    </Link>
  );
}

export default function CollectionsBento() {
  const ref = useRef<HTMLElement>(null);
  useRevealIn(ref, { handoff: true });
  const [first, ...rest] = divisionCollections;

  return (
    <section ref={ref} className={h.section} aria-labelledby="collections-title" data-chapter="collections">
      <div className={h.wrap}>
        <SectionHead
          id="collections-title"
          align="row"
          eyebrow="Collections"
          title={
            <>
              Five collections, <em>one grower</em>
            </>
          }
          sub="From twelve zodiac pendants to enamel, laser pierced, vermeil and sterling silver pieces."
          action={
            <Button href="/jewelry" variant="tertiary" arrow>
              All collections
            </Button>
          }
        />
        <ul className={s.bento}>
          <li className={s.cellFeature} data-reveal-img="bottom">
            <Tile d={first} featured />
          </li>
          {rest.map((d, i) => (
            <li key={d.id} className={s[`cell${i + 1}`]} data-reveal-img={i % 2 ? "right" : "left"} data-reveal-delay={0.1 + (i % 2) * 0.1}>
              <Tile d={d} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
