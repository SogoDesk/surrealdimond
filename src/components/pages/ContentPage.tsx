import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import Eyebrow from "@/components/ui/Eyebrow";
import g from "./GatePage.module.css";
import s from "./ContentPage.module.css";

/**
 * Short content pages (About, Legacy; BRD R-20): the holding page's opening
 * (breadcrumb, eyebrow, title, lead, doors, one photograph) followed by a few
 * plain bands passed as children. The bands use the Band, Facts and Steps
 * pieces below so every content page reads the same. Copy comes from the
 * verified facts in src/content/site.ts; the console's Content pages module
 * takes the text over later.
 */
export default function ContentPage({
  eyebrow,
  title,
  line,
  crumbs,
  image,
  imageAlt,
  doors,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  line: string;
  crumbs: { label: string; href?: string }[];
  image: string;
  imageAlt: string;
  doors?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <section className={g.section}>
          <div className={g.wrap}>
            <nav aria-label="Breadcrumb" className={g.crumbs}>
              <Link href="/">Home</Link>
              {crumbs.map((c) => (
                <span key={c.label} className={g.crumb}>
                  <span aria-hidden>/</span>
                  {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
                </span>
              ))}
            </nav>
            <div className={g.grid}>
              <div className={g.copy}>
                <Eyebrow>{eyebrow}</Eyebrow>
                <h1 className={g.title}>{title}</h1>
                <p className={g.line}>{line}</p>
                {doors && <div className={g.doors}>{doors}</div>}
              </div>
              <div className={g.visual}>
                <Image src={image} alt={imageAlt} fill priority sizes="(min-width: 900px) 44vw, 100vw" className={g.image} />
              </div>
            </div>
          </div>
        </section>
        {children}
        <Footer />
      </main>
    </>
  );
}

/** A plain band: eyebrow and title on the left, content on the right. */
export function Band({ id, eyebrow, title, tone = "paper", children }: { id?: string; eyebrow: string; title: ReactNode; tone?: "paper" | "mist"; children: ReactNode }) {
  return (
    <section id={id} className={s.band} data-tone={tone}>
      <div className={`${g.wrap} ${s.bandGrid}`}>
        <div className={s.bandHead}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className={s.bandTitle}>{title}</h2>
        </div>
        <div className={s.bandBody}>{children}</div>
      </div>
    </section>
  );
}

/** Figures or short facts in a ruled grid. */
export function Facts({ items }: { items: { figure: string; label: string }[] }) {
  return (
    <ul className={s.facts}>
      {items.map((f) => (
        <li key={f.label}>
          <span className={s.factFigure}>{f.figure}</span>
          <span className={s.factLabel}>{f.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** Numbered steps. */
export function Steps({ items }: { items: { title: string; line: string }[] }) {
  return (
    <ol className={s.steps}>
      {items.map((st, i) => (
        <li key={st.title}>
          <span className={`t-index ${s.stepIndex}`}>{String(i + 1).padStart(2, "0")}</span>
          <span className={s.stepTitle}>{st.title}</span>
          <span className={s.stepLine}>{st.line}</span>
        </li>
      ))}
    </ol>
  );
}
