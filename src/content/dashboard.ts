/**
 * The Retailer Dashboard's sections. The live dashboard had fifteen tiles
 * (docs/CONTEXT.md, "Retailer Dashboard"); after the client's feedback of 27
 * October 2026 the dashboard keeps what dealers use day to day and puts the
 * account first: billing (invoices, payments, statement, reconciliation; the
 * Phase 2 payment portal brought forward), orders and memo, ordering, and the
 * dealer's own account. The marketing, catalog, social, training, website,
 * SPIF, authorized users and policies tiles are out of the navigation until
 * Surreal asks for them back (Q5); their notes stay in docs/CONTEXT.md.
 *
 * billing: shown to the store's account owner only, not to associates.
 */

export type DashIcon =
  | "home" | "orders" | "memo" | "cart" | "search" | "m2o" | "legacy" | "custom"
  | "invoices" | "shows" | "payments" | "account";

export type DashGroup = "Overview" | "Billing" | "Orders and memo" | "Order" | "Your account";

export interface DashSection {
  id: string;
  label: string;
  line: string;
  href: string;
  group: DashGroup;
  icon: DashIcon;
  /** Opens outside the site (the existing custom order portal). */
  external?: boolean;
  /** Billing pages: the account owner sees them; associates do not. */
  billing?: boolean;
  /** Marked New in the navigation. */
  fresh?: boolean;
}

export const dashGroups: DashGroup[] = ["Overview", "Billing", "Orders and memo", "Order", "Your account"];

/** The existing custom order portal on Surreal's current site (F-C4); confirm the address with Surreal before launch. */
export const CUSTOM_PORTAL_URL = "https://surrealdiamond.com/custom-orders/";

export const dashSections: DashSection[] = [
  { id: "home", label: "Dashboard", line: "Your store at a glance", href: "/dashboard", group: "Overview", icon: "home" },

  { id: "invoices", label: "Invoices and payments", line: "Open invoices, payments and your statement", href: "/dashboard/invoices", group: "Billing", icon: "invoices", billing: true, fresh: true },
  { id: "reconcile", label: "Reconciliation", line: "Confirm your balance or flag a difference", href: "/dashboard/invoices?tab=reconcile", group: "Billing", icon: "memo", billing: true },
  { id: "payments", label: "Payment methods", line: "Cards and bank accounts on file", href: "/dashboard/payments", group: "Billing", icon: "payments", billing: true },

  { id: "orders", label: "Orders", line: "Order history and one-click reorder", href: "/dashboard/orders", group: "Orders and memo", icon: "orders" },
  { id: "memo", label: "Open memo items", line: "Memo reconciliation, prices updated daily", href: "/dashboard/memo", group: "Orders and memo", icon: "memo" },
  { id: "cart", label: "Cart and checkout", line: "Pay by card, ACH or wire", href: "/cart", group: "Orders and memo", icon: "cart" },

  { id: "diamonds", label: "Diamond search", line: "Loose stones, one line each", href: "/diamonds", group: "Order", icon: "search" },
  { id: "m2o", label: "Made to Order", line: "Grow a stone to your client's size", href: "/diamonds/made-to-order", group: "Order", icon: "m2o" },
  { id: "legacy", label: "Diamond Legacy", line: "Diamonds grown from the same seed line", href: "/legacy", group: "Order", icon: "legacy" },
  { id: "custom", label: "Custom jewelry", line: "The custom order portal", href: CUSTOM_PORTAL_URL, group: "Order", icon: "custom", external: true },

  { id: "trade-shows", label: "Trade show appointments", line: "Meet us at the shows", href: "/dashboard/trade-shows", group: "Your account", icon: "shows" },
  { id: "account", label: "Account settings", line: "Your details and password", href: "/dashboard/account", group: "Your account", icon: "account" },
];

export const dashSection = (id: string) => dashSections.find((d) => d.id === id);
