/**
 * Campaign photographs by category, for the image tiles in the store grid and
 * the campaign views in a product's gallery. "single" photos are square or
 * portrait (one grid cell); "wide" photos are landscape (two cells). Alt text
 * describes what is in the frame; the photographs show the collection, not a
 * specific catalog piece, and are labelled that way wherever they appear.
 */

import type { Category } from "./catalog";

export interface Editorial {
  src: string;
  alt: string;
  caption: string;
}

interface EditorialSet {
  single: Editorial[];
  wide: Editorial[];
}

const P = (id: string) => `/media/photos/sb-${id}-sm.webp`;

export const editorial: Record<Category, EditorialSet> = {
  engagement: {
    single: [
      { src: P("4091"), alt: "Oval halo engagement ring resting on a magenta dahlia", caption: "On a dahlia" },
      { src: P("3605"), alt: "Model wearing an oval halo ring with fine diamond necklaces", caption: "Worn" },
      { src: P("3970"), alt: "Halo engagement ring lying on grey silk in soft light", caption: "In the studio" },
      { src: P("3962"), alt: "Oval halo ring set on crumpled gold leaf", caption: "On gold leaf" },
    ],
    wide: [
      { src: P("3990"), alt: "Oval halo engagement ring seen through a glass of water", caption: "Under glass" },
      { src: P("3996"), alt: "Oval halo ring on white, lit by hard window light", caption: "In hard light" },
      { src: P("3984"), alt: "Halo engagement ring standing on a beam of light", caption: "On the beam" },
    ],
  },
  "wedding-bands": {
    single: [
      { src: P("3602"), alt: "Model with stacked diamond bands on both hands", caption: "Stacked" },
      { src: P("3592"), alt: "Model resting her chin on hands wearing diamond bands", caption: "Worn" },
      { src: P("3748"), alt: "Hands with gold and diamond bands", caption: "In gold" },
    ],
    wide: [
      { src: P("3999-copy"), alt: "Three diamond bands on black sticks", caption: "In the studio" },
      { src: P("4002-copy"), alt: "Pointed contour band on black sticks", caption: "Contour" },
      { src: P("4024"), alt: "Diamond bands stacked on a black stem", caption: "Stacked" },
    ],
  },
  earrings: {
    single: [
      { src: P("3067"), alt: "Model in shadow wearing a long diamond drop earring", caption: "In shadow" },
      { src: P("3730"), alt: "Model with gold hoops and stacked rings", caption: "Hoops, worn" },
      { src: P("3502"), alt: "Model wearing diamond drop earrings and line necklaces", caption: "Drops, worn" },
      { src: P("3483"), alt: "Model in a white shirt wearing diamond drops", caption: "Worn" },
    ],
    wide: [
      { src: P("3462"), alt: "Graduated diamond drop earrings on black", caption: "In the studio" },
      { src: P("4074"), alt: "Inside out diamond hoops hanging from a dahlia stem", caption: "On a dahlia" },
      { src: P("3666"), alt: "Model covering her eyes with hands full of rings", caption: "Worn" },
    ],
  },
  necklaces: {
    single: [
      { src: P("3497"), alt: "Model wearing several diamond line necklaces", caption: "Layered" },
      { src: P("3526"), alt: "Black and white portrait with layered diamond necklaces", caption: "Worn" },
      { src: P("3467"), alt: "Model in a white shirt with diamond necklaces", caption: "In white" },
      { src: P("3636"), alt: "Diamond necklaces worn down the back", caption: "Worn back" },
    ],
    wide: [
      { src: P("3424"), alt: "Diamond circle pendant on a fine chain against black", caption: "In the studio" },
      { src: P("3594"), alt: "Smiling model showing diamond rings and necklaces", caption: "Worn" },
    ],
  },
  pendants: {
    single: [
      { src: P("4083"), alt: "Bezel pendant hanging from a purple flower stem", caption: "On a stem" },
      { src: P("3636"), alt: "Pendants worn down the back", caption: "Worn back" },
      { src: P("3708"), alt: "Model wearing a circle pendant and rings", caption: "Worn" },
      { src: P("3724"), alt: "Model with crossed arms wearing pendants and rings", caption: "Layered" },
    ],
    wide: [
      { src: P("3440"), alt: "Diamond heart pendant casting a shadow on white", caption: "In the studio" },
      { src: P("4038"), alt: "Round pendant on a yellow gold chain among black sticks", caption: "In gold" },
      { src: P("3424"), alt: "Diamond circle pendant against black", caption: "Circle" },
    ],
  },
  rings: {
    single: [
      { src: P("3738"), alt: "Hand wearing sculptural gold and diamond rings", caption: "Stacked" },
      { src: P("3748"), alt: "Model kissing a hand full of gold rings", caption: "Worn" },
      { src: P("4031"), alt: "Gold pave rings stacked on black sticks", caption: "In the studio" },
      { src: P("3641"), alt: "Model in white wearing diamond rings and a pendant", caption: "In white" },
    ],
    wide: [
      { src: P("3750"), alt: "Hands in hair wearing gold rings", caption: "Worn" },
      { src: P("3666"), alt: "Model covering her eyes with hands full of rings", caption: "Hands" },
      { src: P("3568-alt"), alt: "Seated model with stacked rings and bracelets", caption: "Stacked" },
    ],
  },
  bracelets: {
    single: [
      { src: P("3171"), alt: "Model wearing diamond tennis bracelets and rings", caption: "Worn" },
      { src: P("3568"), alt: "Seated model wearing stacked bracelets and rings", caption: "Stacked" },
      { src: P("3591"), alt: "Model seated in denim wearing bracelets", caption: "Everyday" },
    ],
    wide: [
      { src: P("3631"), alt: "Hands on denim wearing gold rings and bracelets", caption: "Worn" },
      { src: P("3594"), alt: "Smiling model showing bracelets and rings", caption: "Everyday" },
      { src: P("3568-alt"), alt: "Seated model with stacked bracelets", caption: "Stacked" },
    ],
  },
  "sterling-silver": {
    single: [
      { src: P("3708"), alt: "Model wearing a pendant and rings", caption: "Worn" },
      { src: P("3724"), alt: "Model with crossed arms wearing pendants", caption: "Layered" },
    ],
    wide: [{ src: P("3440"), alt: "Diamond heart pendant casting a shadow on white", caption: "In the studio" }],
  },
};

/** For the all-jewelry grid: the categories in turn, so every image carries the link to its own category. */
export const editorialOrder: Category[] = ["engagement", "earrings", "rings", "necklaces", "bracelets", "pendants", "wedding-bands"];
