"use client";

/**
 * The Shop panel (DESIGN.md, "Navigation"). A paper sheet below the bar that
 * reveals with clip-path from the top edge, holding four grouped columns and a
 * 4:5 white render well on the right that crossfades between renders as the
 * links are hovered or focused. The header owns the open state and the 150ms
 * hover intent; this panel reports pointer enter and leave back through
 * onIntent so moving between the Shop link and the panel keeps it open.
 */

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { footerColumns } from "@/content/site";
import { renderSrc } from "@/content/catalog";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import styles from "./chrome.module.css";

const DEFAULT_RENDER = "le2004w442-11741";

const shopHref = (label: string, fallback: string) =>
  footerColumns.flatMap((c) => c.links as readonly { label: string; href: string }[]).find((l) => l.label === label)?.href ?? fallback;

interface MegaItem {
  label: string;
  href: string;
  render: string;
}
interface MegaColumn {
  title: string;
  items: MegaItem[];
}

const COLUMNS: MegaColumn[] = [
  {
    title: "Rings",
    items: [
      { label: "Engagement Rings", href: shopHref("Engagement Rings", "/jewelry/engagement"), render: DEFAULT_RENDER },
      { label: "Wedding Bands", href: shopHref("Wedding Bands", "/jewelry/wedding-bands"), render: "lgbrdl2658-eng-wg-lgbrdl2658-band-wg" },
      { label: "Rings", href: shopHref("Rings", "/jewelry/rings"), render: "branding-images8022" },
    ],
  },
  {
    title: "Ears and Neck",
    items: [
      { label: "Earrings", href: shopHref("Earrings", "/jewelry/earrings"), render: "in-and-out-hoops-yg" },
      { label: "Necklaces", href: shopHref("Necklaces", "/jewelry/necklaces"), render: "nkov18w440wg" },
      { label: "Pendants", href: shopHref("Pendants", "/jewelry/pendants"), render: "branding-images8028" },
    ],
  },
  {
    title: "Wrist",
    items: [
      { label: "Bracelets", href: shopHref("Bracelets", "/jewelry/bracelets"), render: "ca24mr0083-2725" },
      { label: "Sterling Silver", href: shopHref("Sterling Silver", "/jewelry/sterling-silver"), render: "jbii247sil-2638" },
    ],
  },
  {
    title: "Stones",
    items: [
      { label: "Loose Diamonds", href: shopHref("Loose Diamonds", "/diamonds"), render: DEFAULT_RENDER },
      { label: "Made to Order", href: shopHref("Made to Order Diamonds", "/made-to-order"), render: DEFAULT_RENDER },
    ],
  },
];

const ALL_ITEMS = COLUMNS.flatMap((c) => c.items);
const RENDERS = Array.from(new Set(ALL_ITEMS.map((i) => i.render)));

export interface MegaMenuProps {
  open: boolean;
  onIntent: (open: boolean) => void;
  onClose: () => void;
}

export default function MegaMenu({ open, onIntent, onClose }: MegaMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<MegaItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const everOpened = useRef(false);

  // Renders mount on the first open and the hovered item resets on close; adjusted during render, not in an effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setMounted(true);
    else setActive(null);
  }

  useGSAP(
    () => {
      registerGsap();
      const panel = ref.current;
      if (!panel) return;
      if (!open && !everOpened.current) return;
      everOpened.current = true;
      const items = panel.querySelectorAll("[data-mega-item]");
      gsap.killTweensOf([panel, items]);
      const reduce = prefersReducedMotion();

      if (open) {
        gsap.set(panel, { visibility: "visible" });
        if (reduce) {
          gsap.fromTo(panel, { opacity: 0, clipPath: "inset(0 0 0% 0)" }, { opacity: 1, duration: 0.3, ease: "none" });
          gsap.set(items, { autoAlpha: 1, y: 0 });
          return;
        }
        const tl = gsap.timeline();
        tl.fromTo(panel, { opacity: 1, clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "surreal" });
        tl.fromTo(items, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "surreal", stagger: 0.035 }, 0.15);
        return;
      }

      const hide = () => gsap.set(panel, { visibility: "hidden" });
      if (reduce) {
        gsap.to(panel, { opacity: 0, duration: 0.3, ease: "none", onComplete: hide });
        return;
      }
      gsap.to(panel, { clipPath: "inset(0 0 100% 0)", duration: 0.5, ease: "surrealInOut", onComplete: hide });
    },
    { scope: ref, dependencies: [open] },
  );

  const current = active ?? ALL_ITEMS[0];
  const activeRender = active?.render ?? DEFAULT_RENDER;

  return (
    <div
      ref={ref}
      id="shop-menu"
      className={styles.mega}
      data-theme="light"
      aria-hidden={!open}
      inert={!open}
      onPointerEnter={() => onIntent(true)}
      onPointerLeave={() => {
        setActive(null);
        onIntent(false);
      }}
    >
      <div className={styles.megaInner}>
        {COLUMNS.map((column) => (
          <div key={column.title} className={styles.column} data-mega-item>
            <h3 className={styles.columnTitle}>{column.title}</h3>
            <ul className={styles.columnList}>
              {column.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`${styles.columnLink} t-nav`}
                    data-cursor="link"
                    onPointerEnter={() => setActive(item)}
                    onFocus={() => setActive(item)}
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <Link href={current.href} className={styles.well} data-cursor="open" data-mega-item aria-label={`Shop ${current.label}`} onClick={onClose}>
          {mounted
            ? RENDERS.map((slug) => (
                <span key={slug} className={styles.wellImage} data-active={slug === activeRender ? "true" : "false"}>
                  <Image src={renderSrc(slug)} alt="" fill sizes="(min-width: 1024px) 18vw, 0px" decoding="async" />
                </span>
              ))
            : null}
          <span className={`${styles.wellCaption} t-caption`} aria-hidden>
            {current.label}
          </span>
        </Link>
      </div>
    </div>
  );
}
