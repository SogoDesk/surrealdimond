import type { Metadata } from "next";
import ContentPage, { Band, Facts } from "@/components/pages/ContentPage";
import s from "@/components/pages/ContentPage.module.css";
import Button from "@/components/ui/Button";
import { account, brand, team } from "@/content/site";

export const metadata: Metadata = { title: "About | Surreal Diamond" };

/**
 * About Us and Company History (BRD R-20): short and mostly content, every
 * line from the verified facts in src/content/site.ts. The footer's Company
 * History link lands on #history.
 */
export default function Page() {
  const { claims, office } = brand;
  return (
    <ContentPage
      eyebrow="Our story"
      title={
        <>
          If a Diamond is Forever, Surreal is <em>the New Forever</em>
        </>
      }
      line="We grow primarily DEF color, VVS clarity diamonds on machines we manufacture ourselves, from a recipe we created. Then our craftspeople set them in jewelry, for the trade only."
      crumbs={[{ label: "About" }]}
      image="/media/photos/sb-3502.webp"
      imageAlt="Diamond jewelry worn in the Surreal studio"
      doors={
        <>
          <Button href={account.apply} variant="primary" arrow>
            Become a dealer
          </Button>
          <Button href={account.appointment} variant="secondary">
            Visit New York
          </Button>
        </>
      }
    >
      <Band
        id="history"
        eyebrow="How we grow"
        title={
          <>
            From 1.5 billion years to <em>just weeks</em>.
          </>
        }
      >
        <p>
          {claims.machines}. As the largest CVD grower on planet Earth, we take every diamond from inception to final inspection in weeks,
          primarily {claims.color} and {claims.clarity}.
        </p>
        <Facts
          items={[
            { figure: "DEF", label: "Color, primarily, with VVS clarity" },
            { figure: "Weeks", label: "From inception to final inspection" },
            { figure: "15 ct", label: "Specialists in larger stones, up to 15 carats" },
            { figure: "10,000+", label: "Call stones in the curated diamond feed, up to 15,000" },
          ]}
        />
      </Band>

      <Band
        tone="mist"
        eyebrow="Our mission"
        title={
          <>
            Truly <em>foreveryone</em>.
          </>
        }
      >
        <p>{claims.mission}.</p>
        <p>
          {claims.ethics}. {claims.craft}.
        </p>
        <p>Trade only, always. {claims.tradeOnly}.</p>
      </Band>

      <Band eyebrow="Our team" title={<>The people behind <em>the grower</em>.</>}>
        <ul className={s.team}>
          {team.map((m) => (
            <li key={m.name}>
              <span className={s.teamName}>{m.name}</span>
              <span className={s.teamRole}>{m.role}</span>
            </li>
          ))}
        </ul>
      </Band>

      <Band tone="mist" eyebrow={office.label} title={<>See the stones <em>in person</em>.</>}>
        <address className={s.office}>
          <span>
            {office.address1}, {office.address2}
          </span>
          <a href={office.phoneHref}>{office.phone}</a>
          <span>{office.hours}</span>
        </address>
        <div className={s.doors}>
          <Button href={account.appointment} variant="primary" arrow>
            Schedule an appointment
          </Button>
          <Button href="/contact" variant="tertiary" arrow>
            Contact us
          </Button>
        </div>
      </Band>
    </ContentPage>
  );
}
