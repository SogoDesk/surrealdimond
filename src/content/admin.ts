/**
 * The admin console's modules and the staff roles (BRD 5.8, section 4). The
 * access matrix is our proposal until Surreal's role-to-page breakdown
 * (C-05) arrives; the console reads it to show or lock each module, and the
 * preview lets you switch role to see the difference. The modules still in
 * design (Memo, Requests and inbox, Content pages, Dealer resources) were
 * taken out of the console (client request, November 2026).
 */

export const ROLES = ["administrator", "finance", "hr", "sales", "manager"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  administrator: "Administrator",
  finance: "Accounts / Finance",
  hr: "HR",
  sales: "Sales",
  manager: "Manager",
};

export const ROLE_LINE: Record<Role, string> = {
  administrator: "Everything, including staff users and roles",
  finance: "Orders, payments and dealer accounts",
  hr: "Staff users",
  sales: "Dealers, inventory and merchandising",
  manager: "Everything except staff users",
};

export type Access = "edit" | "view" | "none";

export type AdminIcon = "overview" | "inventory" | "merch" | "banners" | "promo" | "dealers" | "sync" | "orders" | "staff";

export interface AdminModule {
  id: string;
  label: string;
  line: string;
  href: string;
  icon: AdminIcon;
  access: Record<Role, Access>;
}

const all = (a: Access): Record<Role, Access> => ({ administrator: a, finance: a, hr: a, sales: a, manager: a });

export const adminModules: AdminModule[] = [
  { id: "overview", label: "Overview", line: "The day at a glance", href: "/admin", icon: "overview", access: all("view") },
  {
    id: "inventory",
    label: "Inventory",
    line: "Every piece and stone, with status",
    href: "/admin/inventory",
    icon: "inventory",
    access: { administrator: "edit", finance: "view", hr: "none", sales: "edit", manager: "edit" },
  },
  {
    id: "merchandising",
    label: "Merchandising",
    line: "Hot this week, featured pieces, default sort",
    href: "/admin/merchandising",
    icon: "merch",
    access: { administrator: "edit", finance: "none", hr: "none", sales: "edit", manager: "edit" },
  },
  {
    id: "banners",
    label: "Banners",
    line: "The homepage hero slides",
    href: "/admin/banners",
    icon: "banners",
    access: { administrator: "edit", finance: "none", hr: "none", sales: "view", manager: "edit" },
  },
  {
    id: "promo",
    label: "Pop-up banner",
    line: "Offers and festive messages on the homepage",
    href: "/admin/promo",
    icon: "promo",
    access: { administrator: "edit", finance: "none", hr: "none", sales: "edit", manager: "edit" },
  },
  {
    id: "dealers",
    label: "Dealers",
    line: "Customers, logins and the Excel import",
    href: "/admin/dealers",
    icon: "dealers",
    access: { administrator: "edit", finance: "view", hr: "none", sales: "edit", manager: "edit" },
  },
  {
    id: "sync",
    label: "RightClick sync",
    line: "What the site pulls, how often, and the call budget",
    href: "/admin/sync",
    icon: "sync",
    access: { administrator: "edit", finance: "view", hr: "none", sales: "view", manager: "edit" },
  },
  {
    id: "orders",
    label: "Orders and payments",
    line: "Confirm, ship and deliver orders; collect and post payments",
    href: "/admin/orders",
    icon: "orders",
    access: { administrator: "edit", finance: "edit", hr: "none", sales: "view", manager: "edit" },
  },
  {
    id: "staff",
    label: "Staff and roles",
    line: "Staff users and the access matrix",
    href: "/admin/staff",
    icon: "staff",
    access: { administrator: "edit", finance: "none", hr: "edit", sales: "none", manager: "view" },
  },
];

export const adminModule = (id: string) => adminModules.find((m) => m.id === id);

/** Pages a banner or pop-up can lead to. */
export const SITE_LINKS: { href: string; label: string }[] = [
  { href: "/jewelry", label: "All jewelry" },
  { href: "/jewelry/engagement", label: "Engagement rings" },
  { href: "/jewelry/wedding-bands", label: "Wedding bands" },
  { href: "/jewelry/earrings", label: "Earrings" },
  { href: "/jewelry/necklaces", label: "Necklaces" },
  { href: "/jewelry/pendants", label: "Pendants" },
  { href: "/jewelry/rings", label: "Rings" },
  { href: "/jewelry/bracelets", label: "Bracelets" },
  { href: "/diamonds", label: "Diamond search" },
  { href: "/diamonds/made-to-order", label: "Made to Order" },
  { href: "/custom", label: "Custom Portal" },
  { href: "/contact?type=appointment", label: "Schedule an appointment" },
  { href: "/contact?type=dealer", label: "Become a dealer" },
];
