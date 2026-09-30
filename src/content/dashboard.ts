/**
 * The Retailer Dashboard's sections: the live dashboard's fifteen tiles
 * (docs/CONTEXT.md, "Retailer Dashboard"), regrouped, plus the pages the BRD
 * adds (orders with reorder R-25, trade shows R-26, payment methods R-27,
 * open memo R-28). The final list of about ten subpages is Q5, so "design"
 * sections open a holding page that says what they will hold; "live" ones go
 * to pages that exist today; "next" marks a screen being built next.
 */

export type DashIcon =
  | "home" | "orders" | "memo" | "cart" | "search" | "m2o" | "legacy" | "custom"
  | "marketing" | "catalogs" | "social" | "training" | "website" | "spif"
  | "shows" | "payments" | "team" | "account" | "policies";

export type DashGroup = "Overview" | "Orders and memo" | "Order" | "Grow your store" | "Your account";

export interface DashSection {
  id: string;
  label: string;
  line: string;
  href: string;
  group: DashGroup;
  icon: DashIcon;
  status: "live" | "next" | "design";
  /** What the page will hold, for the holding page (from the live dashboard). */
  holds?: string[];
  /** A door that works today, for the holding page. */
  meanwhile?: { label: string; href: string };
}

export const dashGroups: DashGroup[] = ["Overview", "Orders and memo", "Order", "Grow your store", "Your account"];

export const dashSections: DashSection[] = [
  { id: "home", label: "Dashboard", line: "Your store at a glance", href: "/dashboard", group: "Overview", icon: "home", status: "live" },

  { id: "orders", label: "Orders", line: "Order history and one-click reorder", href: "/dashboard/orders", group: "Orders and memo", icon: "orders", status: "live" },
  { id: "memo", label: "Open memo items", line: "Memo reconciliation, prices updated daily", href: "/dashboard/memo", group: "Orders and memo", icon: "memo", status: "live" },
  { id: "cart", label: "Cart and checkout", line: "Pay by card, ACH or wire", href: "/cart", group: "Orders and memo", icon: "cart", status: "live" },

  { id: "diamonds", label: "Diamond search", line: "Loose stones, one line each", href: "/diamonds", group: "Order", icon: "search", status: "live" },
  { id: "m2o", label: "Made to Order", line: "Grow a stone to your client's size", href: "/diamonds/made-to-order", group: "Order", icon: "m2o", status: "live" },
  {
    id: "legacy",
    label: "Legacy program",
    line: "Legacy diamonds and the order form",
    href: "/legacy",
    group: "Order",
    icon: "legacy",
    status: "design",
  },
  { id: "custom", label: "Custom Portal", line: "A custom design with our CAD team", href: "/custom", group: "Order", icon: "custom", status: "live" },

  {
    id: "marketing",
    label: "Marketing programs",
    line: "Campaigns and brand assets",
    href: "/dashboard/marketing",
    group: "Grow your store",
    icon: "marketing",
    status: "design",
    holds: ["The \"We're a Grower\" campaign video", "Digital brand assets: logo and product images", "Television and video content"],
  },
  {
    id: "catalogs",
    label: "Catalogs and flyers",
    line: "Turn-key mailings by season",
    href: "/dashboard/catalogs",
    group: "Grow your store",
    icon: "catalogs",
    status: "design",
    holds: ["Catalog and flyer programs by year", "Holiday flyer, Christmas catalog and postcards", "How to order a mailing for your store"],
  },
  {
    id: "social",
    label: "Social media",
    line: "Weekly content, published for you",
    href: "/dashboard/social",
    group: "Grow your store",
    icon: "social",
    status: "design",
    holds: ["Weekly auto-published social content through the JewelPost Network", "Free sign-up for your store's accounts"],
  },
  {
    id: "university",
    label: "Surreal University",
    line: "Training videos for your associates",
    href: "/dashboard/university",
    group: "Grow your store",
    icon: "training",
    status: "design",
    holds: ["Seven Steps to Making the Proactive Sale", "Training videos for your sales team"],
  },
  {
    id: "website",
    label: "Website solutions",
    line: "Our diamond feed on your site",
    href: "/dashboard/website",
    group: "Grow your store",
    icon: "website",
    status: "design",
    holds: ["The Surreal diamond feed and catalog on your own website", "Direct feeds for Thinkspace and Punchmark sites, and embeds", "Data and embed request form"],
  },
  {
    id: "spif",
    label: "SPIF program",
    line: "Cash rewards for your associates",
    href: "/dashboard/spif",
    group: "Grow your store",
    icon: "spif",
    status: "design",
    holds: ["Sales incentives on a Jewelry Rewards cash debit card", "Associates register and store managers approve", "Monthly loads on qualifying sales"],
  },

  {
    id: "trade-shows",
    label: "Trade show appointments",
    line: "Meet us at the shows",
    href: "/dashboard/trade-shows",
    group: "Your account",
    icon: "shows",
    status: "design",
    holds: ["Upcoming shows with dates and where to find us", "Book a time to meet the team at a show"],
    meanwhile: { label: "Schedule an appointment", href: "/contact?type=appointment" },
  },
  {
    id: "payments",
    label: "Payment methods",
    line: "Keep your account current",
    href: "/dashboard/payments",
    group: "Your account",
    icon: "payments",
    status: "design",
    holds: ["The payment methods on your account, managed by you", "Check, ACH or wire, credit card and Zelle, to keep the account current", "Invoice payment arrives with the payment portal in a later phase"],
    meanwhile: { label: "Ask about billing", href: "/contact?type=account" },
  },
  {
    id: "team",
    label: "Authorized users",
    line: "Who in your store can order",
    href: "/dashboard/team",
    group: "Your account",
    icon: "team",
    status: "design",
    holds: ["Your store team: name, email, role and permissions", "Add and remove members"],
  },
  {
    id: "account",
    label: "Account settings",
    line: "Name, email, phone and password",
    href: "/dashboard/account",
    group: "Your account",
    icon: "account",
    status: "design",
    holds: ["Full name, email and phone", "Change your password"],
  },
  {
    id: "policies",
    label: "Policies and processes",
    line: "Terms of trade",
    href: "/dashboard/policies",
    group: "Your account",
    icon: "policies",
    status: "design",
    holds: ["The terms and conditions for Surreal dealers", "The processes behind ordering, memo and delivery, as Surreal documents them"],
    meanwhile: { label: "Terms and conditions", href: "/terms" },
  },
];

/** Sections that open the dashboard's holding page at /dashboard/[section]. */
export const holdingSections = dashSections.filter((d) => d.href.startsWith("/dashboard/") && d.status !== "live");
export const dashSection = (id: string) => dashSections.find((d) => d.id === id);
