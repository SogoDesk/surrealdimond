"use server";

/**
 * Contact drawer submission (DESIGN.md, section 11, "Book a visit" and
 * "Contact us"). Validates the four fields and returns either { ok: true } or
 * per-field errors so the drawer can show them inline.
 *
 * Email delivery is not wired yet. When the client confirms their provider
 * (transactional email, CRM or a shared inbox), send the validated payload
 * from the marked spot below. Until then the action only validates and
 * reports success so the drawer can show its thank-you line. Nothing from the
 * form is logged.
 */

export type ContactTopic = "engagement" | "made-to-order" | "legacy" | "custom" | "trade" | "other";
export type ContactIntent = "visit" | "contact";
export type ContactField = "name" | "email" | "topic" | "message";

export interface ContactState {
  ok: boolean;
  /** Set once a submission has been processed, whether it passed or failed. */
  submitted?: boolean;
  errors?: Partial<Record<ContactField, string>>;
}

/* Mirrors CONTACT_TOPICS in src/components/chrome/ContactDrawer.tsx. A "use server" module may only export async functions, so the list lives in both places. */
const TOPICS: readonly ContactTopic[] = ["engagement", "made-to-order", "legacy", "custom", "trade", "other"];
const INTENTS: readonly ContactIntent[] = ["visit", "contact"];

const NAME_MAX = 120;
const EMAIL_MAX = 254;
const MESSAGE_MAX = 4000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function text(formData: FormData, key: string, max: number) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function submitContact(_previous: ContactState, formData: FormData): Promise<ContactState> {
  // A filled honeypot means a bot; answer as if it worked and drop the payload.
  if (text(formData, "company", 10).length > 0) return { ok: true, submitted: true };

  const name = text(formData, "name", NAME_MAX);
  const email = text(formData, "email", EMAIL_MAX);
  const topicRaw = text(formData, "topic", 32);
  const message = text(formData, "message", MESSAGE_MAX);
  const intentRaw = text(formData, "intent", 16);

  const errors: ContactState["errors"] = {};
  if (name.length < 2) errors.name = "Please tell us your name.";
  if (!EMAIL_PATTERN.test(email)) errors.email = "Please enter an email address we can reply to.";
  const topic = TOPICS.find((t) => t === topicRaw);
  if (!topic) errors.topic = "Please choose what brings you in.";
  if (message.length < 2) errors.message = "Please add a few words.";

  if (Object.keys(errors).length > 0) return { ok: false, submitted: true, errors };

  const intent: ContactIntent = INTENTS.find((i) => i === intentRaw) ?? "contact";
  const payload = { name, email, topic: topic as ContactTopic, message, intent, receivedAt: new Date().toISOString() };

  // Email delivery: hand `payload` to the client's provider here.
  void payload;

  return { ok: true, submitted: true };
}
