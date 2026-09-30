/**
 * The sixteen jewelry divisions, in the order of the live jewelry menu
 * (docs/CONTEXT.md, "Jewelry divisions"). Types carry a white-ground render;
 * collections and programs have no photography yet, so they carry a motif id
 * that the homepage and the mega menu draw in SVG instead.
 */

export type DivisionGroup = "types" | "collections" | "programs";
export type DivisionMotif = "constellation" | "enamel" | "laser" | "vermeil" | "silver" | "holiday" | "flyer";

export interface Division {
  id: string;
  label: string;
  group: DivisionGroup;
  href: string;
  /** Render slug in public/media/renders */
  image?: string;
  motif?: DivisionMotif;
  /** One factual line, from the live site; left out where nothing is verified */
  note?: string;
  /** True while the division has no product grid of its own yet */
  pending?: boolean;
}

export const divisionGroups: { id: DivisionGroup; label: string }[] = [
  { id: "types", label: "Jewelry" },
  { id: "collections", label: "Collections" },
  { id: "programs", label: "Programs" },
];

export const divisions: Division[] = [
  { id: "engagement", label: "Engagement Rings", group: "types", href: "/jewelry/engagement", image: "le2004w442-11741" },
  { id: "wedding-bands", label: "Wedding Bands", group: "types", href: "/jewelry/wedding-bands", image: "lgldbd3280-14k-wg" },
  { id: "rings", label: "Rings", group: "types", href: "/jewelry/rings", image: "ca24ap0006-8905" },
  { id: "stud-earrings", label: "Stud Earrings", group: "types", href: "/jewelry/stud-earrings", image: "lgerfa4418-ov-wg", pending: true },
  { id: "earrings", label: "Earrings", group: "types", href: "/jewelry/earrings", image: "in-and-out-hoops-yg" },
  { id: "bracelets", label: "Bracelets", group: "types", href: "/jewelry/bracelets", image: "sur17678lgbd70148-14k-wg" },
  { id: "flexi-bangles", label: "Flexi Bangles", group: "types", href: "/jewelry/flexi-bangles", image: "flexi-bangle-1", pending: true },
  { id: "pendants", label: "Pendants", group: "types", href: "/jewelry/pendants", image: "branding-images8028" },
  { id: "necklaces", label: "Necklaces", group: "types", href: "/jewelry/necklaces", image: "nkov18w440wg" },

  { id: "constellation", label: "Constellation Collection", group: "collections", href: "/jewelry/constellation", motif: "constellation", note: "Twelve zodiac pendants in 14K white and yellow gold", pending: true },
  { id: "enamour-enamel", label: "Enamour Enamel", group: "collections", href: "/jewelry/enamour-enamel", motif: "enamel", pending: true },
  { id: "laser-pierced", label: "Laser Pierced", group: "collections", href: "/jewelry/laser-pierced", motif: "laser", pending: true },
  { id: "vermeil", label: "Vermeil Collection", group: "collections", href: "/jewelry/vermeil", motif: "vermeil", note: "Gold over sterling silver", pending: true },
  { id: "sterling-silver", label: "Sterling Silver", group: "collections", href: "/jewelry/sterling-silver", image: "jbii247sil-2638", motif: "silver", note: "Sterling silver set with the diamonds we grow" },

  { id: "holiday-catalog-2026", label: "2026 Holiday Catalog", group: "programs", href: "/jewelry/holiday-catalog-2026", motif: "holiday", note: "Items from the turn-key holiday catalog mailing", pending: true },
  { id: "flyer-program-2026", label: "2026 Flyer Program", group: "programs", href: "/jewelry/flyer-program-2026", motif: "flyer", note: "Items from the turn-key flyer mailing", pending: true },
];

export const divisionTypes = divisions.filter((d) => d.group === "types");
export const divisionCollections = divisions.filter((d) => d.group === "collections");
export const pendingDivisions = divisions.filter((d) => d.pending);
export const divisionById = (id: string) => divisions.find((d) => d.id === id);
