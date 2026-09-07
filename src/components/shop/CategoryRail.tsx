"use client";

/**
 * Category rail under the masthead headline: nine 112px paper circles (All
 * plus the eight categories), each holding the category's render on multiply
 * (All draws the plan view brilliant), labelled in Jost 11 uppercase. The
 * active tile carries a 1px ink ring and a sky dot. Tiles are links to the
 * routes and stagger in from the left. On phones the rail scrolls with snap.
 */

import Image from "next/image";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { categories, renderSrc, type Category } from "@/content/catalog";
import { BrilliantPlan } from "@/components/sections/CollectionsPanels";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import s from "./shop.module.css";

const ALL_HREF = "/jewelry";
const SIZES = "112px";

export default function CategoryRail({ active }: { active: Category | null }) {
  const rootRef = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      if (!root) return;
      const tiles = gsap.utils.toArray<HTMLElement>("[data-rail-tile]", root);
      if (prefersReducedMotion()) {
        gsap.fromTo(tiles, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "none", stagger: 0.02 });
        return;
      }
      gsap.fromTo(
        tiles,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 1.1, ease: "surreal", stagger: 0.05, delay: 0.45, clearProps: "transform" },
      );
    },
    { scope: rootRef },
  );

  const tile = (href: string, label: string, isActive: boolean, media: ReactNode) => (
    <Link href={href} className={s.tile} data-rail-tile data-active={isActive ? "true" : undefined} aria-current={isActive ? "page" : undefined} data-cursor="link">
      <span className={s.circle}>{media}</span>
      <span className={s.tileLabel}>
        <span aria-hidden className={s.tileDot} />
        {label}
      </span>
    </Link>
  );

  return (
    <ul ref={rootRef} className={s.rail} aria-label="Categories">
      <li className={s.railItem}>
        {tile(
          ALL_HREF,
          "All",
          active === null,
          <span className={s.circleBrilliant}>
            <BrilliantPlan />
          </span>,
        )}
      </li>
      {categories.map((c) => (
        <li key={c.id} className={s.railItem}>
          {tile(
            `/jewelry/${c.id}`,
            c.label,
            active === c.id,
            <Image src={renderSrc(c.image)} alt="" width={1200} height={1200} sizes={SIZES} draggable={false} className={s.circleRender} />,
          )}
        </li>
      ))}
    </ul>
  );
}
