"use client";

/**
 * 5. Programs: Made to Order, Legacy and Custom, the three stories on the
 * live homepage, as image cards. Made to Order leads as a wide card (image
 * left, copy right); Legacy and Custom follow side by side. Each card: a
 * photograph that opens with a clip reveal and carries a glass chip, an
 * index and eyebrow, a Cormorant title with its italic phrase, the body, a
 * short fact list with sky diamond bullets, and the program's door.
 */

import Image from "next/image";
import { useRef } from "react";
import Button from "@/components/ui/Button";
import { programs, type Program } from "@/content/home";
import { brand } from "@/content/site";
import SectionHead from "./SectionHead";
import { useRevealIn } from "./useRevealIn";
import h from "./home.module.css";
import s from "./Programs.module.css";

function Bullet() {
  return (
    <svg aria-hidden viewBox="0 0 10 10" width="9" height="9" className={s.bullet}>
      <path d="M5 0.5 9.5 5 5 9.5 0.5 5Z" fill="currentColor" />
    </svg>
  );
}

function Card({ p, wide = false }: { p: Program; wide?: boolean }) {
  return (
    <article className={s.card} data-wide={wide ? "true" : undefined} data-rise>
      <div className={s.media} data-reveal-img>
        <Image src={p.image} alt={p.imageAlt} fill sizes={wide ? "(min-width: 900px) 56vw, 100vw" : "(min-width: 900px) 44vw, 100vw"} className={s.image} />
        <span className={s.chip}>{p.chip}</span>
      </div>
      <div className={s.body}>
        <div className={s.meta}>
          <span className={`t-index ${s.index}`}>{p.index}</span>
          <span className={s.rule} aria-hidden />
          <span className="t-eyebrow">{p.eyebrow}</span>
        </div>
        <h3 className={s.title}>
          {p.title} <em>{p.emphasis}</em>
        </h3>
        <p className={s.text}>{p.body}</p>
        <ul className={s.facts}>
          {p.facts.map((f) => (
            <li key={f}>
              <Bullet />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className={s.cta}>
          <Button href={p.href} variant={wide ? "primary" : "secondary"} arrow>
            {p.cta}
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function Programs() {
  const ref = useRef<HTMLElement>(null);
  useRevealIn(ref);
  const [lead, ...pair] = programs;

  return (
    <section ref={ref} className={`${h.section} ${s.section}`} aria-labelledby="programs-title" data-chapter="programs">
      <div className={h.wrap}>
        <SectionHead
          id="programs-title"
          align="row"
          eyebrow="Programs for dealers"
          title={
            <>
              Grown, set and made <em>for your clients</em>
            </>
          }
          sub="Three programs from the grower, open to every Surreal dealer."
          action={
            <Button href={brand.office.phoneHref} variant="tertiary" arrow>
              Call {brand.office.phone}
            </Button>
          }
        />
        <div className={s.grid}>
          <Card p={lead} wide />
          {pair.map((p) => (
            <Card key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
