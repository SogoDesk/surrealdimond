"use client";

/**
 * The story under the diamond search, after Tanishq's natural diamonds page
 * but with the search first: dealers come to find a stone, and the bands
 * below speak to the retailer who is not a dealer yet.
 *
 * 1. Opening (navy): from 1.5 billion years to just weeks, with the growth
 *    film placeholder.
 * 2. What makes it Surreal: four verified claims as cards.
 * 3. Seed to stone: five steps, each with a photo placeholder.
 * 4. The four Cs as dealers use them: tabs with a drawn scale and a door
 *    that applies the matching filters to the search above.
 * 5. Verified: the lab report placeholder beside the certificate facts.
 * 6. Lab grown and mined, in plain facts.
 * 7. Dealer voices: placeholders until Surreal sends named quotes.
 * 8. Doors: become a dealer (or back to the search), grow to order, book an
 *    appointment.
 *
 * Every claim comes from src/content/site.ts or the live M2O page. Media and
 * the process copy are placeholders and are labelled as such on the page.
 */

import Link from "next/link";
import { useRef, useState } from "react";
import Eyebrow from "@/components/ui/Eyebrow";
import ShapeIcon from "@/components/brand/ShapeIcon";
import { openContactDrawer } from "@/components/chrome/ContactDrawer";
import { useRevealIn } from "@/components/home/useRevealIn";
import { CLARITIES, COLORS, type StoneShape } from "@/content/diamonds";
import { account, brand } from "@/content/site";
import { useDealer } from "@/lib/dealer";
import type { DiamondQuery } from "./query";
import s from "./story.module.css";

/** A media slot waiting for Surreal's photo or film. */
function Ph({ label, note, shape = "round", tone = "light" }: { label: string; note: string; shape?: StoneShape; tone?: "light" | "dark" }) {
  return (
    <span className={`${s.ph} ${tone === "dark" ? s.phDark : ""}`} role="img" aria-label={`Placeholder: ${label}`}>
      <span className={s.phGrid} aria-hidden />
      <ShapeIcon shape={shape} detail className={s.phIcon} />
      <span className={s.phTag}>Placeholder</span>
      <span className={s.phText}>
        <strong>{label}</strong>
        {note}
      </span>
    </span>
  );
}

const TRUTHS: { title: string; body: string; icon: "crown" | "machine" | "clear" | "large" }[] = [
  { title: "Grower direct", body: "Work with the grower at the top of the food chain.", icon: "crown" },
  { title: "Our own machines", body: "We manufacture our own CVD machines and created our growing recipe.", icon: "machine" },
  { title: "Transparent", body: "The world's most transparent diamond material, primarily DEF color and VVS clarity.", icon: "clear" },
  { title: "Larger stones", body: "Specializing in larger stones up to 15 carats, with a curated feed of 10,000 to 15,000 call stones.", icon: "large" },
];

function TruthIcon({ id }: { id: (typeof TRUTHS)[number]["icon"] }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 48 48" className={s.truthIcon} aria-hidden>
      {id === "crown" && (
        <>
          <path d="M10 34 8 16l9 8 7-12 7 12 9-8-2 18Z" {...p} data-draw />
          <path d="M10 39h28" {...p} data-draw />
        </>
      )}
      {id === "machine" && (
        <>
          <rect x="12" y="8" width="24" height="32" rx="4" {...p} data-draw />
          <path d="M18 8v-3h12v3M16 40v3h16v-3" {...p} data-draw />
          <path d="M20 22h8l2 3-6 7-6-7Z" {...p} data-draw />
        </>
      )}
      {id === "clear" && (
        <>
          <path d="M14 14h20l8 10-18 18L6 24Z" {...p} data-draw />
          <path d="M6 24h36M14 14l-2 10 12 18 12-18-2-10" {...p} data-draw />
        </>
      )}
      {id === "large" && (
        <>
          <circle cx="16" cy="30" r="6" {...p} data-draw />
          <circle cx="31" cy="24" r="12" {...p} data-draw />
          <path d="M4 42h40" {...p} data-draw />
        </>
      )}
    </svg>
  );
}

const STEPS: { title: string; body: string; shape: StoneShape }[] = [
  { title: "Seed", body: "A thin diamond seed plate goes into the growth chamber.", shape: "asscher" },
  { title: "Grow", body: "Carbon builds on the seed layer by layer, in machines we make ourselves.", shape: "emerald" },
  { title: "Cut and polish", body: "The rough crystal is planned, cut and polished to its shape.", shape: "oval" },
  { title: "Grade", body: "An independent lab grades the stone and issues its certificate number.", shape: "round" },
  { title: "To your store", body: "Surreal stones ordered before 4:00pm EST ship the next day.", shape: "pear" },
];

type CKey = "carat" | "cut" | "color" | "clarity";
const CS: { key: CKey; label: string; line: string; body: string; cta: string; apply: Partial<DiamondQuery> }[] = [
  {
    key: "carat",
    label: "Carat",
    line: "More than weight",
    body: "Carat is weight, and it sets the face-up size your client sees. We specialize in larger stones up to 15 carats; Made to Order grows any carat weight or exact dimensions.",
    cta: "Show stones of 5 ct and up",
    apply: { caratMin: 5, caratMax: null },
  },
  {
    key: "cut",
    label: "Cut",
    line: "Where the light comes from",
    body: "Proportions, polish and symmetry decide how a stone returns light. The search lists cut for rounds, polish and symmetry for every shape, with table and depth.",
    cta: "Show Ideal and Excellent cuts",
    apply: { cut: ["Ideal", "Excellent"] },
  },
  {
    key: "color",
    label: "Color",
    line: "The absence of color",
    body: "The scale runs from D, colorless, down through the alphabet. Surreal grows primarily DEF color, the top of the scale.",
    cta: "Show D to F color",
    apply: { color: [0, 2] },
  },
  {
    key: "clarity",
    label: "Clarity",
    line: "What the loupe finds",
    body: "Clarity grades the inclusions seen under magnification. Surreal grows primarily VVS clarity: very, very slightly included.",
    cta: "Show VVS clarity",
    apply: { clarity: [2, 3] },
  },
];

/** Approximate round diameters in millimetres, for the carat scale. */
const CARAT_MM: [number, number][] = [
  [1, 6.5],
  [3, 9.4],
  [5, 11.1],
  [10, 14.0],
  [15, 16.1],
];

function CVisual({ k }: { k: CKey }) {
  if (k === "carat") {
    return (
      <div className={s.caratScale}>
        {CARAT_MM.map(([ct, mm]) => (
          <figure key={ct} className={s.caratItem}>
            <span className={s.caratStone} style={{ width: `${mm * 4.6}px`, height: `${mm * 4.6}px` }}>
              <ShapeIcon shape="round" detail />
            </span>
            <figcaption>
              <strong>{ct} ct</strong>
              <span>about {mm.toFixed(1)} mm</span>
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }
  if (k === "cut") {
    const line = { fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinejoin: "round" as const };
    return (
      <svg viewBox="0 0 420 240" className={s.profile} role="img" aria-label="A round brilliant in profile: table, crown, girdle and pavilion">
        <path d="M150 58h120l62 44-122 118L88 102Z" fill="var(--beam)" stroke="none" />
        <path d="M150 58h120l62 44-122 118L88 102Z" {...line} />
        <path d="M88 102h244M150 58l-22 44 82 118 82-118-22-44M190 58l-14 44 34 118 34-118-14-44" {...line} strokeWidth={0.7} opacity={0.6} />
        <path d="M150 38h120M150 33v10M270 33v10" {...line} stroke="var(--line)" />
        <text x="210" y="28" textAnchor="middle" className={s.profileLabel}>
          Table
        </text>
        <path d="M352 58v162M347 58h10M347 220h10" {...line} stroke="var(--line)" />
        <text x="362" y="143" className={s.profileLabel}>
          Depth
        </text>
        <text x="46" y="84" className={s.profileLabel}>
          Crown
        </text>
        <text x="30" y="106" className={s.profileLabel}>
          Girdle
        </text>
        <text x="70" y="160" className={s.profileLabel}>
          Pavilion
        </text>
      </svg>
    );
  }
  const scale = k === "color" ? COLORS : CLARITIES;
  const on = k === "color" ? [0, 2] : [2, 3];
  return (
    <div className={s.gradeScale}>
      <div className={`${s.gradeBar} ${k === "color" ? s.gradeBarColor : s.gradeBarClarity}`}>
        {scale.map((g, i) => (
          <span key={g} className={s.gradeCell} data-on={i >= on[0] && i <= on[1] ? "" : undefined}>
            {g}
          </span>
        ))}
      </div>
      <p className={s.gradeNote}>
        <span className={s.gradeKey} aria-hidden />
        {k === "color" ? "Where Surreal grows: primarily DEF" : "Where Surreal grows: primarily VVS"}
      </p>
    </div>
  );
}

const PROOF: { title: string; body: string }[] = [
  { title: "A certificate on every line", body: "Each stone in the search lists its lab and certificate number, and Quick View links to the report." },
  { title: "IGI on Made to Order", body: "Every diamond grown to order comes with an IGI grading certificate." },
  { title: "Girdle inscription", body: "Ask for text laser inscribed on the girdle with a Made to Order request." },
  { title: "A booklet for your client", body: "Made to Order stones come with a brochure of nine unique visual touchpoints." },
];

const COMPARE: { row: string; lab: string; mined: string; same?: boolean }[] = [
  { row: "What it is", lab: "Diamond: pure carbon in the diamond crystal", mined: "Diamond: pure carbon in the diamond crystal", same: true },
  { row: "How it is graded", lab: "The 4Cs, by an independent lab", mined: "The 4Cs, by an independent lab", same: true },
  { row: "Time to form", lab: "Weeks, from inception to final inspection", mined: "About 1.5 billion years" },
  { row: "Where it comes from", lab: "Grown by Surreal, environmentally responsible and ethically made", mined: "Mined from the earth" },
];

export default function DiamondStory({ onApply }: { onApply: (patch: Partial<DiamondQuery>) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const dealer = useDealer();
  const [tab, setTab] = useState<CKey>("color");
  const active = CS.find((c) => c.key === tab) ?? CS[0];
  useRevealIn(ref);

  return (
    <div ref={ref} id="diamond-story" className={s.story}>
      {/* 1. Opening */}
      <section className={s.opening} data-theme="navy" aria-labelledby="story-open">
        <div className={s.wrap}>
          <div className={s.openingGrid}>
            <div className={s.openingText}>
              <span data-rise>
                <Eyebrow>The Surreal diamond</Eyebrow>
              </span>
              <h2 id="story-open" className={s.openingTitle} data-rise>
                From 1.5 billion years <em>to just weeks.</em>
              </h2>
              <p className={s.openingBody} data-rise>
                We are the largest CVD grower on planet Earth. We make our own CVD machines and created our own growing recipe, so every Surreal stone starts
                with us and reaches your store from the grower.
              </p>
              <p className={s.openingMission} data-rise>
                Our mission: to democratize diamonds, so they can truly be for everyone.
              </p>
            </div>
            <div className={s.openingMedia} data-rise>
              <Ph label="Growth chamber film" note="A short loop of a stone growing, from Surreal." shape="radiant" tone="dark" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. What makes it Surreal */}
      <section className={s.band} aria-labelledby="story-truths">
        <div className={s.wrap}>
          <header className={s.head}>
            <span data-rise>
              <Eyebrow rule={false}>Four truths</Eyebrow>
            </span>
            <h2 id="story-truths" className={s.title} data-rise>
              What makes a diamond <em>Surreal</em>
            </h2>
          </header>
          <ul className={s.truths}>
            {TRUTHS.map((t, i) => (
              <li key={t.title} className={s.truth} data-rise>
                <span className={s.truthNum}>0{i + 1}</span>
                <TruthIcon id={t.icon} />
                <h3 className={s.truthTitle}>{t.title}</h3>
                <p className={s.truthBody}>{t.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Seed to stone */}
      <section className={`${s.band} ${s.bandPaper}`} aria-labelledby="story-journey">
        <div className={s.wrap}>
          <header className={s.headRow}>
            <div className={s.headText}>
              <span data-rise>
                <Eyebrow>Seed to stone</Eyebrow>
              </span>
              <h2 id="story-journey" className={s.title} data-rise>
                How a Surreal diamond <em>is grown</em>
              </h2>
            </div>
            <p className={s.draftNote} data-rise>
              Draft steps and photo slots. Surreal confirms the process copy and sends the photography.
            </p>
          </header>
          <ol className={s.steps}>
            {STEPS.map((st, i) => (
              <li key={st.title} className={s.step} data-rise>
                <Ph label={`${st.title} photo`} note="From Surreal." shape={st.shape} />
                <span className={s.stepNum}>Step {i + 1}</span>
                <h3 className={s.stepTitle}>{st.title}</h3>
                <p className={s.stepBody}>{st.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. The four Cs */}
      <section className={s.band} aria-labelledby="story-cs">
        <div className={s.wrap}>
          <header className={s.head}>
            <span data-rise>
              <Eyebrow rule={false}>The four Cs</Eyebrow>
            </span>
            <h2 id="story-cs" className={s.title} data-rise>
              Grading, <em>as your clients ask about it</em>
            </h2>
          </header>
          <div className={s.cs} data-rise>
            <div className={s.csTabs} role="tablist" aria-label="The four Cs">
              {CS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="tab"
                  id={`cs-tab-${c.key}`}
                  aria-selected={tab === c.key}
                  aria-controls="cs-panel"
                  className={s.csTab}
                  onClick={() => setTab(c.key)}
                >
                  <strong>{c.label}</strong>
                  <span>{c.line}</span>
                </button>
              ))}
            </div>
            <div className={s.csPanel} role="tabpanel" id="cs-panel" aria-labelledby={`cs-tab-${tab}`}>
              <div className={s.csVisual}>
                <CVisual k={tab} />
              </div>
              <div className={s.csText}>
                <h3 className={s.csTitle}>{active.label}</h3>
                <p>{active.body}</p>
                <button type="button" className={s.csCta} onClick={() => onApply(active.apply)}>
                  {active.cta}
                  <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 13V3M4 7l4-4 4 4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Verified */}
      <section className={`${s.band} ${s.bandMist}`} aria-labelledby="story-proof">
        <div className={s.wrap}>
          <div className={s.proofGrid}>
            <div className={s.report} data-rise aria-label="Placeholder: sample lab report" role="img">
              <span className={s.phTag}>Placeholder</span>
              <span className={s.reportHead}>
                <span className={s.reportLab}>Lab report</span>
                <span className={s.reportNo}>No. 000000000</span>
              </span>
              <span className={s.reportBody}>
                <ShapeIcon shape="oval" detail className={s.reportIcon} />
                <span className={s.reportLines}>
                  {["Shape", "Carat", "Color", "Clarity", "Polish", "Symmetry", "Fluorescence"].map((k) => (
                    <span key={k}>
                      <em>{k}</em>
                      <i />
                    </span>
                  ))}
                </span>
              </span>
              <span className={s.reportFoot}>A real report from Surreal replaces this sample.</span>
            </div>
            <div>
              <header className={s.headLeft}>
                <span data-rise>
                  <Eyebrow>Verified</Eyebrow>
                </span>
                <h2 id="story-proof" className={s.title} data-rise>
                  Every stone, <em>on paper</em>
                </h2>
              </header>
              <ul className={s.proofList}>
                {PROOF.map((p) => (
                  <li key={p.title} data-rise>
                    <svg aria-hidden viewBox="0 0 10 10" width="9" height="9">
                      <path d="M5 0.5 9.5 5 5 9.5 0.5 5Z" fill="currentColor" />
                    </svg>
                    <span>
                      <strong>{p.title}</strong>
                      {p.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Lab grown and mined */}
      <section className={s.band} aria-labelledby="story-compare">
        <div className={s.wrap}>
          <header className={s.head}>
            <span data-rise>
              <Eyebrow rule={false}>Lab grown and mined</Eyebrow>
            </span>
            <h2 id="story-compare" className={s.title} data-rise>
              Completely identical, <em>grown in weeks</em>
            </h2>
          </header>
          <div className={s.compare} role="table" aria-label="Lab grown and mined diamonds compared" data-rise>
            <div className={`${s.compareRow} ${s.compareHead}`} role="row">
              <span role="columnheader" />
              <span role="columnheader">Surreal lab grown</span>
              <span role="columnheader">Mined</span>
            </div>
            {COMPARE.map((c) => (
              <div key={c.row} className={s.compareRow} role="row">
                <span role="rowheader" className={s.compareKey}>
                  {c.row}
                  {c.same && <span className={s.same}>Same</span>}
                </span>
                <span role="cell" className={s.compareLab}>
                  {c.lab}
                </span>
                <span role="cell">{c.mined}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Dealer voices */}
      <section className={`${s.band} ${s.bandPaper}`} aria-labelledby="story-voices">
        <div className={s.wrap}>
          <header className={s.head}>
            <span data-rise>
              <Eyebrow rule={false}>Dealer voices</Eyebrow>
            </span>
            <h2 id="story-voices" className={s.title} data-rise>
              From the stores <em>we grow for</em>
            </h2>
          </header>
          <ul className={s.voices}>
            {[1, 2, 3].map((n) => (
              <li key={n} className={s.voice} data-rise>
                <span className={s.phTag}>Placeholder</span>
                <span className={s.quoteMark} aria-hidden>
                  &ldquo;
                </span>
                <span className={s.voiceLines} aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
                <p className={s.voiceNote}>A quote from a Surreal dealer who agrees to be named, with their store and city.</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8. Doors */}
      <section className={`${s.band} ${s.bandDoors}`} aria-labelledby="story-doors">
        <div className={s.wrap}>
          <h2 id="story-doors" className={s.srOnly}>
            Next steps
          </h2>
          <ul className={s.doors}>
            <li data-rise>
              {dealer ? (
                <button type="button" className={s.door} onClick={() => onApply({})}>
                  <span className={s.doorKicker}>Your search</span>
                  <strong>Back to the stones</strong>
                  <span>Pick up where you left off, with your filters as they were.</span>
                </button>
              ) : (
                <Link href={account.apply} className={`${s.door} ${s.doorInk}`}>
                  <span className={s.doorKicker}>For jewelry retailers</span>
                  <strong>Become a dealer</strong>
                  <span>Direct-from-the-grower pricing and an exclusive territory. {brand.claims.tradeOnly}.</span>
                </Link>
              )}
            </li>
            <li data-rise>
              <Link href="/diamonds/made-to-order" className={s.door}>
                <span className={s.doorKicker}>Made to Order</span>
                <strong>Grow one to order</strong>
                <span>Any shape, in any carat weight or dimensions, with an IGI certificate.</span>
              </Link>
            </li>
            <li data-rise>
              <button type="button" className={s.door} onClick={() => openContactDrawer("other", "visit")}>
                <span className={s.doorKicker}>{brand.office.label}</span>
                <strong>See stones in person</strong>
                <span>
                  Book an appointment at {brand.office.address1}, {brand.office.address2.replace(/ \d+$/, "")}.
                </span>
              </button>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
