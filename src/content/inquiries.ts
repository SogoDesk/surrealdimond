/**
 * Inquiry types for the contact page and the contact drawer (BRD R-24). Each
 * type routes to one team, so an inquiry reaches the right person; the teams
 * are the staff roles in the BRD (Sales, Accounts / Finance, Manager,
 * Administrator). The mapping is our proposal until Surreal's role-to-page
 * breakdown (C-05) confirms who answers what; the admin console will own it.
 * The live site's three forms (Contact Us, Schedule an Appointment, We Want
 * to Hear From You) fold into these types.
 */

export const INQUIRY_TYPES = ["dealer", "appointment", "order", "programs", "account", "feedback", "other"] as const;
export type InquiryType = (typeof INQUIRY_TYPES)[number];

export type InquiryTeam = "sales" | "finance" | "manager" | "admin";

export const TEAM_LABEL: Record<InquiryTeam, string> = {
  sales: "Sales",
  finance: "Accounts and finance",
  manager: "Management",
  admin: "Administrator",
};

export interface InquiryTypeInfo {
  id: InquiryType;
  label: string;
  line: string;
  team: InquiryTeam;
  /** The message box label for this type. */
  prompt: string;
}

export const inquiryTypes: InquiryTypeInfo[] = [
  { id: "dealer", label: "Become a dealer", line: "Carry Surreal in your market", team: "sales", prompt: "Tell us about your store" },
  { id: "appointment", label: "Schedule an appointment", line: "Meet us at 551 Fifth Avenue", team: "sales", prompt: "What can we help you with?" },
  { id: "order", label: "Orders, memo or delivery", line: "An order or memo in progress", team: "sales", prompt: "How can we help with it?" },
  { id: "programs", label: "Made to Order, Legacy or Custom", line: "Questions about a program", team: "sales", prompt: "Your question" },
  { id: "account", label: "Account, billing or payments", line: "Your dealer account", team: "finance", prompt: "How can we help?" },
  { id: "feedback", label: "We want to hear from you", line: "Our products and service", team: "manager", prompt: "Tell us how you feel about our products and services" },
  { id: "other", label: "Something else", line: "Anything not listed", team: "admin", prompt: "Message" },
];

export const inquiryType = (id: string | null | undefined): InquiryTypeInfo | undefined => inquiryTypes.find((t) => t.id === id);

export const CONTACT_METHODS = ["Email", "Phone", "Text/SMS"] as const;
export const PROGRAMS = ["Made to Order", "Diamond Legacy", "Custom"] as const;

/** The live site's thank-you line, reused in the acknowledgement. */
export const ACK_LINE = "Thank you for your submission. One of our experienced team members will be in touch with you shortly.";
