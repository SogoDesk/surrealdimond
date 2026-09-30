/**
 * The admin console's modules and the staff roles (BRD 5.8, section 4). The
 * access matrix is our proposal until Surreal's role-to-page breakdown
 * (C-05) arrives; the console reads it to show or lock each module, and the
 * preview lets you switch role to see the difference. "live" modules work in
 * the preview; "design" ones open a holding page listing what they will hold.
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
  finance: "Orders, payments, memo and dealer accounts",
  hr: "Staff users",
  sales: "Dealers, inventory, merchandising, memo and requests",
  manager: "Everything except staff users",
};

export type Access = "edit" | "view" | "none";

export type AdminIcon = "overview" | "inventory" | "merch" | "banners" | "dealers" | "orders" | "memo" | "requests" | "content" | "marketing" | "staff";

export interface AdminModule {
  id: string;
  label: string;
  line: string;
  href: string;
  icon: AdminIcon;
  status: "live" | "design";
  access: Record<Role, Access>;
  holds?: string[];
}

const all = (a: Access): Record<Role, Access> => ({ administrator: a, finance: a, hr: a, sales: a, manager: a });

export const adminModules: AdminModule[] = [
  { id: "overview", label: "Overview", line: "The day at a glance", href: "/admin", icon: "overview", status: "live", access: all("view") },
  {
    id: "inventory",
    label: "Inventory",
    line: "Every piece and stone, with status",
    href: "/admin/inventory",
    icon: "inventory",
    status: "live",
    access: { administrator: "edit", finance: "view", hr: "none", sales: "edit", manager: "edit" },
  },
  {
    id: "merchandising",
    label: "Merchandising",
    line: "Hot this week, featured pieces, default sort",
    href: "/admin/merchandising",
    icon: "merch",
    status: "live",
    access: { administrator: "edit", finance: "none", hr: "none", sales: "edit", manager: "edit" },
  },
  {
    id: "banners",
    label: "Banners",
    line: "The homepage hero slides",
    href: "/admin/banners",
    icon: "banners",
    status: "live",
    access: { administrator: "edit", finance: "none", hr: "none", sales: "view", manager: "edit" },
  },
  {
    id: "dealers",
    label: "Dealers",
    line: "Stores, users, pricing groups, territories",
    href: "/admin/dealers",
    icon: "dealers",
    status: "design",
    access: { administrator: "edit", finance: "view", hr: "none", sales: "edit", manager: "edit" },
    holds: ["Dealer applications and approval", "Stores and their authorized users", "Pricing groups and territories", "Imported from the current site's dealer organizations and users (C-13)"],
  },
  {
    id: "orders",
    label: "Orders and payments",
    line: "Orders, card, ACH and wire payments",
    href: "/admin/orders",
    icon: "orders",
    status: "design",
    access: { administrator: "edit", finance: "edit", hr: "none", sales: "view", manager: "edit" },
    holds: ["Every dealer order with its lines, status and payment", "Card, ACH and wire payments through Surreal's processor (C-10)", "Status updates that dealers see on their Orders page"],
  },
  {
    id: "memo",
    label: "Memo",
    line: "Memo lines and dealer reconciliations",
    href: "/admin/memo",
    icon: "memo",
    status: "design",
    access: { administrator: "edit", finance: "edit", hr: "none", sales: "edit", manager: "edit" },
    holds: ["Memo lines per dealer from RightClick (C-07), with daily prices", "Dealer reconciliations: items reported sold, confirmations and discrepancy notes", "Memo requests from the diamond page"],
  },
  {
    id: "requests",
    label: "Requests and inbox",
    line: "M2O, Custom, Legacy and inquiries",
    href: "/admin/requests",
    icon: "requests",
    status: "design",
    access: { administrator: "edit", finance: "view", hr: "none", sales: "edit", manager: "edit" },
    holds: ["Made to Order, Custom and Legacy requests with their numbers", "Inquiries by type and team, and appointment requests", "Replies and status back to the dealer"],
  },
  {
    id: "content",
    label: "Content pages",
    line: "Legacy, Main Door, About and more",
    href: "/admin/content",
    icon: "content",
    status: "design",
    access: { administrator: "edit", finance: "none", hr: "none", sales: "view", manager: "edit" },
    holds: ["Short content pages edited without a developer (R-20): Legacy, Main Door, About and Company History", "Images and copy from Surreal (C-11)"],
  },
  {
    id: "marketing",
    label: "Dealer resources",
    line: "Marketing, catalogs, training, policies",
    href: "/admin/marketing",
    icon: "marketing",
    status: "design",
    access: { administrator: "edit", finance: "none", hr: "none", sales: "edit", manager: "edit" },
    holds: ["The files and videos behind the dashboard's Grow your store sections", "Catalog and flyer programs, social content, Surreal University, website feeds, SPIF"],
  },
  {
    id: "staff",
    label: "Staff and roles",
    line: "Staff users and the access matrix",
    href: "/admin/staff",
    icon: "staff",
    status: "live",
    access: { administrator: "edit", finance: "none", hr: "edit", sales: "none", manager: "view" },
  },
];

export const adminModule = (id: string) => adminModules.find((m) => m.id === id);
export const adminHolding = adminModules.filter((m) => m.status === "design");
