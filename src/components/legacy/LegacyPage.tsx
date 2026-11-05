import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Footer from "@/components/sections/Footer";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import { brand } from "@/content/site";
import { LEGACY_PHOTO, LEGACY_PHOTO_ALT, LEGACY_PHOTO_VT, LEGACY_SEARCH, LEGACY_VT } from "./transition";
import s from "./LegacyPage.module.css";

/**
 * Diamond Legacy (BRD R-20), a standalone information page (client request,
 * November 2026), from the live Legacy page as recorded in docs/CONTEXT.md.
 * Start a Legacy transitions the page into the Legacy stone search
 * (/legacy/stones, transition.ts), where the dealer picks a Legacy stone and
 * orders it like any other. The FAQ topics are listed as things to ask, since
 * their answers wait on Surreal.
 */

const ASK = "/contact?type=programs";
const MILESTONES = ["A push present", "An anniversary", "A future engagement"];
const STEPS = [
  { title: "Choose a Legacy stone", line: "Start a Legacy opens the search on the Legacy stones. Pick one with your client." },
  { title: "Order it like any stone", line: `Purchase it or take it on memo from the search, or call ${brand.office.phone}, and we confirm the details with you.` },
  { title: "Grown from the same seed line", line: "Each diamond in the collection comes from that one seed line, ready for the next milestone." },
];
const FACTS = [
  { figure: "One", label: "Seed line for every diamond in the collection" },
  { figure: "SEED", label: "The SEED time capsule, part of the program" },
  { figure: "Fixed", label: "Priced as a fixed program fee" },
  { figure: "Milestones", label: "A push present, an anniversary, a future engagement" },
];
const TOPICS = ["The shapes we can grow", "Growing two at once", "Timing", "Whether the seed is returned", "Color and clarity", "Growing larger than the original"];

function StartLegacy() {
  return (
    <Button href={LEGACY_SEARCH} transitionTypes={["legacy-forward"]} variant="primary" arrow>
      Start a Legacy
    </Button>
  );
}

export default function LegacyPage() {
  const { office } = brand;
  return (
    <>
      <SiteChrome />
      <ContactDrawer />
      <ViewTransition {...LEGACY_VT}>
        <main id="main">
          <Section id="legacy" theme="navy" label="Diamond Legacy" className={s.hero}>
            <div className={s.wrap}>
              <nav aria-label="Breadcrumb" className={s.crumbs}>
                <Link href="/">Home</Link>
                <span aria-hidden>/</span>
                <span aria-current="page">Diamond Legacy</span>
              </nav>
              <div className={s.heroGrid}>
                <div className={s.heroCopy}>
                  <p className={s.eyebrow}>LEGACY by Surreal</p>
                  <h1 className={s.title}>
                    One seed line, <em>every milestone</em>
                  </h1>
                  <p className={s.line}>Every diamond in a Legacy collection is grown from the same seed line, for a push present, an anniversary or a future engagement.</p>
                  <div className={s.doors}>
                    <StartLegacy />
                    <Button href={office.phoneHref} variant="secondary">
                      Call {office.phone}
                    </Button>
                  </div>
                  <ol className={s.seedLine} aria-label="Milestones">
                    {MILESTONES.map((m) => (
                      <li key={m}>
                        <span className={s.node} aria-hidden />
                        {m}
                      </li>
                    ))}
                  </ol>
                </div>
                <ViewTransition name={LEGACY_PHOTO_VT} share="legacy-morph" default="none">
                  <div className={s.photo}>
                    <Image src={LEGACY_PHOTO} alt={LEGACY_PHOTO_ALT} fill priority sizes="(min-width: 900px) 40vw, 100vw" />
                  </div>
                </ViewTransition>
              </div>
            </div>
          </Section>

          <section className={s.band} aria-labelledby="legacy-how">
            <div className={s.wrap}>
              <header className={s.bandHead}>
                <p className={s.kicker}>How it works</p>
                <h2 id="legacy-how" className={s.bandTitle}>
                  Three steps, <em>one family of stones</em>.
                </h2>
              </header>
              <ol className={s.steps}>
                {STEPS.map((st, i) => (
                  <li key={st.title} className={s.step}>
                    <span className={s.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                    <h3 className={s.stepTitle}>{st.title}</h3>
                    <p className={s.stepLine}>{st.line}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className={s.band} data-tone="mist" aria-labelledby="legacy-program">
            <div className={s.wrap}>
              <header className={s.bandHead}>
                <p className={s.kicker}>The program</p>
                <h2 id="legacy-program" className={s.bandTitle}>
                  Priced as <em>one program</em>.
                </h2>
              </header>
              <dl className={s.facts}>
                {FACTS.map((f) => (
                  <div key={f.figure} className={s.fact}>
                    <dt className={s.factFigure}>{f.figure}</dt>
                    <dd className={s.factLabel}>{f.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section className={s.band} aria-labelledby="legacy-questions">
            <div className={`${s.wrap} ${s.questions}`}>
              <header className={s.bandHead}>
                <p className={s.kicker}>Questions</p>
                <h2 id="legacy-questions" className={s.bandTitle}>
                  Ask us <em>anything</em>.
                </h2>
              </header>
              <div>
                <p className={s.bandLine}>Dealers ask us about:</p>
                <ul className={s.topics}>
                  {TOPICS.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <p className={s.bandLine}>We answer each one for your client.</p>
                <div className={s.doors}>
                  <Button href={ASK} variant="primary" arrow>
                    Ask about Legacy
                  </Button>
                  <Button href="/diamonds/made-to-order" variant="tertiary" arrow>
                    Made to Order
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <Section id="legacy-start" theme="navy" label="Start a Legacy" className={s.closing}>
            <div className={`${s.wrap} ${s.closingInner}`}>
              <div>
                <p className={s.eyebrow}>Start a Legacy</p>
                <h2 className={s.closingTitle}>
                  Choose a <em>Legacy stone</em>.
                </h2>
                <p className={s.line}>Start a Legacy opens the search on the Legacy stones. Pick one with your client.</p>
              </div>
              <StartLegacy />
            </div>
          </Section>

          <Footer />
        </main>
      </ViewTransition>
    </>
  );
}
