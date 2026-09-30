"use server";

/**
 * Inquiry submission for the contact page and the contact drawer (BRD R-24).
 * Validates the fields for the chosen type, picks the team from the type
 * (src/content/inquiries.ts), and returns a reference number, or per-field
 * errors for the form to show inline.
 *
 * Email delivery is not wired yet (the provider is chosen in M1, C-14 for the
 * sending domain). From the marked spot below, two emails go out: the
 * inquiry to the team's inbox, and the automatic acknowledgement to the
 * sender with the reference number. Nothing from the form is logged.
 */

import { INQUIRY_TYPES, TEAM_LABEL, inquiryType, CONTACT_METHODS, type InquiryType } from "@/content/inquiries";

export type InquiryField = "type" | "name" | "firstName" | "lastName" | "email" | "phone" | "company" | "method" | "message";

export interface InquiryState {
  ok: boolean;
  /** Set once a submission has been processed, whether it passed or failed. */
  submitted?: boolean;
  errors?: Partial<Record<InquiryField, string>>;
  reference?: string;
  team?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function text(formData: FormData, key: string, max: number) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function submitInquiry(_previous: InquiryState, formData: FormData): Promise<InquiryState> {
  // A filled honeypot means a bot; answer as if it worked and drop the payload.
  if (text(formData, "website", 10).length > 0) return { ok: true, submitted: true, reference: "IN-000000", team: TEAM_LABEL.admin };

  const typeRaw = text(formData, "type", 32);
  const type = INQUIRY_TYPES.find((t) => t === typeRaw) as InquiryType | undefined;
  const firstName = text(formData, "firstName", 60);
  const lastName = text(formData, "lastName", 60);
  const single = text(formData, "name", 120);
  const split = formData.has("firstName");
  const email = text(formData, "email", 254);
  const phone = text(formData, "phone", 32);
  const company = text(formData, "company", 160);
  const method = text(formData, "method", 16);
  const message = text(formData, "message", 4000);

  const errors: InquiryState["errors"] = {};
  if (!type) errors.type = "Choose what your inquiry is about.";
  if (split) {
    if (firstName.length < 1) errors.firstName = "Enter your first name.";
    if (lastName.length < 1) errors.lastName = "Enter your last name.";
  } else if (single.length < 2) errors.name = "Please tell us your name.";
  if (!EMAIL_PATTERN.test(email)) errors.email = "Enter an email address we can reply to.";
  const digits = phone.replace(/\D/g, "").length;
  if (phone && digits < 10) errors.phone = "Enter a ten digit phone number.";
  if (type === "appointment" && split) {
    if (!CONTACT_METHODS.some((m) => m === method)) errors.method = "Choose how we should reach you.";
    else if (method !== "Email" && digits < 10) errors.phone = "Enter a phone number so we can call or text you.";
  }
  if (type === "dealer" && split && company.length < 2) errors.company = "Enter your store or company name.";
  if (message.length < 2) errors.message = "Please add a few words.";

  if (Object.keys(errors).length > 0) return { ok: false, submitted: true, errors };

  const info = inquiryType(type)!;
  const reference = `IN-${String(Date.now()).slice(-6)}`;
  const payload = {
    reference,
    type: info.id,
    team: info.team,
    name: split ? `${firstName} ${lastName}` : single,
    email,
    phone,
    company,
    location: text(formData, "location", 160),
    heard: text(formData, "heard", 160),
    method,
    date: text(formData, "date", 10),
    orderRef: text(formData, "orderRef", 40),
    program: text(formData, "program", 40),
    message,
    receivedAt: new Date().toISOString(),
  };

  // Email delivery: send `payload` to the team inbox for `info.team`, and the acknowledgement (ACK_LINE plus the reference) to `email`.
  void payload;

  return { ok: true, submitted: true, reference, team: TEAM_LABEL[info.team] };
}
