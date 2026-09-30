"use client";

/**
 * The Surreal Assurance, the band before the footer on the homepage, the
 * store and the product pages (after Tanishq's assurance row). A centred
 * title and subline over four emblems, each a solid shape in the house
 * "platinum sky" gradient with white line art, above a two line promise.
 * Every promise is a verified fact from src/content/site.ts. Emblems rise in
 * with a stagger; on hover an emblem lifts and a light sweeps across it.
 */

import { useId, useRef } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import s from "./Assurance.module.css";

type EmblemId = "grower" | "grade" | "ethics" | "craft";

const ITEMS: { id: EmblemId; line1: string; line2: string }[] = [
  { id: "grower", line1: "Grown by the largest", line2: "CVD grower" },
  { id: "grade", line1: "Primarily DEF color,", line2: "VVS clarity" },
  { id: "ethics", line1: "Ethically made, identical", line2: "to a mined diamond" },
  { id: "craft", line1: "Handcrafted by the", line2: "finest craftspeople" },
];

function Emblem({ id }: { id: EmblemId }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const fill = `url(#metal-${uid})`;
  const W = { fill: "none", stroke: "#ffffff", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 120 120" className={s.emblem} aria-hidden>
      <defs>
        <linearGradient id={`metal-${uid}`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#e9f7fd" />
          <stop offset="38%" stopColor="#9fd6ec" />
          <stop offset="72%" stopColor="#5b9bb9" />
          <stop offset="100%" stopColor="#1f4d66" />
        </linearGradient>
        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          {id === "grower" && <path d="M22 104V58a38 38 0 0 1 76 0v46Z" />}
          {id === "grade" && <circle cx="60" cy="60" r="44" />}
          {id === "ethics" && <path d="M34 22h52l24 30-50 58L10 52Z" />}
          {id === "craft" && <path d="M22 18h76v42c0 26-20 42-38 50-18-8-38-24-38-50Z" />}
        </clipPath>
      </defs>

      {id === "grower" && (
        <>
          <path d="M14 62a46 46 0 0 1 82-28" {...W} stroke="#9fd6ec" strokeWidth={1.4} />
          <path d="M92 26l5 8-9 1" {...W} stroke="#9fd6ec" strokeWidth={1.4} />
          <path d="M22 104V58a38 38 0 0 1 76 0v46Z" fill={fill} />
          <path d="M48 58h24l7 9-19 22-19-22Z" {...W} />
          <path d="M41 67h38M53 58l-3 9 10 22 10-22-3-9" {...W} strokeWidth={1.1} />
          <path d="M60 50V38M52 44l8-6 8 6" {...W} />
          <path d="M38 96h44" {...W} strokeWidth={1.1} />
        </>
      )}
      {id === "grade" && (
        <>
          <circle cx="60" cy="60" r="52" fill="none" stroke="#9fd6ec" strokeWidth="1.2" strokeDasharray="2 4" />
          <circle cx="60" cy="60" r="44" fill={fill} />
          <circle cx="60" cy="60" r="36" {...W} strokeWidth={1.1} />
          <text x="60" y="64" textAnchor="middle" className={s.emblemText}>
            DEF
          </text>
          <text x="60" y="80" textAnchor="middle" className={s.emblemSmall}>
            VVS
          </text>
          <path d="M60 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#ffffff" />
        </>
      )}
      {id === "ethics" && (
        <>
          <path d="M34 22h52l24 30-50 58L10 52Z" fill={fill} />
          <path d="M10 52h100M34 22l-8 30 34 58 34-58-8-30" {...W} strokeWidth={1.2} />
          <path d="M60 22 44 52l16 58 16-58Z" {...W} strokeWidth={1.2} />
          <path d="M26 52 44 22M94 52 76 22" {...W} strokeWidth={0.9} opacity={0.7} />
        </>
      )}
      {id === "craft" && (
        <>
          <path d="M22 18h76v42c0 26-20 42-38 50-18-8-38-24-38-50Z" fill={fill} />
          <circle cx="60" cy="66" r="18" {...W} />
          <path d="M52 42h16l5 6-13 12-13-12Z" {...W} />
          <path d="M47 48h26" {...W} strokeWidth={1.1} />
          <path d="M84 30l2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#ffffff" />
        </>
      )}
      <g clipPath={`url(#clip-${uid})`}>
        <rect className={s.sheen} x="-60" y="0" width="50" height="120" fill={`url(#sheen-${uid})`} />
      </g>
    </svg>
  );
}

export default function Assurance({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const root = ref.current;
      if (!root || prefersReducedMotion()) return;
      const items = root.querySelectorAll("[data-assure]");
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 1.1, ease: "surreal", stagger: 0.1, clearProps: "transform", scrollTrigger: { trigger: root, start: "top 85%", once: true } },
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className={`${s.section} ${className}`} aria-labelledby="assurance-title">
      <div className={s.wrap}>
        <header className={s.head} data-assure>
          <h2 id="assurance-title" className={s.title}>
            The Surreal <em>Assurance</em>
          </h2>
          <p className={s.sub}>Grown by us. Crafted by hand.</p>
        </header>
        <ul className={s.list}>
          {ITEMS.map((item) => (
            <li key={item.id} className={s.item} data-assure>
              <Emblem id={item.id} />
              <p className={s.label}>
                {item.line1}
                <br />
                {item.line2}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
