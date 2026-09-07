"use client";

/**
 * 10. Know your diamond (education)
 *
 * Light chapter, 140vh, not pinned. Left, columns 1 to 5: a hand-built SVG
 * cross-section of a round brilliant, sticky at 60vh, drawn by DrawSVG as the
 * section travels and lit by a looping light ray (DiamondDiagram). Right,
 * columns 7 to 12: eyebrow, headline, body, three hairline rows into the
 * education pages, and the primary pill.
 *
 * Rows reveal with a 30px rise and their hairlines drawing scaleX 0 to 1,
 * stagger 0.1s. Hovering a row (focus and tap included) highlights the related
 * region of the diagram through its imperative handle: the history row pulses
 * the whole stone, the guide row glows the crown and pavilion labels, the FAQ
 * row speeds up the ray. Reduced motion: no reveals, static diagram.
 *
 * Section does not forward a ref, so the grid div (the section's whole content,
 * 140vh) carries rootRef and acts as the diagram's scrub trigger and the scope.
 */

import Link from "next/link";
import { useRef, type FocusEvent, type PointerEvent } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/motion/Reveal";
import SplitReveal from "@/components/motion/SplitReveal";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import DiamondDiagram, { type DiagramFocus, type DiamondDiagramHandle } from "./DiamondDiagram";
import styles from "./Education.module.css";

const ROWS: { index: string; label: string; href: string; focus: DiagramFocus }[] = [
  { index: "01", label: "The history of CVD", href: "/education/history", focus: "history" },
  { index: "02", label: "The diamond guide", href: "/education/diamond-guide", focus: "guide" },
  { index: "03", label: "Frequently asked questions", href: "/education/faq", focus: "faq" },
];

export interface EducationProps {
  className?: string;
}

export default function Education({ className = "" }: EducationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLUListElement>(null);
  const diagramRef = useRef<DiamondDiagramHandle>(null);

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      const rows = rowsRef.current;
      if (!root || !rows || prefersReducedMotion()) return;

      const eyebrowRule = root.querySelector<HTMLElement>(".eyebrow-rule");
      const eyebrowLabel = eyebrowRule?.nextElementSibling as HTMLElement | null;
      if (eyebrowRule && eyebrowLabel) {
        const trigger = { trigger: textRef.current ?? root, start: "top 85%", once: true };
        gsap.fromTo(eyebrowRule, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 1, ease: "surreal", scrollTrigger: trigger });
        gsap.fromTo(eyebrowLabel, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 1, delay: 0.15, ease: "surreal", scrollTrigger: trigger });
      }

      const links = Array.from(rows.querySelectorAll<HTMLElement>("[data-row]"));
      const rules = Array.from(rows.querySelectorAll<HTMLElement>("[data-rule]"));
      const tl = gsap.timeline({ scrollTrigger: { trigger: rows, start: "top 85%", once: true } });
      tl.fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "surreal", stagger: 0.1 }, 0);
      tl.fromTo(
        links,
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.1, ease: "surreal", stagger: 0.1, clearProps: "transform" },
        0.1,
      );
    },
    { scope: rootRef },
  );

  /* Hover, keyboard focus and touch share one active state: the row carries
     data-active for its wash, numeral and arrow, and the diagram highlights
     the related region through its handle. */
  type RowEvent = PointerEvent<HTMLAnchorElement> | FocusEvent<HTMLAnchorElement>;
  const activate = (region: DiagramFocus) => (e: RowEvent) => {
    e.currentTarget.dataset.active = "true";
    diagramRef.current?.highlight(region);
  };
  const deactivate = (e: RowEvent) => {
    delete e.currentTarget.dataset.active;
    diagramRef.current?.highlight(null);
  };

  return (
    <Section id="education" theme="light" label="Education" className={`${styles.section} ${className}`}>
      <div ref={rootRef} className={`container grid-12 ${styles.grid}`}>
        <div className={styles.stageCol}>
          <div className={styles.stage}>
            <DiamondDiagram ref={diagramRef} triggerRef={rootRef} />
          </div>
        </div>

        <div ref={textRef} className={styles.textCol}>
          <div className={styles.eyebrow}>
            <Eyebrow>Education</Eyebrow>
          </div>
          <SplitReveal as="h2" className={`t-headline-sm ${styles.headline}`} stagger={0.04}>
            Know your <em>diamond</em>.
          </SplitReveal>
          <Reveal as="p" effect="fade-up" delay={0.15} className={`t-body ${styles.body}`}>
            How a CVD diamond grows, why DEF color and VVS clarity matter, and how to read a stone with confidence.
            Everything you need before you choose.
          </Reveal>

          <ul ref={rowsRef} className={styles.rows}>
            {ROWS.map((row, i) => (
              <li key={row.href} className={styles.rowItem}>
                <span aria-hidden data-rule className={styles.rule} />
                <Link
                  href={row.href}
                  data-row
                  data-cursor="open"
                  className={styles.row}
                  onPointerEnter={activate(row.focus)}
                  onPointerLeave={deactivate}
                  onPointerCancel={deactivate}
                  onFocus={activate(row.focus)}
                  onBlur={deactivate}
                >
                  <span aria-hidden className={styles.wash} />
                  <span className={`t-index ${styles.numeral}`}>{row.index}</span>
                  <span className={styles.rowTitle}>{row.label}</span>
                  <svg aria-hidden viewBox="0 0 28 12" className={styles.arrow} fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M0 6h26M21 1l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                {i === ROWS.length - 1 && <span aria-hidden data-rule className={`${styles.rule} ${styles.ruleEnd}`} />}
              </li>
            ))}
          </ul>

          <Reveal effect="fade-up" delay={0.1} className={styles.cta}>
            <Button href="/education/diamond-guide" variant="primary" arrow>
              Open the diamond guide
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
