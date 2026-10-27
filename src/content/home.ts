/**
 * Homepage content (docs/CONTEXT.md, "Homepage plan"). Copy stays inside the
 * verified facts in site.ts and the live site; images are the processed
 * client assets in public/media.
 */

import { account, brand } from "./site";

/**
 * A homepage hero photograph (client feedback F-A1: a full-width moving
 * carousel behind the fixed headline and buttons). Campaign photography
 * only: the web banners carry their own text and logo, which would clash
 * with the headline over them.
 */
export interface HeroSlide {
  id: string;
  /** Wide photograph for tablets and desktops. */
  desktop: string;
  /** Photograph for phones; the same file is fine, framed by focusMobile. */
  mobile: string;
  /** object-position for each crop, so the jewelry stays clear of the headline on the left. */
  focus?: string;
  focusMobile?: string;
  /** Tablets and desktops: enlarge the photograph from its left edge (1.3 is 30 percent), moving a centred subject to the right of the headline. */
  zoom?: number;
  /** Where the slide's caption leads. */
  href: string;
  /** What the photograph shows: the screen reader text and the caption. */
  label: string;
}

export const heroSlides: HeroSlide[] = [
  { id: "pendant", desktop: "/media/photos/sb-3424.webp", mobile: "/media/photos/sb-3424.webp", focus: "50% 55%", focusMobile: "48% 50%", zoom: 1.35, href: "/jewelry/pendants", label: "Circle pendant in a line of light" },
  { id: "hands", desktop: "/media/photos/sb-3594.webp", mobile: "/media/photos/sb-3594.webp", focus: "62% 30%", focusMobile: "55% 30%", href: "/jewelry/rings", label: "Diamond rings and bracelets, worn" },
  { id: "bands", desktop: "/media/photos/sb-3999-copy.webp", mobile: "/media/photos/sb-3999-copy.webp", focus: "62% 50%", focusMobile: "70% 50%", href: "/jewelry/wedding-bands", label: "Diamond bands stacked on black" },
  { id: "hair", desktop: "/media/photos/sb-3750.webp", mobile: "/media/photos/sb-3750.webp", focus: "66% 40%", focusMobile: "60% 40%", href: "/jewelry/rings", label: "Gold and diamond rings, worn" },
  { id: "drops", desktop: "/media/photos/sb-3462.webp", mobile: "/media/photos/sb-3462.webp", focus: "62% 50%", focusMobile: "55% 50%", href: "/jewelry/earrings", label: "Diamond drop earrings" },
  { id: "smile", desktop: "/media/photos/sb-3666.webp", mobile: "/media/photos/sb-3666.webp", focus: "55% 35%", focusMobile: "55% 30%", href: "/jewelry/earrings", label: "Gold rings and hoops, worn" },
];

export interface Program {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  emphasis: string;
  body: string;
  facts: string[];
  image: string;
  imageAlt: string;
  chip: string;
  href: string;
  cta: string;
}

export const programs: Program[] = [
  {
    id: "made-to-order",
    index: "01",
    eyebrow: "Made to Order (M2O)",
    title: "A diamond grown",
    emphasis: "for one client",
    body: "Any shape, in any carat weight or dimensions, grown to the exact specification you send us. Exclusively for Surreal dealers.",
    facts: ["Under 4 ct: FG+ color, VS+ clarity", "Over 4 ct: G+ color, VS+ clarity", "IGI certificate and a nine touchpoint brochure"],
    image: "/media/photos/sb-3996.webp",
    imageAlt: "Oval halo engagement ring resting on white, lit by hard window light",
    chip: "Dealers only",
    href: "/diamonds/made-to-order",
    cta: "Start an M2O order",
  },
  {
    id: "legacy",
    index: "02",
    eyebrow: "LEGACY by Surreal",
    title: "One seed line,",
    emphasis: "every milestone",
    body: "Every diamond in a Legacy collection is grown from the same seed line, for a push present, an anniversary or a future engagement.",
    facts: ["Grown from the same seed line", "The SEED time capsule", "Order from the list of Legacy diamonds"],
    image: "/media/photos/sb-4117.webp",
    imageAlt: "Three stone emerald cut ring resting in a green flower bud",
    chip: "Seed line",
    href: "/legacy",
    cta: "Start a Legacy",
  },
  {
    id: "custom",
    index: "03",
    eyebrow: "Custom jewelry",
    title: "From a sketch",
    emphasis: "to a setting",
    body: "Our state of the art CAD department can make just about any jewelry item, from your client's idea to the finished piece.",
    facts: ["CAD on request", "F+ color, VS+ clarity on every custom piece", "14K, 18K or platinum"],
    image: "/media/banners/social-8.webp",
    imageAlt: "Pencil illustration of a woman wearing a diamond necklace and drop earrings",
    chip: "In-house CAD",
    href: "/custom",
    cta: "Start a project",
  },
];

export interface Story {
  id: string;
  productId: string;
  title: string;
  line: string;
}

/** Turntable videos (public/media/video), one per engagement setting. */
export const stories: Story[] = [
  { id: "le2004w442-11771", productId: "oval-halo", title: "Oval Halo", line: "Oval center, pave halo and band" },
  { id: "le2010w440-1-11772", productId: "round-halo", title: "Round Halo", line: "Round brilliant with a fine halo" },
  { id: "le2001w440-11770", productId: "round-solitaire", title: "Pave Solitaire", line: "Round brilliant, pave shoulders" },
  { id: "lrra04w442-11773", productId: "radiant-solitaire", title: "Radiant Solitaire", line: "Radiant cut, hidden gallery" },
  { id: "lw2007w442-11769", productId: "oval-solitaire", title: "Oval Solitaire", line: "Elongated oval on a pave band" },
];

export interface ExperienceTile {
  id: string;
  label: string;
  line: string;
  image: string;
  href: string;
  action?: "appointment" | "phone";
}

export const experience: ExperienceTile[] = [
  { id: "appointment", label: "Schedule an appointment", line: "Meet us at 551 Fifth Avenue", image: "/media/photos/sb-3970-sm.webp", href: account.appointment, action: "appointment" },
  { id: "call", label: "Talk to us", line: `${brand.office.phone}, Mon to Fri 9:30 to 6 EST`, image: "/media/photos/sb-3605-sm.webp", href: brand.office.phoneHref, action: "phone" },
  { id: "dashboard", label: "Retailer Dashboard", line: "Memo, marketing, training and more", image: "/media/photos/sb-3631-sm.webp", href: account.dashboard },
  { id: "custom", label: "Custom Portal", line: "Briefs, CAD and approvals", image: "/media/photos/sb-3738-sm.webp", href: "/custom" },
  { id: "legacy", label: "Diamond Legacy", line: "The list of Legacy diamonds", image: "/media/photos/sb-4098-copy-sm.webp", href: "/legacy" },
  { id: "story", label: "Our story", line: "The New Forever", image: "/media/photos/sb-3502-sm.webp", href: "/about" },
];
