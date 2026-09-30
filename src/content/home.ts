/**
 * Homepage content (docs/CONTEXT.md, "Homepage plan"). Copy stays inside the
 * verified facts in site.ts and the live site; images are the processed
 * client assets in public/media.
 */

import { account, brand } from "./site";

export interface HeroSlide {
  id: string;
  /** 3:1 web banner, logo in the artwork */
  desktop: string;
  /** Square image for phones */
  mobile: string;
  href: string;
  label: string;
}

export const heroSlides: HeroSlide[] = [
  { id: "dream", desktop: "/media/banners/web-2.webp", mobile: "/media/photos/sb-4091-sm.webp", href: "/jewelry/engagement", label: "Engagement rings" },
  { id: "hands", desktop: "/media/banners/web-1.webp", mobile: "/media/banners/social-3.webp", href: "/jewelry/rings", label: "Rings" },
  { id: "trio", desktop: "/media/banners/web-3.webp", mobile: "/media/banners/social-c.webp", href: "/jewelry/pendants", label: "Pendants and earrings" },
  { id: "lines", desktop: "/media/banners/web-4.webp", mobile: "/media/banners/social-2.webp", href: "/jewelry/rings", label: "Rings and huggies" },
  { id: "circle", desktop: "/media/banners/web-5.webp", mobile: "/media/banners/social-a.webp", href: "/jewelry/pendants", label: "Pendants" },
  { id: "bud", desktop: "/media/banners/web-7.webp", mobile: "/media/banners/social-1.webp", href: "/jewelry/engagement", label: "Three stone emerald cut" },
  { id: "spot", desktop: "/media/banners/web-8.webp", mobile: "/media/banners/social-6.webp", href: "/diamonds/made-to-order", label: "Made to Order diamonds" },
];

export const growerProof = [
  { figure: "No. 1", label: "The largest CVD grower on planet Earth" },
  { figure: "Own", label: "Machines we manufacture, and a growing recipe we created" },
  { figure: "DEF", label: "Color, VVS clarity: what we primarily grow" },
  { figure: "15 ct", label: "Larger stones are our specialty, up to fifteen carats" },
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
