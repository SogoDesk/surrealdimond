"use client";

/**
 * The header search (F-B5): a combobox over the real catalog, the stone feed
 * and the site's pages (src/lib/siteSearch.ts). Suggestions drop down as the
 * visitor types, in groups: diamonds (the stones matching the filters read
 * from the query, and any stock ID or certificate), jewelry (with the
 * render), pages; then See all results. Arrow keys move, Enter opens the
 * highlighted suggestion or the results page, Escape closes. Empty and
 * focused, it offers popular searches. The rotating prompt stays while the
 * field is empty.
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fragment, useDeferredValue, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import ShapeIcon from "@/components/brand/ShapeIcon";
import { categoryLabel, productHref, renderSrc, styleRef } from "@/content/catalog";
import { stoneGrade, stoneTitle } from "@/content/diamonds";
import { groundStyle } from "@/content/grounds";
import { account } from "@/content/site";
import { prefersReducedMotion } from "@/hooks/useMedia";
import { useUnavailable } from "@/lib/memo";
import { POPULAR, searchSite } from "@/lib/siteSearch";
import styles from "./chrome.module.css";

const PROMPTS = ["engagement rings", "oval diamonds", "1-2ct oval DEF", "a style number", "tennis bracelets", "a stock ID"];

interface Option {
  id: string;
  group: "Diamonds" | "Jewelry" | "Pages" | "Popular searches" | "";
  label: string;
  meta: string;
  href: string;
  image?: { src: string; ground: CSSProperties };
  shape?: Parameters<typeof ShapeIcon>[0]["shape"];
}

const resultsHref = (q: string) => (q ? `${account.search}?q=${encodeURIComponent(q)}` : account.search);

export default function SiteSearch() {
  const router = useRouter();
  const gone = useUnavailable();
  const uid = useId();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [prompt, setPrompt] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const deferred = useDeferredValue(value);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setPrompt((p) => (p + 1) % PROMPTS.length), 2800);
    return () => window.clearInterval(id);
  }, []);

  const options = useMemo<Option[]>(() => {
    const q = deferred.trim();
    if (q.length < 2)
      return POPULAR.map((p) => ({
        id: `pop-${p}`,
        group: "Popular searches",
        label: p,
        meta: "",
        href: resultsHref(p),
      }));
    const r = searchSite(q, { gone, productLimit: 4, stoneLimit: 0 });
    const out: Option[] = [];
    r.exact.slice(0, 3).forEach((st) =>
      out.push({
        id: `st-${st.id}`,
        group: "Diamonds",
        label: `${st.id} · ${stoneTitle(st)}`,
        meta: `${stoneGrade(st)}, ${st.lab} ${st.certificate}`,
        href: `/diamonds?stone=${st.id}`,
        shape: st.shape,
      }),
    );
    if (r.stoneFilter && r.stoneTotal > 0)
      out.push({
        id: "stones",
        group: "Diamonds",
        label: `${r.stoneTotal} ${r.stoneTotal === 1 ? "stone" : "stones"}: ${r.stoneLabel}`,
        meta: "Open in Diamond Search",
        href: r.stoneHref,
        shape: r.stoneFilter.shapes?.[0] ?? "round",
      });
    else if (r.stoneFilter)
      out.push({
        id: "stones-none",
        group: "Diamonds",
        label: `No stones in stock: ${r.stoneLabel}`,
        meta: "Grow it to order",
        href: "/diamonds/made-to-order",
        shape: r.stoneFilter.shapes?.[0] ?? "round",
      });
    r.products.forEach((p) =>
      out.push({
        id: `p-${p.id}`,
        group: "Jewelry",
        label: p.name,
        meta: [categoryLabel(p.category), styleRef(p)].filter(Boolean).join(" · "),
        href: productHref(p),
        image: { src: renderSrc(p.image), ground: groundStyle(p.category) },
      }),
    );
    r.pages.slice(0, 3).forEach((pg) =>
      out.push({
        id: `pg-${pg.href}`,
        group: "Pages",
        label: pg.label,
        meta: pg.line,
        href: pg.href,
      }),
    );
    out.push({
      id: "all",
      group: "",
      label: out.length ? `See all results for “${q}”` : `Search for “${q}”`,
      meta: out.length ? "" : "Nothing suggested yet; the results page looks wider",
      href: resultsHref(q),
    });
    return out;
  }, [deferred, gone]);

  const show = open && focused;
  const go = (href: string) => {
    setOpen(false);
    setActive(-1);
    (document.activeElement as HTMLElement | null)?.blur();
    router.push(href);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (active >= 0 && options[active]) return go(options[active].href);
    go(resultsHref(value.trim()));
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={styles.searchWrap}
      onFocus={() => {
        setFocused(true);
        setOpen(true);
      }}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
          setActive(-1);
        }
      }}
    >
      <form role="search" className={styles.search} onSubmit={submit} data-focused={focused ? "true" : undefined}>
        <svg aria-hidden viewBox="0 0 16 16" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
          <circle cx="6.75" cy="6.75" r="5.25" />
          <path d="M10.6 10.6 15 15" />
        </svg>
        <label htmlFor="site-search" className={styles.srOnly}>
          Search jewelry, diamonds and pages
        </label>
        <input
          id="site-search"
          type="search"
          name="q"
          role="combobox"
          aria-expanded={show}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-activedescendant={show && active >= 0 ? `${uid}-o${active}` : undefined}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onKeyDown={onKey}
          autoComplete="off"
          className={styles.searchInput}
        />
        {value.length === 0 && (
          <span className={styles.searchPrompt} aria-hidden>
            <span>Search for&nbsp;</span>
            <span className={styles.promptWindow}>
              <span key={prompt} className={styles.promptWord}>
                {PROMPTS[prompt]}
              </span>
            </span>
          </span>
        )}
        <button type="submit" className={styles.searchSubmit} aria-label="Search">
          <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 8h11M9 4l4 4-4 4" />
          </svg>
        </button>
      </form>

      {show && (
        <ul id={`${uid}-list`} role="listbox" aria-label="Suggestions" className={styles.suggest}>
          {options.map((o, i) => {
            const head = o.group && (i === 0 || options[i - 1].group !== o.group) ? o.group : null;
            const popular = o.group === "Popular searches";
            return (
              <Fragment key={o.id}>
                {head && (
                  <li role="presentation" className={styles.suggestGroup}>
                    {head}
                  </li>
                )}
                <li role="presentation" className={popular ? styles.suggestChipItem : undefined}>
                  <a
                    id={`${uid}-o${i}`}
                    role="option"
                    aria-selected={i === active}
                    href={o.href}
                    tabIndex={-1}
                    className={popular ? styles.suggestChip : o.id === "all" ? styles.suggestAll : styles.suggestItem}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                      e.preventDefault();
                      go(o.href);
                    }}
                    onMouseEnter={() => setActive(i)}
                  >
                    {o.image ? (
                      <span className={styles.suggestThumb} style={o.image.ground}>
                        <Image src={o.image.src} alt="" width={80} height={80} sizes="40px" />
                      </span>
                    ) : o.shape ? (
                      <span className={styles.suggestThumb} aria-hidden>
                        <ShapeIcon shape={o.shape} className={styles.suggestShape} />
                      </span>
                    ) : null}
                    <span className={styles.suggestText}>
                      <strong>{o.label}</strong>
                      {o.meta && <span>{o.meta}</span>}
                    </span>
                  </a>
                </li>
              </Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}
