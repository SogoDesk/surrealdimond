/**
 * Reading a customer list for import (F-E1): an Excel workbook (.xlsx, first
 * sheet) or a CSV, header row first. Columns are matched to our fields by
 * name, with the usual variants ("E-mail", "Customer code", "Store name"),
 * and the admin can change any match. Each row is then checked: new, an
 * update to a customer already on the site (same email), or an error that
 * is skipped. Passwords are never imported; customers set their own from a
 * setup link.
 */

import type { Customer, CustomerRole, ImportRow } from "./customers";

export type FieldId = keyof ImportRow;

export interface Field {
  id: FieldId;
  label: string;
  required?: boolean;
  hint: string;
  synonyms: string[];
}

export const FIELDS: Field[] = [
  { id: "email", label: "Email", required: true, hint: "Their login, one per person", synonyms: ["email", "e-mail", "email address", "e-mail address", "login", "username", "user email"] },
  { id: "company", label: "Company", required: true, hint: "The store's name", synonyms: ["company", "company name", "store", "store name", "business", "business name", "account name", "customer name", "dealer", "retailer", "organization", "organisation"] },
  { id: "account", label: "Account code", hint: "RightClick customer code", synonyms: ["account", "account code", "account number", "account no", "account #", "customer code", "customer id", "customer number", "customer #", "cust code", "cust id", "code", "rightclick id", "rc code"] },
  { id: "contact", label: "Contact name", hint: "The person's full name", synonyms: ["contact", "contact name", "name", "full name", "person", "buyer", "user", "user name", "first and last name"] },
  { id: "phone", label: "Phone", hint: "Optional", synonyms: ["phone", "phone number", "phone #", "telephone", "tel", "mobile", "cell"] },
  { id: "city", label: "City", hint: "Optional", synonyms: ["city", "town"] },
  { id: "state", label: "State", hint: "Optional, two letters", synonyms: ["state", "st", "province", "region"] },
  { id: "role", label: "Role", hint: "Owner or Associate; blank is Owner", synonyms: ["role", "user type", "type", "access", "permission", "permissions", "user role"] },
];

export type Mapping = Record<FieldId, number>;

const clean = (h: string) => h.toLowerCase().replace(/[_.]+/g, " ").replace(/\s+/g, " ").trim();

/** Match each field to a column by header name; -1 when the file has no such column. */
export function autoMatch(headers: string[]): Mapping {
  const taken = new Set<number>();
  const heads = headers.map(clean);
  const out = {} as Mapping;
  for (const f of FIELDS) {
    let at = heads.findIndex((h, i) => !taken.has(i) && f.synonyms.includes(h));
    if (at < 0) at = heads.findIndex((h, i) => !taken.has(i) && h.length > 2 && f.synonyms.some((syn) => syn.length > 3 && h.includes(syn)));
    if (at >= 0) taken.add(at);
    out[f.id] = at;
  }
  return out;
}

/* Reading files */

/** CSV to rows: quoted cells, doubled quotes, commas, semicolons or tabs, CRLF, a leading BOM. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const counts = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length] as const);
  const delim = counts.sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const asText = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
};

export const MAX_ROWS = 5000;

/** Read the first sheet of a workbook, or a CSV, into rows of text; empty rows dropped. */
export async function readTable(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  let rows: unknown[][];
  if (name.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/universal");
    rows = await readSheet(file);
  } else if (name.endsWith(".csv") || name.endsWith(".txt")) {
    rows = parseCsv(await file.text());
  } else {
    throw new Error("Choose an Excel workbook (.xlsx) or a CSV file. Older .xls files: open them in Excel and save as .xlsx first.");
  }
  const text = rows.map((r) => r.map(asText)).filter((r) => r.some(Boolean));
  if (text.length < 2) throw new Error("The file has no customer rows under its header row.");
  if (text.length - 1 > MAX_ROWS) throw new Error(`The file has ${text.length - 1} rows. Import up to ${MAX_ROWS} at a time.`);
  return text;
}

/* Checking rows */

export interface CheckedRow {
  /** The row's line in the file (header is line 1). */
  line: number;
  row: ImportRow;
  status: "new" | "update" | "error";
  issues: string[];
  notes: string[];
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readRole(raw: string): { role: CustomerRole; note?: string } {
  const v = raw.toLowerCase().trim();
  if (!v || /owner|principal|admin|primary|main/.test(v)) return { role: "owner" };
  if (/assoc|staff|sales|buyer|employee|user|secondary/.test(v)) return { role: "associate" };
  return { role: "owner", note: `Role "${raw}" read as Owner` };
}

function readPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : raw;
}

export function checkRows(table: string[][], mapping: Mapping, existing: Customer[]): CheckedRow[] {
  const known = new Map(existing.map((c) => [c.email.toLowerCase(), c]));
  const seen = new Map<string, number>();
  const get = (r: string[], f: FieldId) => (mapping[f] >= 0 ? (r[mapping[f]] ?? "").trim() : "");

  return table.slice(1).map((r, i) => {
    const line = i + 2;
    const issues: string[] = [];
    const notes: string[] = [];
    const email = get(r, "email").toLowerCase();
    const role = readRole(get(r, "role"));
    if (role.note) notes.push(role.note);
    const state = get(r, "state");
    const row: ImportRow = {
      email,
      company: get(r, "company"),
      account: get(r, "account").toUpperCase(),
      contact: get(r, "contact"),
      phone: readPhone(get(r, "phone")),
      city: get(r, "city"),
      state: state.length === 2 ? state.toUpperCase() : state,
      role: role.role,
    };
    const current = known.get(email);
    if (!email) issues.push("No email");
    else if (!EMAIL.test(email)) issues.push(`"${get(r, "email")}" is not an email address`);
    else if (seen.has(email)) issues.push(`Same email as line ${seen.get(email)}`);
    if (!row.company && !current) issues.push("No company");
    if (email && !seen.has(email)) seen.set(email, line);
    if (!row.contact && !current) notes.push("No contact name");
    if (current && current.status === "active") notes.push("Already active: details update, password kept");
    return { line, row, status: issues.length ? "error" : current ? "update" : "new", issues, notes };
  });
}

/** A sample sheet for trying the import in the preview, with the kinds of rows a real export has (headers named the way an export might name them). */
export const SAMPLE_TABLE: string[][] = [
  ["Customer Code", "Store Name", "Contact", "E-mail", "Phone #", "City", "ST", "User Type"],
  ["NRJ-031", "Northridge Jewelers", "Dana Whitfield", "dana@northridgejewelers.example", "6175550123", "Cambridge", "ma", "Owner"],
  ["NRJ-031", "Northridge Jewelers", "Luis Moreno", "luis@northridgejewelers.example", "6175550124", "Cambridge", "MA", "Sales associate"],
  ["CVD-008", "Cedar Valley Diamonds", "Amira Haddad", "amira@cedarvalley.example", "(512) 555-0190", "Austin", "TX", ""],
  ["BLS-115", "Bluestone & Co.", "Kevin O'Neill", "kevin@bluestoneco.example", "303-555-0166", "Denver", "CO", "Owner"],
  ["HFJ-001", "Harbor Fine Jewelers", "Maria Chen", "maria@harborfine.example", "(617) 555-0141", "Boston", "MA", "Owner"],
  ["SLV-220", "Silverline Gems", "Grace Liu", "grace@silverline", "4155550133", "Oakland", "CA", "Owner"],
  ["CVD-008", "Cedar Valley Diamonds", "Ben Carter", "amira@cedarvalley.example", "5125550191", "Austin", "TX", "Associate"],
  ["MPJ-047", "", "Ruth Adler", "ruth@meridianpoint.example", "2065550152", "Seattle", "WA", "Manager"],
];
