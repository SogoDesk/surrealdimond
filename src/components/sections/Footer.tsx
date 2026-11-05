"use client";

/**
 * 13. The footer on the brand navy (client change request, November 2026:
 * simplified, then the logo and company name brought back in a more modern
 * layout). The brand block leads: the line mark with the SURREAL wordmark
 * and its byline, The New Forever, the New York office and Instagram. The
 * link columns from src/content/site.ts sit beside it, then the legal row.
 * Nothing animates in; the footer sits in the page's normal flow.
 */

import Link from "next/link";
import LineMark from "@/components/brand/LineMark";
import Wordmark from "@/components/brand/Wordmark";
import { LINE_MARK_ASPECT } from "@/components/brand/lineMarkPaths";
import Section from "@/components/ui/Section";
import { brand, footerColumns, legal } from "@/content/site";
import { prefersReducedMotion } from "@/hooks/useMedia";
import { useDealer } from "@/lib/dealer";
import styles from "./Footer.module.css";

const PRIVACY = legal.find((l) => l.href === "/privacy")?.href ?? "/privacy";
const TERMS = legal.find((l) => l.href === "/terms")?.href ?? "/terms";
const MARK = 58;

export interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const dealer = useDealer();
  const year = new Date().getFullYear();

  const backToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <Section id="footer" theme="navy" as="div" className={`${styles.wrap} ${className}`}>
      <footer className={styles.footer}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo} aria-label={`${brand.name}, home`}>
              <LineMark navy="var(--porcelain)" sky="var(--sky)" alternating strokeCount={12} strokeScale={6} style={{ height: MARK, width: MARK * LINE_MARK_ASPECT }} />
              <Wordmark size={34} withByline withTm className={styles.wordmark} />
            </Link>
            <p className={styles.line}>
              {brand.positioning}. Lab grown diamonds and handcrafted jewelry, trade only.
            </p>

            <address className={`${styles.visit} tabular`}>
              <a href={brand.office.mapHref} target="_blank" rel="noreferrer" className={styles.visitLink}>
                {brand.office.address1}, {brand.office.address2}
              </a>
              <a href={brand.office.phoneHref} className={styles.visitLink}>
                {brand.office.phone}
              </a>
              <span>{brand.office.hours}</span>
            </address>

            <a href={brand.social.instagram} target="_blank" rel="noreferrer" className={styles.social} aria-label="Surreal on Instagram">
              <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </div>

          <nav className={styles.columns} aria-label="Footer">
            {footerColumns.map((col) => (
              <div key={col.title} className={styles.col}>
                <h3 className={styles.colTitle}>{col.title}</h3>
                <ul className={styles.list}>
                  {/* A signed-in dealer is already a retailer: Become a Retailer gives way to the Retailer Dashboard beside it. */}
                  {col.links
                    .filter((l) => !(dealer && l.href.startsWith("/contact?type=dealer")))
                    .map((l) => (
                      <li key={l.href + l.label}>
                        <Link href={l.href} className={styles.link}>
                          {l.label}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.legal}>
          <p className={styles.copyright}>
            &copy; {year} {brand.name}. All rights reserved.
          </p>
          <div className={styles.legalLinks}>
            <Link href={PRIVACY} className={styles.link}>
              Privacy
            </Link>
            <Link href={TERMS} className={styles.link}>
              Terms
            </Link>
            <button type="button" onClick={backToTop} className={styles.toTop} aria-label="Back to top">
              <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </Section>
  );
}
