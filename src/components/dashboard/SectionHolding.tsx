import Link from "next/link";
import type { DashSection } from "@/content/dashboard";
import { brand } from "@/content/site";
import DashIcon from "./DashIcon";
import s from "./dashboard.module.css";

/**
 * A dashboard section whose page is still ahead (the final list is Q5): its
 * title and line, what it will hold (from the live dashboard), and a door
 * that works today.
 */
export default function SectionHolding({ section }: { section: DashSection }) {
  return (
    <div className={s.holding}>
      <nav aria-label="Breadcrumb" className={s.crumbs}>
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden>/</span>
        <span aria-current="page">{section.label}</span>
      </nav>
      <header className={s.holdingHead}>
        <span className={s.holdingIcon}>
          <DashIcon id={section.icon} />
        </span>
        <div>
          <p className={s.kicker}>{section.status === "next" ? "Being built next" : "In design"}</p>
          <h1 className={s.homeTitle}>{section.label}</h1>
          <p className={s.holdingLine}>{section.line}.</p>
        </div>
      </header>
      {section.holds && (
        <section className={s.panel} aria-labelledby="holds-title">
          <h2 id="holds-title" className={s.panelTitle}>
            What this page will hold
          </h2>
          <ul className={s.holds}>
            {section.holds.map((h) => (
              <li key={h}>
                <svg aria-hidden viewBox="0 0 10 10" width="8" height="8">
                  <path d="M5 0.5 9.5 5 5 9.5 0.5 5Z" fill="currentColor" />
                </svg>
                {h}
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className={s.holdingDoors}>
        {section.meanwhile && (
          <Link href={section.meanwhile.href} className={s.primary}>
            {section.meanwhile.label}
          </Link>
        )}
        <Link href="/dashboard" className={s.secondary}>
          Back to the dashboard
        </Link>
      </div>
      <p className={s.feedback}>
        Need it now? Call {brand.office.phone}, {brand.office.hours}.
      </p>
    </div>
  );
}
