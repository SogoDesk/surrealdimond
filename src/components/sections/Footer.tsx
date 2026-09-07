"use client";

/**
 * 13. Stay in the light (footer)
 *
 * The back cover on the brand navy. The chapter wrapper stays in normal flow
 * (it carries data-chapter and data-theme for the header) and clips a
 * position: fixed footer to its own box, so the trade section lifts away and
 * reveals the footer beneath it. Lenis scrolls the window natively, so fixed
 * positioning holds; the wrapper's height is kept equal to the footer's with
 * a ResizeObserver. When the footer is taller than the viewport it anchors to
 * the top instead and is released into normal flow once the wrapper's top
 * passes the top of the viewport, so every row stays reachable. Below 768px
 * and under reduced motion the footer is static.
 *
 * Rows: the newsletter (client side only, a thank-you line replaces the field
 * on submit), the link columns from src/content/site.ts plus the Visit column
 * (two accordion groups on mobile), the bottom band with the mark redrawing in
 * the preloader's choreography before it breathes with a travelling beam
 * highlight, the SURREAL wordmark rising letter by letter, and the legal row.
 *
 * The wordmark is set locally (letters in masks) instead of the Wordmark
 * component so each letter can rise from its own mask.
 */

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import LineMark from "@/components/brand/LineMark";
import { getLineMarkPaths, LINE_MARK_VIEWBOX_STRING } from "@/components/brand/lineMarkPaths";
import { WORDMARK_BYLINE, WORDMARK_TEXT } from "@/components/brand/Wordmark";
import { brand, footerColumns, legal } from "@/content/site";
import { registerGsap, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, useBreakpoint } from "@/hooks/useMedia";
import styles from "./Footer.module.css";

const DRAW_STROKE = 0.9;
const DRAW_STAGGER = 0.018;
const DRAW_LEAD = 0.06;
const BREATH_SCALE = 1.015;
const BREATH_LEG = 3.5;
const HIGHLIGHT_EVERY = 4;
const HIGHLIGHT_LENGTH = 2;

const PRIVACY = legal.find((l) => l.href === "/privacy")?.href ?? "/privacy";
const TERMS = legal.find((l) => l.href === "/terms")?.href ?? "/terms";

type Column = { title: string; links: readonly { label: string; href: string }[] };

export interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const footerRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<SVGPathElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);
  const accordionReady = useRef(false);
  const [sent, setSent] = useState(false);
  const [openGroup, setOpenGroup] = useState<number | null>(0);
  const mdUp = useBreakpoint("md");
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const emailId = `footer-email-${uid}`;
  const year = new Date().getFullYear();

  const groups: { title: string; columns: Column[] }[] = [
    { title: footerColumns[0].title, columns: [footerColumns[0]] },
    { title: "Everything else", columns: footerColumns.slice(1) },
  ];

  /* ----- back cover, reveals, mark choreography ----- */
  useGSAP(
    (_context, contextSafe) => {
      registerGsap();
      const footer = footerRef.current;
      const wrap = footer?.parentElement;
      const mark = markRef.current;
      const beam = beamRef.current;
      const wordmark = wordmarkRef.current;
      if (!footer || !wrap || !mark || !beam || !wordmark) return;
      const reduced = prefersReducedMotion();
      const fixedMode = mdUp && !reduced;
      wrap.dataset.mode = fixedMode ? "fixed" : "static";

      const cleanups: (() => void)[] = [];

      /* Keep the in-flow wrapper as tall as the fixed footer, and release the footer when it is taller than the viewport. */
      if (fixedMode) {
        const measure = () => {
          const h = footer.offsetHeight;
          wrap.style.setProperty("--footer-h", `${h}px`);
          wrap.style.setProperty("--footer-top", `${Math.max(0, window.innerHeight - h)}px`);
        };
        measure();
        const ro = new ResizeObserver(() => {
          measure();
          ScrollTrigger.refresh();
        });
        ro.observe(footer);
        window.addEventListener("resize", measure);
        let released = false;
        const check = () => {
          const next = wrap.getBoundingClientRect().top < 0;
          if (next === released) return;
          released = next;
          wrap.dataset.released = next ? "true" : "false";
        };
        const watcher = ScrollTrigger.create({ start: 0, end: "max", onUpdate: check, onRefresh: check });
        check();
        cleanups.push(() => {
          ro.disconnect();
          window.removeEventListener("resize", measure);
          watcher.kill();
          wrap.style.removeProperty("--footer-h");
          wrap.style.removeProperty("--footer-top");
          delete wrap.dataset.released;
        });
      }

      /* Fit the wordmark to the width beside the mark. */
      const wordText = wordmark.querySelector<HTMLElement>("[data-wordmark-text]");
      const wordCol = wordmark.parentElement;
      if (wordText && wordCol) {
        const fit = () => {
          wordmark.style.fontSize = "";
          const available = wordCol.clientWidth;
          const width = wordText.scrollWidth;
          if (width > available && available > 0) {
            const size = parseFloat(getComputedStyle(wordmark).fontSize);
            wordmark.style.fontSize = `${Math.floor(size * (available / width))}px`;
          }
        };
        fit();
        const fitObserver = new ResizeObserver(fit);
        fitObserver.observe(wordCol);
        document.fonts?.ready.then(fit);
        cleanups.push(() => fitObserver.disconnect());
      }

      const dispose = () => cleanups.forEach((fn) => fn());
      if (reduced) {
        /* Reduced motion: the rows fade in over 0.3s in place of every reveal. */
        const rows = Array.from(footer.querySelectorAll<HTMLElement>("[data-news], [data-col], [data-band], [data-legal]"));
        gsap.fromTo(
          rows,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.3, ease: "none", scrollTrigger: { trigger: wrap, start: "top 85%", once: true } },
        );
        return dispose;
      }

      /* Reveal triggers: on the fixed footer a row is only visible once the seam (the wrapper's top) passes it. */
      const seamStart = (el: HTMLElement, frac: number) => () => {
        const vh = window.innerHeight;
        const h = footer.offsetHeight;
        const y = el.getBoundingClientRect().top - footer.getBoundingClientRect().top + el.offsetHeight * frac;
        return `top ${y < vh ? Math.max(0, vh - h) + y : vh - y}px`;
      };
      const trigger = (el: HTMLElement, frac = 0.5): ScrollTrigger.Vars =>
        fixedMode
          ? { trigger: wrap, start: seamStart(el, frac), once: true, invalidateOnRefresh: true }
          : { trigger: el, start: "top 88%", once: true };

      /* The mark: preloader choreography, then breathing and the travelling beam. */
      const svg = mark.querySelector<SVGSVGElement>("svg[data-line-mark]");
      const skyPaths = svg ? Array.from(svg.querySelectorAll<SVGPathElement>('[data-layer="ink"] path')) : [];
      const linePaths = svg ? Array.from(svg.querySelectorAll<SVGPathElement>('[data-layer="sky"] path')) : [];
      const curves = getLineMarkPaths(skyPaths.length || undefined);
      let strand = 0;
      const nextStrand = () => {
        const c = curves[strand % curves.length];
        beam.setAttribute("d", c.d);
        beam.setAttribute("stroke-width", String(c.width * 1.6));
        strand++;
      };
      const safe = contextSafe ?? (<T extends (...args: never[]) => unknown>(fn: T) => fn);
      const startLoops = safe(() => {
        gsap.to(mark, {
          scale: BREATH_SCALE,
          duration: BREATH_LEG,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "0% 100%",
        });
        nextStrand();
        gsap
          .timeline({ repeat: -1, repeatDelay: HIGHLIGHT_EVERY - HIGHLIGHT_LENGTH, onRepeat: nextStrand })
          .fromTo(beam, { drawSVG: "0% 0%", autoAlpha: 0 }, { drawSVG: "0% 14%", autoAlpha: 1, duration: 0.4, ease: "power1.in" })
          .to(beam, { drawSVG: "86% 100%", duration: 1.2, ease: "power1.inOut" })
          .to(beam, { drawSVG: "100% 100%", autoAlpha: 0, duration: 0.4, ease: "power1.out" });
      });
      if (skyPaths.length) {
        gsap.set([...skyPaths, ...linePaths], { drawSVG: "0%" });
        const draw = gsap.timeline({ scrollTrigger: trigger(mark, 0.3), onComplete: startLoops });
        skyPaths.forEach((p, i) => draw.to(p, { drawSVG: "100%", duration: DRAW_STROKE, ease: "power2.out" }, i * DRAW_STAGGER));
        linePaths.forEach((p, i) =>
          draw.to(p, { drawSVG: "100%", duration: DRAW_STROKE, ease: "power2.out" }, i * DRAW_STAGGER + DRAW_LEAD),
        );
      }

      /* Wordmark letters rise from their masks; the byline follows. */
      const letters = Array.from(wordmark.querySelectorAll<HTMLElement>("[data-letter]"));
      const byline = wordmark.parentElement?.querySelector<HTMLElement>("[data-byline]") ?? null;
      if (letters.length) {
        gsap.set(letters, { yPercent: 100 });
        if (byline) gsap.set(byline, { autoAlpha: 0 });
        const rise = gsap.timeline({ scrollTrigger: trigger(wordmark, 0.4) });
        rise.to(letters, { yPercent: 0, duration: 1.4, ease: "surreal", stagger: 0.04 });
        if (byline) rise.to(byline, { autoAlpha: 1, duration: 0.8, ease: "surreal" }, 0.9);
      }

      /* Rows fade up: link columns with a 0.08s stagger, the newsletter and the legal row. */
      const columns = Array.from(footer.querySelectorAll<HTMLElement>("[data-col]"));
      if (columns.length) {
        gsap.set(columns, { autoAlpha: 0, y: 24 });
        gsap.to(columns, { autoAlpha: 1, y: 0, duration: 1.2, ease: "surreal", stagger: 0.08, scrollTrigger: trigger(columns[0], 0.3) });
      }
      const news = footer.querySelector<HTMLElement>("[data-news]");
      if (news) {
        const items = Array.from(news.querySelectorAll<HTMLElement>("[data-news-item]"));
        gsap.set(items, { autoAlpha: 0, y: 24 });
        gsap.to(items, { autoAlpha: 1, y: 0, duration: 1.2, ease: "surreal", stagger: 0.08, scrollTrigger: trigger(news, 0.3) });
      }
      const legalRow = footer.querySelector<HTMLElement>("[data-legal]");
      if (legalRow) {
        gsap.set(legalRow, { autoAlpha: 0 });
        gsap.to(legalRow, { autoAlpha: 1, duration: 0.9, ease: "surreal", scrollTrigger: trigger(legalRow, 0.5) });
      }

      return dispose;
    },
    { scope: footerRef, dependencies: [mdUp], revertOnUpdate: true },
  );

  /* ----- mobile accordion ----- */
  useGSAP(
    () => {
      registerGsap();
      const footer = footerRef.current;
      if (!footer) return;
      const panels = Array.from(footer.querySelectorAll<HTMLElement>("[data-panel]"));
      /* The first pass in the mobile layout sets the heights without a tween; later toggles animate. */
      const instant = !accordionReady.current || prefersReducedMotion();
      panels.forEach((panel, i) => {
        const open = mdUp || openGroup === i;
        panel.toggleAttribute("inert", !open);
        if (mdUp) {
          gsap.set(panel, { clearProps: "height" });
          return;
        }
        gsap.to(panel, { height: open ? "auto" : 0, duration: instant ? 0 : 0.3, ease: "surrealInOut", overwrite: true });
      });
      accordionReady.current = !mdUp;
    },
    { scope: footerRef, dependencies: [openGroup, mdUp] },
  );

  /* ----- newsletter ----- */
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector<HTMLInputElement>("input[type='email']");
    if (!input) return;
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }
    const line = underlineRef.current;
    if (!line || prefersReducedMotion()) {
      setSent(true);
      return;
    }
    registerGsap();
    line.dataset.drawing = "true";
    gsap.fromTo(line, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.6, ease: "surreal", onComplete: () => setSent(true) });
  };

  const backToTop = () => {
    registerGsap();
    const lenis = window.__lenis;
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.8, easing: gsap.parseEase("surreal") as (t: number) => number });
      return;
    }
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const renderColumn = (col: Column) => (
    <div key={col.title} className={styles.col} data-col>
      <h3 className={styles.colTitle}>{col.title}</h3>
      <ul className={styles.list}>
        {col.links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className={`t-nav ${styles.link}`} data-cursor="link">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <Section id="footer" theme="navy" as="div" className={`${styles.wrap} ${className}`}>
      <footer ref={footerRef} className={styles.footer}>
        {/* Newsletter */}
        <div className={styles.news} data-news>
          <div className={styles.newsCopy}>
            <div className={styles.eyebrow} data-news-item>
              <Eyebrow>Newsletter</Eyebrow>
            </div>
            <h2 className={styles.newsTitle} data-news-item>
              Stay in the light.
            </h2>
            <p className={`t-body ${styles.newsBody}`} data-news-item>
              New pieces, made to order releases and the occasional lesson in diamonds. Nothing else.
            </p>
          </div>
          <div className={styles.newsForm} data-news-item>
            {sent ? (
              <p className={styles.thanks} role="status">
                Thank you. You are on the list.
              </p>
            ) : (
              <form className={styles.form} onSubmit={onSubmit} noValidate>
                <div className={styles.field}>
                  <input
                    id={emailId}
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder=" "
                    className={styles.input}
                  />
                  <label htmlFor={emailId} className={styles.label}>
                    Email address
                  </label>
                  <span ref={underlineRef} className={styles.underline} aria-hidden />
                </div>
                <Button type="submit" variant="secondary" arrow className={styles.submit}>
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Link columns */}
        <div className={styles.columns}>
          {groups.map((group, i) => {
            const open = openGroup === i;
            const panelId = `footer-group-${uid}-${i}`;
            return (
              <div key={group.title} className={styles.group}>
                <button
                  type="button"
                  className={`${styles.groupToggle} t-nav`}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenGroup(open ? null : i)}
                  data-cursor="open"
                >
                  <span>{group.title}</span>
                  <span className={styles.groupGlyph} aria-hidden />
                </button>
                <div id={panelId} className={styles.panel} data-panel>
                  <div className={styles.panelInner}>
                    {group.columns.map(renderColumn)}
                    {i === groups.length - 1 && (
                      <div className={styles.col} data-col>
                        <h3 className={styles.colTitle}>Visit</h3>
                        <address className={`${styles.address} tabular`}>
                          <a href={brand.office.mapHref} target="_blank" rel="noreferrer" className={styles.addressLink} data-cursor="link">
                            {brand.office.address1}
                            <br />
                            {brand.office.address2}
                          </a>
                          <a href={brand.office.phoneHref} className={styles.addressLink} data-cursor="link">
                            {brand.office.phone}
                          </a>
                          <span>{brand.office.hours}</span>
                        </address>
                        <a
                          href={brand.social.instagram}
                          target="_blank"
                          rel="noreferrer"
                          className={`t-nav ${styles.link} ${styles.instagram}`}
                          data-cursor="link"
                        >
                          Instagram
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom band: the mark and the wordmark */}
        <div className={styles.band} data-band>
          <div ref={markRef} className={styles.markWrap} aria-hidden>
            <LineMark navy="var(--mark-a)" sky="var(--mark-b)" strokeScale={1.4} className={styles.markSvg} />
            <svg className={styles.beamSvg} viewBox={LINE_MARK_VIEWBOX_STRING} focusable="false" aria-hidden>
              <path ref={beamRef} className={styles.beam} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className={styles.wordCol}>
            <div ref={wordmarkRef} className={styles.wordmark} role="img" aria-label={`${brand.wordmark}, ${brand.byline}`}>
              <span className={styles.wordText} data-wordmark-text aria-hidden>
                {WORDMARK_TEXT.split("").map((ch, i) => (
                  <span key={i} className={styles.letterMask}>
                    <span className={styles.letter} data-letter>
                      {ch}
                    </span>
                  </span>
                ))}
                <span className={styles.tmMask}>
                  <span className={styles.tm} data-letter>
                    TM
                  </span>
                </span>
              </span>
            </div>
            <p className={styles.byline} data-byline aria-hidden>
              {WORDMARK_BYLINE}
            </p>
          </div>
        </div>

        {/* Legal */}
        <div className={styles.legal} data-legal>
          <div className="hairline" />
          <div className={styles.legalRow}>
            <p className={`t-caption ${styles.copyright}`}>
              &copy; {year} {brand.name}
            </p>
            <div className={styles.legalLinks}>
              <Link href={PRIVACY} className={`t-caption ${styles.link}`} data-cursor="link">
                Privacy
              </Link>
              <Link href={TERMS} className={`t-caption ${styles.link}`} data-cursor="link">
                Terms
              </Link>
              <button type="button" onClick={backToTop} className={`t-caption ${styles.link} ${styles.top}`} data-cursor="link">
                Back to top
                <svg aria-hidden viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M12 19V5M6 11l6-6 6 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </Section>
  );
}
