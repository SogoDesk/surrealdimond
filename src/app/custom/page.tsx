import type { Metadata } from "next";
import ContentPage, { Band, Facts, Steps } from "@/components/pages/ContentPage";
import s from "@/components/pages/ContentPage.module.css";
import Button from "@/components/ui/Button";
import { CUSTOM_PORTAL_URL, brand } from "@/content/site";

export const metadata: Metadata = {
  title: "Custom Jewelry | Surreal Diamond",
  description: "Begin a custom design with Surreal's CAD department. F+ color, VS+ clarity diamonds on every custom item.",
};

/**
 * Custom jewelry (BRD R-22; client feedback F-C4): the client asked to link
 * the existing custom order portal rather than rebuild it, so this page
 * introduces the program and opens the portal on Surreal's current dealer
 * site, in a new tab (it asks for the dealer log in there). The rebuilt form
 * (components/custom/CustomPortal.tsx) is parked, not routed, in case the
 * portal moves onto this site later.
 */
export default function Page() {
  const { office } = brand;
  const portal = (
    <Button href={CUSTOM_PORTAL_URL} target="_blank" variant="primary" arrow ariaLabel="Open the custom order portal (opens in a new tab)">
      Open the custom order portal
    </Button>
  );
  return (
    <ContentPage
      eyebrow="Custom jewelry"
      title={
        <>
          From a sketch <em>to a setting</em>
        </>
      }
      line="Our state of the art CAD department can make just about any jewelry item, from your client's idea to the finished piece. F+ color, VS+ clarity diamonds on every custom item."
      crumbs={[{ label: "Custom jewelry" }]}
      image="/media/banners/social-8.webp"
      imageAlt="Pencil illustration of a woman wearing a diamond necklace and drop earrings"
      doors={
        <>
          {portal}
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
            One portal, <em>start to finish</em>.
          </>
        }
      >
        <Steps
          items={[
            { title: "Open the portal", line: "The custom order portal opens in a new tab. Log in with your Surreal dealer account." },
            { title: "Send the brief", line: "The item, metal, center stone, timing and any reference images, in the portal's custom order form." },
            { title: "CAD and approval", line: `CAD on request. We confirm the details with you before the piece is made. Questions: ${office.phone}.` },
          ]}
        />
      </Band>

      <Band
        tone="mist"
        eyebrow="The program"
        title={
          <>
            Made by <em>Surreal</em>.
          </>
        }
      >
        <Facts
          items={[
            { figure: "CAD", label: "On request, for any design" },
            { figure: "F+", label: "Color on every custom piece, VS+ clarity" },
            { figure: "14K", label: "14K, 18K or platinum" },
          ]}
        />
        <div className={s.doors}>{portal}</div>
      </Band>
    </ContentPage>
  );
}
