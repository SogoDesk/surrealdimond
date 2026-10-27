/**
 * The Made to Order request's fields (BRD R-19; client feedback F-C2). The
 * fields are the live M2O form's, plus dimensions (the program grows "any
 * carat weight or dimensions"). Labels, placeholders and hints live here so
 * Surreal's M2O specification (C-17) replaces this file and nothing else;
 * until it arrives the wording below is ours.
 */

import type { StoneShape } from "./diamonds";

export type M2OField = "name" | "company" | "customer" | "phone" | "email" | "size" | "dimensions" | "shape" | "ratio" | "inscription" | "notes";

export interface M2OFieldSpec {
  label: string;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
  type?: "text" | "number" | "tel" | "email";
  step?: string;
  wide?: boolean;
  autoComplete?: string;
}

export const M2O_FIELDS: Record<Exclude<M2OField, "shape" | "notes">, M2OFieldSpec> & { notes: M2OFieldSpec } = {
  size: { label: "Exact size requested (ct)", placeholder: "2.00", type: "number", step: "0.01", hint: "Or give dimensions instead" },
  dimensions: { label: "Dimensions (mm)", placeholder: "9.00 x 6.50", optional: true, hint: "Length by width, for a stone sized to a setting" },
  ratio: { label: "Length to width ratio", placeholder: "1.40", optional: true, hint: "For fancy shapes" },
  inscription: { label: "Girdle inscription", placeholder: "Initials, a date or a short message", optional: true, wide: true, hint: "Laser inscribed on the girdle" },
  customer: { label: "Customer name (for the booklet)", placeholder: "As it should appear in your client's booklet", optional: true, wide: true },
  name: { label: "Your name", placeholder: "First and last name", autoComplete: "name" },
  company: { label: "Company name", placeholder: "Your store", autoComplete: "organization" },
  phone: { label: "Phone", placeholder: "(212) 555-0100", type: "tel", autoComplete: "tel" },
  email: { label: "Email", placeholder: "you@yourstore.com", type: "email", autoComplete: "email" },
  notes: { label: "Notes", placeholder: "The setting it is for, the date you need it by, anything else we should know", optional: true, wide: true },
};

/** The shapes offered on the live M2O form; anything else goes under Other. */
export const M2O_SHAPES: StoneShape[] = ["round", "radiant", "oval", "cushion", "emerald", "pear"];

/** The program as the live site states it. */
export const M2O_FACTS = [
  "Exclusively for Surreal dealers",
  "Any shape, in any carat weight or dimensions",
  "Under 4 ct: FG+ color, VS+ clarity",
  "Over 4 ct: G+ color, VS+ clarity",
  "Every diamond comes with an IGI grading certificate",
  "A brochure with nine unique visual touchpoints for your client",
  "A program fee plus the stone, confirmed with your order",
];

/** The grade promise for a size, from the program facts. */
export const m2oGrade = (ct: number) => (ct > 4 ? "Over 4 ct: G color or better, VS clarity or better" : "Under 4 ct: F or G color or better, VS clarity or better");
