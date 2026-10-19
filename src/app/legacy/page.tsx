import type { Metadata } from "next";
import ContentPage, { Band, Facts, Steps } from "@/components/pages/ContentPage";
import s from "@/components/pages/ContentPage.module.css";
import Button from "@/components/ui/Button";
import { brand } from "@/content/site";

export const metadata: Metadata = { title: "Diamond Legacy | Surreal Diamond" };

const ASK = "/contact?type=programs";

/**
 * Diamond Legacy (BRD R-20): short and mostly content, from the live Legacy
 * page as recorded in docs/CONTEXT.md. The list of Legacy diamonds and the
 * order form move onto the dealer site later (Q6); until then the doors are
 * the program inquiry and the office phone. The FAQ topics are listed as
 * things to ask, since their answers wait on Surreal.
 */
export default function Page() {
  const { office } = brand;
  return (
    <ContentPage
      eyebrow="LEGACY by Surreal"
      title={
        <>
          One seed line, <em>every milestone</em>
        </>
      }
      line="Every diamond in a Legacy collection is grown from the same seed line, for a push present, an anniversary or a future engagement."
      crumbs={[{ label: "Diamond Legacy" }]}
      image="/media/photos/sb-4117.webp"
      imageAlt="Three stone emerald cut ring resting in a green flower bud"
      doors={
        <>
          <Button href={ASK} variant="primary" arrow>
            Start a Legacy
          </Button>
          <Button href={office.phoneHref} variant="secondary">
            Call {office.phone}
          </Button>
        </>
      }
    >
      <Band
        eyebrow="How it works"
        title={
          <>
            Three steps, <em>one family of stones</em>.
          </>
        }
      >
        <Steps
          items={[
            { title: "Choose from the Legacy list", line: "Start from the list of Legacy diamonds with your client." },
            { title: "Call us or send the order", line: `Call ${office.phone} or send a Legacy request, and we confirm the details with you.` },
            { title: "Grown from the same seed line", line: "Each diamond in the collection comes from that one seed line, ready for the next milestone." },
          ]}
        />
      </Band>

      <Band
        tone="mist"
        eyebrow="The program"
        title={
          <>
            Priced as <em>one program</em>.
          </>
        }
      >
        <Facts
          items={[
            { figure: "One", label: "Seed line for every diamond in the collection" },
            { figure: "SEED", label: "The SEED time capsule, part of the program" },
            { figure: "Fixed", label: "Priced as a fixed program fee" },
            { figure: "Milestones", label: "A push present, an anniversary, a future engagement" },
          ]}
        />
      </Band>

      <Band eyebrow="Questions" title={<>Ask us <em>anything</em>.</>}>
        <p>
          Dealers ask us about the shapes we can grow, growing two at once, timing, whether the seed is returned, color and clarity, and growing
          larger than the original. We answer each one for your client.
        </p>
        <div className={s.doors}>
          <Button href={ASK} variant="primary" arrow>
            Ask about Legacy
          </Button>
          <Button href="/diamonds/made-to-order" variant="tertiary" arrow>
            Made to Order
          </Button>
        </div>
      </Band>
    </ContentPage>
  );
}
