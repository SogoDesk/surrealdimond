/** Verified brand facts and site-wide content. Nothing here is invented. */

export const brand = {
  name: "Surreal Diamond",
  wordmark: "SURREAL",
  byline: "by JB Bhanderi",
  tagline: "Largest lab diamond grower in the world",
  positioning: "The New Forever",
  claims: {
    color: "DEF color",
    clarity: "VVS clarity",
    process: "CVD grown",
    time: "From 1.5 billion years to just weeks, from inception to final inspection",
    material: "The world's most transparent diamond material",
    ethics: "Environmentally responsible, ethically made, completely identical to a mined diamond",
    craft: "Diamonds grown with extremely high technology, jewelry handcrafted by the finest craftspeople",
    cad: "State of the art CAD department",
    grower: "The largest CVD grower on planet Earth",
    machines: "We manufacture our own CVD machines and created our growing recipe",
    largeStones: "Specializing in larger stones up to 15 carats",
    callStones: "A curated diamond feed of 10,000 to 15,000 call stones",
    tradeOnly: "We will never sell directly to consumers",
    foodChain: "Work with the grower at the top of the food chain",
    mission: "To democratize diamonds, so that they can truly be foreveryone",
  },
  office: {
    label: "North American Office",
    address1: "551 Fifth Avenue, Suite 2601",
    address2: "New York, NY 10176",
    phone: "(844) 999-7262",
    phoneHref: "tel:+18449997262",
    hours: "Monday to Friday, 9:30am to 6pm EST",
    mapHref: "https://maps.google.com/?q=551+Fifth+Ave+Suite+2601+New+York+NY+10176",
  },
  social: {
    instagram: "https://www.instagram.com/",
  },
} as const;

/** Dealer program facts from the live site's Learn More and Apply pages. */
export const dealerBenefits = [
  { id: "pricing", title: "Direct from the grower", line: "Globally competitive direct-from-the-grower pricing.", icon: "pricing" },
  { id: "territory", title: "Exclusive territories", line: "Exclusive dealer territories in your market.", icon: "territory" },
  { id: "memo", title: "Curated memo program", line: "Large scale loose diamond memo, individually curated for your store.", icon: "memo" },
  { id: "memo-pricing", title: "Dynamic memo pricing", line: "Price adjustments on standing memo items, updated daily.", icon: "pricing-live" },
  { id: "replenish", title: "Immediate replenishment", line: "Sold items are replaced right away.", icon: "replenish" },
  { id: "large", title: "Up to 15 carats", line: "Specialists in larger stones.", icon: "large" },
  { id: "call-stones", title: "10,000 to 15,000 call stones", line: "A curated feed of call stones for your counter.", icon: "feed" },
  { id: "marketing", title: "Brand and marketing", line: "Branding, display, marketing and dual tier advertising support.", icon: "marketing" },
  { id: "training", title: "Sales training", line: "Surreal University for your associates.", icon: "training" },
  { id: "spiff", title: "Spiff incentives", line: "Cash rewards for your sales team.", icon: "spiff" },
  { id: "data", title: "Shared sales data", line: "Aggregated results to establish best practices.", icon: "data" },
  { id: "trade-only", title: "Trade only", line: "We will never sell directly to consumers.", icon: "trade" },
] as const;

export const team = [
  { name: "Jitu Surani", role: "Co-Chairman" },
  { name: "Shubham Surani", role: "Chief Executive Officer" },
  { name: "Aaditya Surani", role: "Vice President" },
  { name: "Ruten Bhanderi", role: "Executive Director" },
  { name: "Linda Pike", role: "Director of Customer Experience" },
] as const;

/** Account routes (docs/CONTEXT.md, "Account and commerce pages"). */
export const account = {
  login: "/login",
  apply: "/apply",
  dashboard: "/dashboard",
  cart: "/cart",
  appointment: "/contact?type=appointment",
  search: "/search",
} as const;

/** The Phase 1 page set (docs/CONTEXT.md). */
export const nav = [
  { label: "Jewelry", href: "/jewelry" },
  { label: "Diamonds", href: "/diamonds" },
  { label: "Made to Order", href: "/diamonds/made-to-order" },
  { label: "Legacy", href: "/legacy" },
  { label: "Custom", href: "/custom" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Retailers", href: "/dashboard" },
] as const;

export const footerColumns = [
  {
    title: "Jewelry",
    links: [
      { label: "Engagement Rings", href: "/jewelry/engagement" },
      { label: "Wedding Bands", href: "/jewelry/wedding-bands" },
      { label: "Earrings", href: "/jewelry/earrings" },
      { label: "Necklaces", href: "/jewelry/necklaces" },
      { label: "Pendants", href: "/jewelry/pendants" },
      { label: "Rings", href: "/jewelry/rings" },
      { label: "Bracelets", href: "/jewelry/bracelets" },
      { label: "Sterling Silver", href: "/jewelry/sterling-silver" },
    ],
  },
  {
    title: "Diamonds",
    links: [
      { label: "Diamond Search", href: "/diamonds" },
      { label: "Made to Order", href: "/diamonds/made-to-order" },
      { label: "Diamond Legacy", href: "/legacy" },
    ],
  },
  {
    title: "Surreal",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Company History", href: "/about#history" },
      { label: "Custom Portal", href: "/custom" },
      { label: "Inquiries and Contact", href: "/contact" },
    ],
  },
  {
    title: "Trade",
    links: [
      { label: "Retailer Dashboard", href: "/dashboard" },
      { label: "Become a Retailer", href: "/contact?type=dealer" },
    ],
  },
] as const;

export const legal = [
  { label: "Terms and Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
] as const;
