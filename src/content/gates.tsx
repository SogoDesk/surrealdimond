import type { GatePageProps } from "@/components/pages/GatePage";

/** Holding pages until each route's build lands (docs/TASKS.md). Copy stays inside the verified facts. */
export const gates = {
  orderForm: {
    kind: "dealer",
    eyebrow: "Jewelry order form",
    title: <>Order by <em>style number</em></>,
    line: "Key the pieces your store needs straight into one order. The order form is open to Surreal dealers.",
    crumbs: [{ label: "Jewelry", href: "/jewelry" }, { label: "Order form" }],
    image: "/media/photos/sb-3730.webp",
  },
  cart: {
    kind: "dealer",
    eyebrow: "Your order",
    title: <>Your cart is <em>waiting</em></>,
    line: "Log in to fill your cart, check out and pay for your store. Order before 4:00pm EST to receive next day delivery.",
    crumbs: [{ label: "Cart" }],
    image: "/media/photos/sb-3614.webp",
  },
  search: {
    kind: "dealer",
    eyebrow: "Search",
    title: <>Search the <em>catalog</em></>,
    line: "Search results show dealer pricing and availability, so they open once you log in.",
    crumbs: [{ label: "Search" }],
    image: "/media/photos/sb-3605.webp",
  },
  apply: {
    kind: "building",
    eyebrow: "Apply for an account",
    title: <>Become a <em>Surreal dealer</em></>,
    line: "Globally competitive direct-from-the-grower pricing, comprehensive brand strategy, digital marketing support and territory exclusivity. The application form is in design.",
    crumbs: [{ label: "Apply" }],
    image: "/media/photos/sb-3591.webp",
  },
  terms: {
    kind: "building",
    eyebrow: "Policies",
    title: <>Terms and <em>conditions</em></>,
    line: "The terms and conditions move over from the current site with the next release.",
    crumbs: [{ label: "Terms and Conditions" }],
    image: "/media/photos/sb-3440.webp",
  },
  privacy: {
    kind: "building",
    eyebrow: "Policies",
    title: <>Privacy <em>policy</em></>,
    line: "The privacy policy moves over from the current site with the next release.",
    crumbs: [{ label: "Privacy Policy" }],
    image: "/media/photos/sb-3440.webp",
  },
} satisfies Record<string, GatePageProps>;
