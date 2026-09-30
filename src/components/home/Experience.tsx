"use client";

/**
 * 9. The Surreal experience, after Tanishq's experience panel: a framed 3 by
 * 2 grid of photographs with a label bar beneath each (appointment, phone,
 * dashboard, custom portal, Legacy, our story). The appointment tile opens
 * the contact drawer; the phone tile dials the office.
 */

import Image from "next/image";
import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import { experience } from "@/content/home";
import { brand } from "@/content/site";
import SectionHead from "./SectionHead";
import { useRevealIn } from "./useRevealIn";
import h from "./home.module.css";
import s from "./Experience.module.css";

export default function Experience() {
  const ref = useRef<HTMLElement>(null);
  useRevealIn(ref);

  return (
    <section ref={ref} className={`${h.section} ${s.section}`} aria-labelledby="experience-title" data-chapter="experience">
      <div className={h.wrap}>
        <div className={s.panel}>
          <SectionHead
            id="experience-title"
            eyebrow="The Surreal experience"
            title={
              <>
                Visit, call or <em>log in</em>
              </>
            }
            sub={`${brand.office.label}, ${brand.office.address1}, New York. ${brand.office.hours}.`}
          />
          <ul className={s.grid}>
            {experience.map((t) => {
              const onClick =
                t.action === "appointment"
                  ? (e: MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault();
                      openContactDrawer("other", "visit");
                    }
                  : undefined;
              const inner = (
                <>
                  <span className={s.media}>
                    <Image src={t.image} alt="" fill sizes="(min-width: 900px) 30vw, (min-width: 600px) 45vw, 100vw" className={s.image} />
                  </span>
                  <span className={s.bar}>
                    <span className={s.label}>{t.label}</span>
                    <span className={s.line}>{t.line}</span>
                  </span>
                </>
              );
              return (
                <li key={t.id} data-rise>
                  {t.action === "phone" ? (
                    <a href={t.href} className={s.tile}>
                      {inner}
                    </a>
                  ) : (
                    <Link href={t.href} className={s.tile} onClick={onClick}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
