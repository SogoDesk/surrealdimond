import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import Eyebrow from "@/components/ui/Eyebrow";
import DivisionMotif from "@/components/brand/DivisionMotif";
import type { DivisionMotif as Motif } from "@/content/divisions";
import GateDoors from "./GateDoors";
import s from "./GatePage.module.css";

/**
 * Holding page for routes whose full build is still ahead (docs/TASKS.md).
 * "dealer" pages mirror the live site: pricing and ordering sit behind the
 * dealer login, so the page offers Log in and Become a dealer. "building"
 * pages are public pages in design and point back to what already exists.
 */
export interface GatePageProps {
  kind: "dealer" | "building";
  eyebrow: string;
  title: ReactNode;
  line: string;
  crumbs: { label: string; href?: string }[];
  image?: string;
  motif?: Motif;
  benefits?: string[];
}

const DEALER_POINTS = [
  "Globally competitive direct-from-the-grower pricing",
  "Comprehensive brand strategy",
  "Digital marketing support positioning you as a grower",
  "Territory exclusivity",
];
export default function GatePage({ kind, eyebrow, title, line, crumbs, image = "/media/photos/sb-3990.webp", motif, benefits = DEALER_POINTS }: GatePageProps) {
  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <section className={s.section}>
          <div className={s.wrap}>
            <nav aria-label="Breadcrumb" className={s.crumbs}>
              <Link href="/">Home</Link>
              {crumbs.map((c) => (
                <span key={c.label} className={s.crumb}>
                  <span aria-hidden>/</span>
                  {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
                </span>
              ))}
            </nav>
            <div className={s.grid}>
              <div className={s.copy}>
                <Eyebrow>{eyebrow}</Eyebrow>
                <h1 className={s.title}>{title}</h1>
                <p className={s.line}>{line}</p>
                <GateDoors kind={kind} benefits={benefits} />
              </div>
              <div className={s.visual}>
                {motif ? <DivisionMotif motif={motif} className={s.motif} /> : <Image src={image} alt="" fill priority sizes="(min-width: 900px) 44vw, 100vw" className={image.startsWith("/media/renders/") ? s.render : s.image} />}
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
