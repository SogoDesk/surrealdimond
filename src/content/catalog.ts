/**
 * Curated product catalog built from the client's render library.
 * Images live in public/media/renders/<slug>.webp (1200px, white background).
 * Metal variants point at the white gold and yellow gold renders of the same design.
 */

export type Category =
  | "engagement"
  | "wedding-bands"
  | "earrings"
  | "necklaces"
  | "pendants"
  | "rings"
  | "bracelets";

export type Metal = "wg" | "yg" | "rg";

export interface Product {
  id: string;
  name: string;
  category: Category;
  /** Short design descriptor shown under the name */
  detail: string;
  /** Primary image slug */
  image: string;
  /** Alternate views or metal variants */
  variants?: Partial<Record<Metal, string>>;
  angles?: string[];
  /** Turntable video slug in public/media/video (optional) */
  video?: string;
  featured?: boolean;
}

export const renderSrc = (slug: string) => `/media/renders/${slug}.webp`;
export const videoSrc = (slug: string) => ({
  mp4: `/media/video/${slug}.mp4`,
  poster: `/media/video/${slug}.webp`,
});

export const categories: { id: Category; label: string; blurb: string; image: string }[] = [
  { id: "engagement", label: "Engagement Rings", blurb: "Solitaires, halos and three stone settings grown for the question.", image: "le2004w442-11741" },
  { id: "wedding-bands", label: "Wedding Bands", blurb: "Eternity, contour and curved bands that sit flush against the ring.", image: "lgldbd3280-14k-wg" },
  { id: "earrings", label: "Earrings", blurb: "Studs, huggies, hoops and chandeliers in DEF color light.", image: "lgerfa4373-14k-wg" },
  { id: "necklaces", label: "Necklaces", blurb: "Tennis, station and lariat necklaces for every neckline.", image: "nkov18w440wg" },
  { id: "pendants", label: "Pendants", blurb: "Bezels, halos and signature silhouettes on fine chains.", image: "branding-images8025" },
  { id: "rings", label: "Rings", blurb: "Cocktail domes, pave bands and sculptural statements.", image: "ca24ap0006-8905" },
  { id: "bracelets", label: "Bracelets", blurb: "Tennis bracelets and flexible bangles, set stone by stone.", image: "sur17678lgbd70148-14k-wg" },
];

export const products: Product[] = [
  // Engagement
  { id: "oval-halo", name: "Oval Halo", category: "engagement", detail: "Oval center, pave halo and band", image: "le2004w442-11741", angles: ["le2004w442-11742", "le2004w442-11745", "le2004w442-11746"], video: "le2004w442-11771", featured: true },
  { id: "round-halo", name: "Round Halo", category: "engagement", detail: "Round brilliant with a fine halo", image: "le2010w440-1-11750", angles: ["le2010w440-1-11751", "le2010w440-1-11756", "le2010w440-1-11757"], video: "le2010w440-1-11772", featured: true },
  { id: "round-solitaire", name: "Pave Solitaire", category: "engagement", detail: "Round brilliant, pave shoulders", image: "le2001w440-1", angles: ["le2001w440-2"], video: "le2001w440-11770", featured: true },
  { id: "oval-solitaire", name: "Oval Solitaire", category: "engagement", detail: "Elongated oval on a pave band", image: "le2007w442-11724", angles: ["le2007w442-11725", "le2007w442-11682", "le2007w442-11683"], video: "lw2007w442-11769", featured: true },
  { id: "radiant-solitaire", name: "Radiant Solitaire", category: "engagement", detail: "Radiant cut, hidden gallery", image: "lrra04w442-11729", angles: ["lrra04w442-11758"], video: "lrra04w442-11773", featured: true },
  { id: "princess-solitaire", name: "Princess Solitaire", category: "engagement", detail: "Princess cut, cathedral setting", image: "lrra05w442-11731", angles: ["lrra05w442-11732"] },
  { id: "cathedral-solitaire", name: "Cathedral Solitaire", category: "engagement", detail: "Four prong classic", image: "le2003w440-final-11679", angles: ["le2003w440-final-11681"] },
  { id: "oval-cathedral", name: "Oval Cathedral", category: "engagement", detail: "Oval center, cathedral shoulders", image: "le2009w442-11727", angles: ["le2009w442-11728"] },
  { id: "three-stone-round", name: "Three Stone Round", category: "engagement", detail: "Trilogy of round brilliants", image: "lr0001w430wg", variants: { wg: "lr0001w430wg", yg: "lr0001w430yg" }, featured: true },
  { id: "three-stone-emerald", name: "Three Stone Emerald", category: "engagement", detail: "Step cut trilogy", image: "lr0004w431wg", variants: { wg: "lr0004w431wg", yg: "lr0004w431yg" }, featured: true },
  { id: "oval-three-stone", name: "Oval Trilogy", category: "engagement", detail: "Three oval brilliants", image: "sur17678-batch8-95015-oval-3-stoneswg", variants: { wg: "sur17678-batch8-95015-oval-3-stoneswg", yg: "sur17678-batch8-95015-oval-3-stonesyg" } },
  { id: "toi-et-moi-ring", name: "Toi et Moi", category: "engagement", detail: "Pear and emerald cut, side by side", image: "lg-toi-et-moi-ring-wg", variants: { wg: "lg-toi-et-moi-ring-wg", yg: "lg-toi-et-moi-ring-yg" }, featured: true },
  { id: "bridal-set-halo", name: "Halo Bridal Set", category: "engagement", detail: "Engagement ring with matching band", image: "lgbrdl2665-eng-wg-lgbrdl2665-band-wg" },
  { id: "bridal-set-pear", name: "Pear Bridal Set", category: "engagement", detail: "Pear halo with contour band", image: "sur17678-batch7-grp2-lgbdrdl2690" },

  // Wedding bands
  { id: "eternity-band", name: "Eternity Band", category: "wedding-bands", detail: "Shared prong, full circle", image: "lgldbd3280-14k-wg", featured: true },
  { id: "eternity-band-1ct", name: "Eternity Band, one carat", category: "wedding-bands", detail: "Shared prong, one carat total", image: "lgldbd3306-1ct-wg" },
  { id: "contour-band", name: "Contour Band", category: "wedding-bands", detail: "Curved to sit against a halo", image: "lw2007w442-11737", angles: ["lw2007w442-11738"] },
  { id: "curved-band", name: "Curved Band", category: "wedding-bands", detail: "Soft wave of pave", image: "lw2009w442-11739", angles: ["lw2009w442-11740"] },
  { id: "chevron-band", name: "Chevron Band", category: "wedding-bands", detail: "Pointed contour", image: "lw2001w440-11733", angles: ["lw2001w440-11734"] },
  { id: "five-stone-band", name: "Five Stone Band", category: "wedding-bands", detail: "Round brilliants, shared prong", image: "lr0010w430wg", variants: { wg: "lr0010w430wg", yg: "lr0010w430yg" }, featured: true },
  { id: "oval-five-stone", name: "Oval Five Stone", category: "wedding-bands", detail: "Five ovals, east west", image: "lrov50w431wg", variants: { wg: "lrov50w431wg", yg: "lrov50w431yg" } },
  { id: "twin-row-band", name: "Twin Row Band", category: "wedding-bands", detail: "Two rows of pave", image: "ca24mr0021-8784", variants: { wg: "ca24mr0021-8784", yg: "ca24mr0021-8786" } },
  { id: "classic-pave-band", name: "Classic Pave Band", category: "wedding-bands", detail: "Single row, low profile", image: "ca24mr0022-8790", variants: { wg: "ca24mr0022-8790", yg: "ca24mr0022-8791" } },

  // Earrings
  { id: "arch-drops", name: "Arch Drops", category: "earrings", detail: "Graduated round brilliants", image: "lgerfa4373-14k-wg", featured: true },
  { id: "line-drops", name: "Line Drops", category: "earrings", detail: "Slender diamond lines", image: "lgerfa4355-14k-wg" },
  { id: "emerald-halo-studs", name: "Emerald Halo Studs", category: "earrings", detail: "Emerald cut, pave halo", image: "lgerfa4415-em-wg" },
  { id: "oval-halo-studs", name: "Oval Halo Studs", category: "earrings", detail: "Oval cut, pave halo", image: "lgerfa4418-ov-wg" },
  { id: "princess-studs", name: "Princess Studs", category: "earrings", detail: "Four prong princess cut", image: "lgerstpc150-bsf-wg" },
  { id: "inside-out-hoops", name: "Inside Out Hoops", category: "earrings", detail: "Pave on both faces", image: "in-and-out-hoops-wg", variants: { wg: "in-and-out-hoops-wg", yg: "in-and-out-hoops-yg" }, featured: true },
  { id: "tapered-hoops", name: "Tapered Pave Hoops", category: "earrings", detail: "Sculpted, wide to narrow", image: "ca24ap0009-9116", variants: { wg: "ca24ap0009-9116", yg: "ca24ap0009-9117" } },
  { id: "double-huggies", name: "Double Row Huggies", category: "earrings", detail: "Two rows of pave, hinged", image: "ca24ap0011-8899", variants: { wg: "ca24ap0011-8899", yg: "ca24ap0011-8900" } },
  { id: "sunburst-studs", name: "Sunburst Studs", category: "earrings", detail: "Round center, baguette halo", image: "ca24mr0007-8762", variants: { wg: "ca24mr0007-8762", yg: "ca24mr0007-8761" } },
  { id: "pear-sunburst-studs", name: "Pear Sunburst Studs", category: "earrings", detail: "Pear center, baguette halo", image: "ca24mr0011-8773", variants: { wg: "ca24mr0011-8773", yg: "ca24mr0011-8772" } },
  { id: "pear-halo-drops", name: "Pear Halo Drops", category: "earrings", detail: "Pear drops on round tops", image: "ca24mr0070-9625", variants: { wg: "ca24mr0070-9625", yg: "ca24mr0070-9626" } },
  { id: "teardrop-drops", name: "Teardrop Drops", category: "earrings", detail: "Open pave teardrops", image: "ca24mr0005-8768", variants: { wg: "ca24mr0005-8768", yg: "ca24mr0005-8767" } },
  { id: "marquise-cluster-studs", name: "Marquise Cluster Studs", category: "earrings", detail: "Marquise and pear florets", image: "ca24mr0026-9638", variants: { wg: "ca24mr0026-9638", yg: "ca24mr0026-9637" } },
  { id: "huggie-drops", name: "Huggie Drops", category: "earrings", detail: "Round brilliants on huggies", image: "ilgerfa4422-14k-wg" },
  { id: "mixed-cut-drops", name: "Mixed Cut Drops", category: "earrings", detail: "Pear, emerald and round", image: "lgpd80437-14k-wg" },

  // Necklaces
  { id: "oval-tennis-necklace", name: "Oval Tennis Necklace", category: "necklaces", detail: "Oval brilliants, full circle", image: "nkov18w440wg", variants: { wg: "nkov18w440wg", yg: "nkov18w440yg" }, featured: true },
  { id: "emerald-tennis-necklace", name: "Emerald Tennis Necklace", category: "necklaces", detail: "Step cuts, full circle", image: "nkem18w440wg", variants: { wg: "nkem18w440wg", yg: "nkem18w440yg" } },
  { id: "bezel-tennis-necklace", name: "Bezel Tennis Necklace", category: "necklaces", detail: "Bezel set round brilliants", image: "lgnk70078-bz-wg" },
  { id: "station-necklace", name: "Station Necklace", category: "necklaces", detail: "Bezel stations by the yard", image: "sur17678-batch-7-number-1wg", variants: { wg: "sur17678-batch-7-number-1wg", yg: "sur17678-batch-7-number-2yg" } },
  { id: "emerald-lariat", name: "Emerald Lariat", category: "necklaces", detail: "Y drop with an emerald cut", image: "ca24mr004-9081", variants: { wg: "ca24mr004-9081", yg: "ca24mr004-9082" } },
  { id: "layered-trio", name: "Layered Trio", category: "necklaces", detail: "Two chains, three brilliants", image: "ca24mr0043-9634", variants: { wg: "ca24mr0043-9634", yg: "ca24mr0043-9633" } },
  { id: "pear-station-necklace", name: "Pear Station Necklace", category: "necklaces", detail: "Bezel drops on a fine chain", image: "ca24mr0041-9632", variants: { wg: "ca24mr0041-9632", yg: "ca24mr0041-9631" } },
  { id: "curved-bar", name: "Curved Bar Necklace", category: "necklaces", detail: "Graduated brilliants on a bar", image: "lgpd80479-14k-wg" },

  // Pendants
  { id: "round-bezel-pendant", name: "Round Bezel Pendant", category: "pendants", detail: "Bezel set round brilliant", image: "branding-images8025", featured: true },
  { id: "teardrop-pave-pendant", name: "Teardrop Pave Pendant", category: "pendants", detail: "Open teardrop of pave", image: "branding-images8028", featured: true },
  { id: "pear-bezel-pendant", name: "Pear Bezel Pendant", category: "pendants", detail: "Pear cut in a fine bezel", image: "jbii241sil-2645", variants: { wg: "jbii241sil-2645", yg: "jbii241-2645" } },
  { id: "oval-bezel-pendant", name: "Oval Bezel Pendant", category: "pendants", detail: "Oval cut in a fine bezel", image: "jbii247sil-2638", variants: { wg: "jbii247sil-2638", yg: "jbii247-2638" } },
  { id: "toi-et-moi-pendant", name: "Toi et Moi Pendant", category: "pendants", detail: "Two cuts, one chain", image: "lg-toiet-moi-pendant-wg", variants: { wg: "lg-toiet-moi-pendant-wg", yg: "lg-toiet-moi-pendant-yg" } },
  { id: "circle-pendant", name: "Circle Pendant", category: "pendants", detail: "Pave circle of light", image: "lgpd80503-14k-yg" },
  { id: "pave-cross", name: "Pave Cross", category: "pendants", detail: "Round brilliants, four prong", image: "lgpd80493-14k-wg" },
  { id: "oval-halo-pendant", name: "Oval Halo Pendant", category: "pendants", detail: "Oval center, pave halo", image: "lgpd80496-ov-14k-wg" },
  { id: "emerald-halo-pendant", name: "Emerald Halo Pendant", category: "pendants", detail: "Emerald cut, pave halo", image: "lgpd80499-em-wg" },
  { id: "hexagon-pendant", name: "Hexagon Cluster Pendant", category: "pendants", detail: "Geometric pave cluster", image: "ca24ap0012-8877", variants: { wg: "ca24ap0012-8877", yg: "ca24ap0012-8878" } },
  { id: "kite-pendant", name: "Kite Pendant", category: "pendants", detail: "Open kite silhouette", image: "ca24ap0014-8874", variants: { wg: "ca24ap0014-8874", yg: "ca24ap0014-8873" } },
  { id: "heart-halo-pendant", name: "Heart Halo Pendant", category: "pendants", detail: "Pave heart with a halo", image: "ca24ap0017-8867", variants: { wg: "ca24ap0017-8867", yg: "ca24ap0017-8868" } },
  { id: "sunburst-pendant", name: "Sunburst Pendant", category: "pendants", detail: "Round center, baguette halo", image: "ca24mr0006-8866", variants: { wg: "ca24mr0006-8866", yg: "ca24mr0006-8865" } },
  { id: "bloom-pendant", name: "Bloom Pendant", category: "pendants", detail: "Sculpted petals around a brilliant", image: "ca24mr0090-9644", variants: { wg: "ca24mr0090-9644", yg: "ca24mr0090-9643" } },

  // Rings
  { id: "bypass-pave-ring", name: "Bypass Pave Ring", category: "rings", detail: "Crossing rows of pave", image: "branding-images8022", featured: true },
  { id: "wave-dome", name: "Wave Dome", category: "rings", detail: "Sculpted pave dome", image: "ca24ap0006-8905", variants: { wg: "ca24ap0006-8905", yg: "ca24ap0006-8906" }, featured: true },
  { id: "pave-cigar-band", name: "Pave Cigar Band", category: "rings", detail: "Five rows, full pave", image: "ca24ap0006-8904", variants: { wg: "ca24ap0006-8904", yg: "ca24ap0006-8903" } },
  { id: "scatter-band", name: "Scatter Band", category: "rings", detail: "Scattered brilliants on a dome", image: "ca24ap0002-8918", variants: { wg: "ca24ap0002-8918", yg: "ca24ap0002-8917" } },
  { id: "petal-cuff", name: "Petal Cuff", category: "rings", detail: "Concave cuff with clusters", image: "ca24ap0004-8907", variants: { wg: "ca24ap0004-8907", yg: "ca24ap0004-8908" } },
  { id: "channel-band", name: "Channel Band", category: "rings", detail: "Channel set, polished edges", image: "ca24ap0001-8919", variants: { wg: "ca24ap0001-8919", yg: "ca24ap0001-8920" } },
  { id: "ridged-band", name: "Ridged Band", category: "rings", detail: "Fluted gold with a pave row", image: "ca24mr0020-8780", variants: { wg: "ca24mr0020-8780", yg: "ca24mr0020-8781" } },
  { id: "oval-cluster-ring", name: "Oval Cluster Ring", category: "rings", detail: "Pave cluster on a pave shank", image: "ca24ap0005-9100", variants: { wg: "ca24ap0005-9100", yg: "ca24ap0005-9099" } },
  { id: "halo-station-band", name: "Halo Station Band", category: "rings", detail: "Three halos in a row", image: "ca24mr0019-8779", variants: { wg: "ca24mr0019-8779", yg: "ca24mr0019-8777" } },
  { id: "cluster-dome", name: "Cluster Dome", category: "rings", detail: "Bold dome of brilliants", image: "jbii135" },
  { id: "mens-emerald-signet", name: "Emerald Signet", category: "rings", detail: "Bezel set emerald cut, for him", image: "lggtfa10157-14k-wg" },

  // Bracelets
  { id: "tennis-bracelet", name: "Tennis Bracelet", category: "bracelets", detail: "Four prong round brilliants", image: "sur17678lgbd70148-14k-wg", variants: { wg: "sur17678lgbd70148-14k-wg", yg: "sur17678lgbd70148-14k-yg-fn13" }, featured: true },
  { id: "emerald-tennis-bracelet", name: "Emerald Tennis Bracelet", category: "bracelets", detail: "Step cuts, east west", image: "lgbd70166-em-14k-wg", variants: { wg: "lgbd70166-em-14k-wg", yg: "lgbd70166-em-14k-yg" } },
  { id: "oval-tennis-bracelet", name: "Oval Tennis Bracelet", category: "bracelets", detail: "Oval brilliants, shared prong", image: "lgbd70167-ov-14k-wg", variants: { wg: "lgbd70167-ov-14k-wg", yg: "lgbd70167-ov-14k-yg" } },
  { id: "bezel-tennis-bracelet", name: "Bezel Tennis Bracelet", category: "bracelets", detail: "Bezel set round brilliants", image: "lgbd70162-bz-wg" },
  { id: "flexi-bangle", name: "Flexi Bangle", category: "bracelets", detail: "Flexible tennis bangle", image: "flexi-bangle-1", variants: { wg: "flexi-bangle-1", yg: "flexi-bangle-4", rg: "flexi-bangle-3" }, featured: true },
  { id: "pave-bangle", name: "Pave Bangle", category: "bracelets", detail: "Hinged, three rows of pave", image: "ca24ap0009-9113", variants: { wg: "ca24ap0009-9113", yg: "ca24ap0009-9114" } },
  { id: "lace-bangle", name: "Lace Bangle", category: "bracelets", detail: "Openwork pave, hinged", image: "ca24mr007-9157", variants: { wg: "ca24mr007-9157", yg: "ca24mr007-9156" } },
  { id: "oval-accent-tennis", name: "Oval Accent Tennis", category: "bracelets", detail: "Round line with an oval center", image: "ca24mr0083-2725" },
  { id: "emerald-accent-tennis", name: "Emerald Accent Tennis", category: "bracelets", detail: "Round line with an emerald center", image: "ca24mr0085-2926" },
];

export const featured = products.filter((p) => p.featured);
export const byCategory = (c: Category) => products.filter((p) => p.category === c);
export const productById = (id: string) => products.find((p) => p.id === id);
