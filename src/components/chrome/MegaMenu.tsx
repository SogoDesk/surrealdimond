"use client";

/**
 * The Jewelry panel, on the Tanishq pattern (docs/CONTEXT.md, "UX
 * reference"). A paper sheet below the header that reveals with clip-path
 * from the top edge. Left: a rail of three groups (Jewelry, Collections,
 * Programs and ordering); hovering or focusing a group swaps the centre. The
 * centre holds the group's links as round thumbnails (renders on white for
 * types, drawn motifs for collections and programs) above a promo strip; the
 * right holds an editorial photograph that changes with the group. The
 * header owns the open state and the 150ms hover intent; this panel reports
 * pointer enter and leave back through onIntent.
 */

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import DivisionMotif from "@/components/brand/DivisionMotif";
import { divisions, type Division } from "@/content/divisions";
import { account } from "@/content/site";
import { renderSrc } from "@/content/catalog";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import styles from "./chrome.module.css";

type GroupId = "types" | "collections" | "programs";

interface Extra {
  label: string;
  href: string;
}

interface Group {
  id: GroupId;
  label: string;
  items: Division[];
  extras: Extra[];
  promo: { title: string; line: string; href: string; cta: string };
  editorial: { src: string; caption: string; href: string };
}

const GROUPS: Group[] = [
  {
    id: "types",
    label: "Jewelry",
    items: divisions.filter((d) => d.group === "types"),
    extras: [],
    promo: { title: "The full catalog", line: "Every piece, with your dealer pricing once you log in.", href: "/jewelry", cta: "View all" },
    editorial: { src: "/media/photos/sb-3605-sm.webp", caption: "Engagement, bands and everyday pieces", href: "/jewelry/engagement" },
  },
  {
    id: "collections",
    label: "Collections",
    items: divisions.filter((d) => d.group === "collections"),
    extras: [],
    promo: { title: "Five collections", line: "Constellation, Enamour Enamel, Laser Pierced, Vermeil and Sterling Silver.", href: "/jewelry", cta: "Browse" },
    editorial: { src: "/media/photos/sb-3636-sm.webp", caption: "Pendants and fine chains", href: "/jewelry/pendants" },
  },
  {
    id: "programs",
    label: "Programs and ordering",
    items: divisions.filter((d) => d.group === "programs"),
    extras: [
      { label: "Jewelry Order Form", href: "/jewelry/order-form" },
      { label: "Made to Order Diamonds", href: "/diamonds/made-to-order" },
      { label: "Diamond Legacy", href: "/legacy" },
      { label: "Lab Diamond Search", href: "/diamonds" },
    ],
    promo: { title: "Order in bulk", line: "Key style numbers straight into the jewelry order form.", href: "/jewelry/order-form", cta: "Open the form" },
    editorial: { src: "/media/photos/sb-3990-sm.webp", caption: "Made to Order, grown to your specification", href: "/diamonds/made-to-order" },
  },
];

export interface MegaMenuProps {
  open: boolean;
  onIntent: (open: boolean) => void;
  onClose: () => void;
}

function Thumb({ item }: { item: Division }) {
  if (item.image) {
    return (
      <span className={styles.thumb}>
        <Image src={renderSrc(item.image)} alt="" width={96} height={96} sizes="48px" />
      </span>
    );
  }
  return <span className={styles.thumb}>{item.motif && <DivisionMotif motif={item.motif} className={styles.thumbMotif} />}</span>;
}

export default function MegaMenu({ open, onIntent, onClose }: MegaMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const everOpened = useRef(false);
  const [groupId, setGroupId] = useState<GroupId>("types");

  // The rail returns to Jewelry each time the panel closes; adjusted during render, not in an effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setGroupId("types");
  }

  const group = GROUPS.find((g) => g.id === groupId) ?? GROUPS[0];

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
        tl.fromTo(panel, { opacity: 1, clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.6, ease: "surreal" });
        tl.fromTo(items, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "surreal", stagger: 0.03 }, 0.12);
        return;
      }

      const hide = () => gsap.set(panel, { visibility: "hidden" });
      if (reduce) {
        gsap.to(panel, { opacity: 0, duration: 0.3, ease: "none", onComplete: hide });
        return;
      }
      gsap.to(panel, { clipPath: "inset(0 0 100% 0)", duration: 0.45, ease: "surrealInOut", onComplete: hide });
    },
    { scope: ref, dependencies: [open] },
  );

  return (
    <div
      ref={ref}
      id="shop-menu"
      className={styles.mega}
      data-theme="light"
      aria-hidden={!open}
      inert={!open}
      onPointerEnter={() => onIntent(true)}
      onPointerLeave={() => onIntent(false)}
    >
      <div className={styles.megaInner}>
        <ul className={styles.megaRail} role="tablist" aria-label="Jewelry groups" data-mega-item>
          {GROUPS.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                role="tab"
                aria-selected={g.id === groupId}
                className={styles.megaRailItem}
                onPointerEnter={() => setGroupId(g.id)}
                onFocus={() => setGroupId(g.id)}
                onClick={() => setGroupId(g.id)}
              >
                {g.label}
                <span aria-hidden className={styles.megaRailCount}>
                  {g.items.length + g.extras.length}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.megaCenter} role="tabpanel" aria-label={group.label}>
          <ul key={group.id} className={styles.megaGrid}>
            {group.items.map((item) => (
              <li key={item.id} data-mega-item>
                <Link href={item.href} className={styles.megaLink} onClick={onClose}>
                  <Thumb item={item} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
            {group.extras.map((item) => (
              <li key={item.href} data-mega-item>
                <Link href={item.href} className={styles.megaLink} onClick={onClose}>
                  <span className={`${styles.thumb} ${styles.thumbPlain}`} aria-hidden>
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8h9M9 5l3 3-3 3" />
                    </svg>
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className={styles.megaPromo} data-mega-item>
            <span className={styles.megaPromoStack} aria-hidden>
              {["le2004w442-11741", "nkov18w440wg", "in-and-out-hoops-yg"].map((slug) => (
                <span key={slug} className={styles.megaPromoThumb}>
                  <Image src={renderSrc(slug)} alt="" width={96} height={96} sizes="44px" />
                </span>
              ))}
            </span>
            <span className={styles.megaPromoText}>
              <span className={styles.megaPromoTitle}>{group.promo.title}</span>
              <span className={styles.megaPromoLine}>{group.promo.line}</span>
            </span>
            <Link href={group.promo.href} className={`${styles.megaPromoCta} t-nav`} onClick={onClose}>
              {group.promo.cta}
            </Link>
          </div>
        </div>

        <Link href={group.editorial.href} className={styles.megaCard} data-mega-item onClick={onClose}>
          <span className={styles.megaCardImage}>
            {GROUPS.map((g) => (
              <Image
                key={g.id}
                src={g.editorial.src}
                alt=""
                fill
                sizes="280px"
                className={styles.megaCardLayer}
                data-active={g.id === groupId ? "true" : undefined}
              />
            ))}
          </span>
          <span className={styles.megaCardCaption}>{group.editorial.caption}</span>
          <span className={`${styles.megaCardCta} t-nav`}>
            Explore
            <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12 12 4M6 4h6v6" />
            </svg>
          </span>
        </Link>
      </div>
      <p className={styles.megaFoot} data-mega-item>
        Prices and ordering are for Surreal dealers.{" "}
        <Link href={account.login} onClick={onClose}>
          Log in
        </Link>{" "}
        or{" "}
        <Link href={account.apply} onClick={onClose}>
          apply for an account
        </Link>
        .
      </p>
    </div>
  );
}
