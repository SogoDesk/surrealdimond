"use client";

/**
 * 05. Programs band. Three hairline tiles after the grid (Made to Order,
 * Diamond Legacy, Custom), each with an eyebrow, a Cormorant line and a
 * tertiary link, revealing with a 0.1 stagger. The footer follows.
 */

import { useRef } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import s from "./shop.module.css";

const PROGRAMS = [
  { id: "made-to-order", eyebrow: "Made to Order", line: "Grown specifically for you.", link: "Made to order diamonds", href: "/made-to-order" },
  { id: "legacy", eyebrow: "Diamond Legacy", line: "One seed line, every generation.", link: "Diamond Legacy", href: "/legacy" },
  { id: "custom", eyebrow: "Custom", line: "From a sketch to a setting.", link: "Custom jewelry", href: "/custom" },
];

export default function ProgramsBand() {
  const rootRef = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      if (!root) return;
      const tiles = gsap.utils.toArray<HTMLElement>("[data-program]", root);
      const reduced = prefersReducedMotion();
      gsap.set(tiles, reduced ? { autoAlpha: 0 } : { autoAlpha: 0, y: 32 });
      gsap.to(tiles, {
        autoAlpha: 1,
        y: 0,
        duration: reduced ? 0.3 : 1.2,
        ease: reduced ? "none" : "surreal",
        stagger: 0.1,
        scrollTrigger: { trigger: root, start: "top 85%", once: true },
        onComplete: () => gsap.set(tiles, { clearProps: "transform" }),
      });
    },
    { scope: rootRef },
  );

  return (
    <Section id="shop-programs" theme="light" label="Programs">
      <div className={s.programs}>
        <ul ref={rootRef} className={s.programGrid}>
          {PROGRAMS.map((p) => (
            <li key={p.id} className={s.program} data-program>
              <div className={s.programCopy}>
                <Eyebrow>{p.eyebrow}</Eyebrow>
                <p className={s.programLine}>{p.line}</p>
              </div>
              <Button variant="tertiary" href={p.href}>
                {p.link}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
