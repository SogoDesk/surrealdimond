"use client";

/**
 * 13. The footer, simplified (client change request, November 2026): on
 * the brand navy, the link columns from src/content/site.ts with the Visit
 * column beside them, then the legal row. The newsletter, the animated mark
 * and wordmark band and the back-cover reveal are gone; the footer sits in
 * the page's normal flow.
 */

import Link from "next/link";
import Section from "@/components/ui/Section";
import { brand, footerColumns, legal } from "@/content/site";
import { prefersReducedMotion } from "@/hooks/useMedia";
import { useDealer } from "@/lib/dealer";
import styles from "./Footer.module.css";

const PRIVACY = legal.find((l) => l.href === "/privacy")?.href ?? "/privacy";
const TERMS = legal.find((l) => l.href === "/terms")?.href ?? "/terms";

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
        <div className={styles.columns}>
          {footerColumns.map((col) => (
            <div key={col.title} className={styles.col}>
              <h3 className={styles.colTitle}>{col.title}</h3>
              <ul className={styles.list}>
                {/* A signed-in dealer is already a retailer: Become a Retailer gives way to the Retailer Dashboard beside it. */}
                {col.links
                  .filter((l) => !(dealer && l.href.startsWith("/contact?type=dealer")))
                  .map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className={`t-nav ${styles.link}`}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Visit</h3>
            <address className={`${styles.address} tabular`}>
              <a href={brand.office.mapHref} target="_blank" rel="noreferrer" className={styles.addressLink}>
                {brand.office.address1}
                <br />
                {brand.office.address2}
              </a>
              <a href={brand.office.phoneHref} className={styles.addressLink}>
                {brand.office.phone}
              </a>
              <span>{brand.office.hours}</span>
            </address>
            <a href={brand.social.instagram} target="_blank" rel="noreferrer" className={`t-nav ${styles.link}`}>
              Instagram
            </a>
          </div>
        </div>

        <div className={styles.legal}>
          <p className={`t-caption ${styles.copyright}`}>
            &copy; {year} {brand.name}
          </p>
          <div className={styles.legalLinks}>
            <Link href={PRIVACY} className={`t-caption ${styles.link}`}>
              Privacy
            </Link>
            <Link href={TERMS} className={`t-caption ${styles.link}`}>
              Terms
            </Link>
            <button type="button" onClick={backToTop} className={`t-caption ${styles.link} ${styles.top}`}>
              Back to top
              <svg aria-hidden viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </Section>
  );
}
