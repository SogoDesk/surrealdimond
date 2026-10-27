/**
 * Dummy accounts for role-based testing before any live customer data is
 * migrated (F-E3, docs/TESTING.md). PREVIEW ONLY: the stores, people and
 * emails are invented (every address uses the reserved .example domain), and
 * the password below is a test value that unlocks nothing outside this
 * preview. Remove this file, and the seeding in src/lib/customers.ts, before
 * real accounts go live.
 */

import type { Role } from "./admin";

/** The test password for the active dummy dealer accounts. */
export const TEST_DEALER_PASSWORD = "Surreal-Preview-2026";

export interface TestDealer {
  account: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  role: "owner" | "associate";
  /** active: has a password · invited: setup link sent, not used · not-invited: imported only. */
  status: "active" | "invited" | "not-invited";
  purpose: string;
}

export const TEST_DEALERS: TestDealer[] = [
  { account: "HFJ-001", company: "Harbor Fine Jewelers", contact: "Maria Chen", email: "maria@harborfine.example", phone: "(212) 555-0141", city: "Boston", state: "MA", role: "owner", status: "active", purpose: "Store owner: orders, billing, payment methods" },
  { account: "HFJ-001", company: "Harbor Fine Jewelers", contact: "Sam Ortiz", email: "sam@harborfine.example", phone: "(212) 555-0142", city: "Boston", state: "MA", role: "associate", status: "active", purpose: "Associate: orders and memo, no billing" },
  { account: "LDC-014", company: "Lakeside Diamond Co.", contact: "Priya Shah", email: "priya@lakesidediamond.example", phone: "(312) 555-0177", city: "Chicago", state: "IL", role: "owner", status: "invited", purpose: "Migrated customer with a setup link waiting" },
  { account: "WGJ-022", company: "Westgate Jewelers", contact: "Tom Becker", email: "tom@westgatejewelers.example", phone: "(415) 555-0108", city: "San Francisco", state: "CA", role: "owner", status: "not-invited", purpose: "Imported customer, not yet invited" },
];

export interface TestStaff {
  name: string;
  email: string;
  role: Role;
}

/** One named dummy login per console role (Q10: one login per person). */
export const TEST_STAFF: TestStaff[] = [
  { name: "Alex Rivera", email: "alex.admin@surreal.example", role: "administrator" },
  { name: "Jordan Lee", email: "jordan.finance@surreal.example", role: "finance" },
  { name: "Casey Morgan", email: "casey.hr@surreal.example", role: "hr" },
  { name: "Riley Brooks", email: "riley.sales@surreal.example", role: "sales" },
  { name: "Taylor Kim", email: "taylor.manager@surreal.example", role: "manager" },
];
