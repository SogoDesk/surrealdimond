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

export const nav = [
  { label: "Diamonds", href: "/diamonds" },
  { label: "Jewelry", href: "/jewelry" },
  { label: "Engagement", href: "/jewelry/engagement" },
  { label: "Made to Order", href: "/made-to-order" },
  { label: "Legacy", href: "/legacy" },
  { label: "Custom", href: "/custom" },
  { label: "Education", href: "/education" },
  { label: "Company", href: "/company" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "Engagement Rings", href: "/jewelry/engagement" },
      { label: "Wedding Bands", href: "/jewelry/wedding-bands" },
      { label: "Earrings", href: "/jewelry/earrings" },
      { label: "Necklaces", href: "/jewelry/necklaces" },
      { label: "Pendants", href: "/jewelry/pendants" },
      { label: "Rings", href: "/jewelry/rings" },
      { label: "Bracelets", href: "/jewelry/bracelets" },
      { label: "Sterling Silver", href: "/jewelry/sterling-silver" },
      { label: "Loose Diamonds", href: "/diamonds" },
    ],
  },
  {
    title: "Surreal",
    links: [
      { label: "Made to Order Diamonds", href: "/made-to-order" },
      { label: "Diamond Legacy", href: "/legacy" },
      { label: "Custom Jewelry", href: "/custom" },
      { label: "Our Company", href: "/company" },
      { label: "Our Team", href: "/company/team" },
      { label: "Journal", href: "/journal" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Why CVD Lab Grown", href: "/education/why-cvd" },
      { label: "History of Lab Grown Diamonds", href: "/education/history" },
      { label: "Diamond Guide", href: "/education/diamond-guide" },
      { label: "Frequently Asked Questions", href: "/education/faq" },
    ],
  },
  {
    title: "Trade",
    links: [
      { label: "Retailer Dashboard", href: "/dashboard" },
      { label: "Become a Retailer", href: "/contact?topic=retail" },
      { label: "Contact", href: "/contact" },
    ],
  },
] as const;

export const legal = [
  { label: "Terms and Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
] as const;
