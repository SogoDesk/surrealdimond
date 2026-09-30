"use client";

/**
 * 8. Why Surreal for your store: the dealer program from the live Learn More
 * page. Left, held in place while the list scrolls past on desktop: the trade
 * pitch, the two doors and a photograph with a floating call stones card.
 * Right: the twelve benefits as a two column ledger, each with a drawn line
 * icon in a mist disc, a title and one line.
 */

import Image from "next/image";
import { useRef, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import { account, dealerBenefits } from "@/content/site";
import { useRevealIn } from "./useRevealIn";
import h from "./home.module.css";
import s from "./Benefits.module.css";

type IconId = (typeof dealerBenefits)[number]["icon"];

const ICONS: Record<IconId, ReactNode> = {
  pricing: <path d="M4 20 20 4M9 4H4v5M20 15v5h-5" />,
  territory: (
    <>
      <path d="M12 21s-6.5-6.2-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.8-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  memo: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" />
    </>
  ),
  "pricing-live": (
    <>
      <path d="M3.5 17 9 11.5l3.5 3.5L20.5 7" />
      <path d="M15.5 7h5v5" />
    </>
  ),
  replenish: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4v4h-4" />
    </>
  ),
  large: (
    <>
      <path d="M7 4h10l4 5-9 11L3 9Z" />
      <path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5" />
    </>
  ),
  feed: (
    <>
      <circle cx="6" cy="18" r="1.6" />
      <path d="M4.5 11a8.5 8.5 0 0 1 8.5 8.5M4.5 5a14.5 14.5 0 0 1 14.5 14.5" />
    </>
  ),
  marketing: (
    <>
      <path d="M4 10v4h3l7 4V6L7 10Z" />
      <path d="M17.5 9.5a3.5 3.5 0 0 1 0 5" />
    </>
  ),
  training: (
    <>
      <path d="M2.5 9 12 4.5 21.5 9 12 13.5Z" />
      <path d="M6.5 11v5c1.5 1.6 3.4 2.4 5.5 2.4s4-.8 5.5-2.4v-5M21.5 9v6" />
    </>
  ),
  spiff: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M3 10h18M7 14.5h4" />
    </>
  ),
  data: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  trade: (
    <>
      <path d="M4 9.5 5.5 4h13L20 9.5" />
      <path d="M4 9.5h16v1a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0 2.7 2.7 0 0 1-5.3 0Z" />
      <path d="M5.5 13v7h13v-7M10 20v-4h4v4" />
    </>
  ),
};

export default function Benefits() {
  const ref = useRef<HTMLElement>(null);
  useRevealIn(ref);

  return (
    <section ref={ref} className={`${h.section} ${s.section}`} aria-labelledby="benefits-title" data-chapter="benefits">
      <div className={`${h.wrap} ${s.grid}`}>
        <div className={s.aside}>
          <div className={s.sticky}>
            <span data-rise>
              <Eyebrow>For the trade</Eyebrow>
            </span>
            <h2 id="benefits-title" className={s.title} data-rise>
              Work with the grower at the <em>top of the food chain</em>.
            </h2>
            <p className={s.body} data-rise>
              Twelve parts of the Surreal dealer program, from pricing and memo to training and marketing.
            </p>
            <div className={s.doors} data-rise>
              <Button href={account.apply} variant="primary" arrow>
                Apply for an account
              </Button>
              <Button href="/about" variant="tertiary" arrow>
                Our story
              </Button>
            </div>
            <figure className={s.figure} data-rise>
              <span className={s.photo} data-reveal-img>
                <Image src="/media/photos/sb-3568.webp" alt="Seated model wearing stacked diamond rings and bracelets" fill sizes="(min-width: 900px) 34vw, 100vw" />
              </span>
              <figcaption className={s.float}>
                <span className={s.floatFigure}>10,000 to 15,000</span>
                <span className={s.floatLine}>call stones in the curated diamond feed</span>
              </figcaption>
            </figure>
          </div>
        </div>

        <ul className={s.ledger}>
          {dealerBenefits.map((b, i) => (
            <li key={b.id} className={s.item} data-rise>
              <span className={s.icon} aria-hidden>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  {ICONS[b.icon]}
                </svg>
              </span>
              <span className={s.text}>
                <span className={`t-index ${s.index}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className={s.itemTitle}>{b.title}</span>
                <span className={s.itemLine}>{b.line}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
