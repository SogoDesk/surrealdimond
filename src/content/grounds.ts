import type { CSSProperties } from "react";
import type { Category } from "./catalog";

/**
 * Story grounds for product images (BRD R-09: colored or story backgrounds
 * instead of grey). Each category has one soft ground from the house
 * palette's family; the image well lays a white light at its centre so the
 * piece, rendered on white and set with multiply, keeps its true metal and
 * sits in a pool of color.
 */
export const grounds: Record<Category, string> = {
  engagement: "#e3f0f7",
  "wedding-bands": "#eeebe4",
  earrings: "#f3e7ec",
  necklaces: "#e3eee8",
  pendants: "#eae6f2",
  rings: "#f2eadb",
  bracelets: "#e2e9f2",
  "sterling-silver": "#e9edf0",
};

/** Inline custom property for a well: --ground. */
export const groundStyle = (c: Category) => ({ "--ground": grounds[c] }) as CSSProperties;
