"use client";

/**
 * Dealers (F-E1): the dealer customers who log in to the storefront, and the
 * move of existing customers onto the new site.
 *
 * - Customers: every login with its store, RightClick account code, role and
 *   where it stands (not invited, setup link sent, active). Search, status
 *   filter, CSV. Per customer: send (or resend) a setup link, or remove.
 * - Import customers: an Excel workbook or CSV from the current site or
 *   RightClick, in four steps: upload, match columns, check every row (new,
 *   update, or an error that is skipped), done. New customers can be sent
 *   their setup links at the end. A template workbook is offered.
 *
 * Setup links are emailed by the email service (C-14) once it is connected;
 * in the preview the links are listed here instead. Administrator, Sales and
 * Manager edit; Finance views; HR has no access.
 */

import { useMemo, useRef, useState, type DragEvent } from "react";
import { ROLE_LABEL } from "@/content/admin";
import { downloadCsv } from "@/lib/csv";
import { FIELDS, SAMPLE_TABLE, autoMatch, checkRows, readTable, type CheckedRow, type Mapping } from "@/lib/customerImport";
import { INVITE_HOURS, createSetupLink, importCustomers, logImport, removeCustomer, useCustomers, useImportLog, type Customer, type CustomerStatus } from "@/lib/customers";
import { useStaff } from "@/lib/staff";
import { useAdminAccess } from "./AdminShell";
import s from "./admin.module.css";

const STATUS_LABEL: Record<CustomerStatus, string> = { "not-invited": "Not invited", invited: "Setup link sent", active: "Active" };
const ROW_LABEL: Record<CheckedRow["status"], string> = { new: "New", update: "Update", error: "Skipped" };
const TEMPLATE = "/templates/surreal-dealer-import.xlsx";

const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

interface SentLink {
  name: string;
  email: string;
  url: string;
}

function LinkList({ links, onClose }: { links: SentLink[]; onClose: () => void }) {
  const [copied, setCopied] = useState("");
  const full = (url: string) => (typeof window === "undefined" ? url : `${window.location.origin}${url}`);
  return (
    <section className={s.linkBox} aria-labelledby="links-title" role="status">
      <div className={s.cardHead}>
        <div>
          <h2 id="links-title" className={s.cardTitle}>
            {links.length === 1 ? "Setup link created" : `${links.length} setup links created`}
          </h2>
          <p className={s.muted}>
            Preview: emails are not sent yet, so the links are listed here. Each works once and expires in {INVITE_HOURS} hours. Opening one in this browser signs you in as that dealer.
          </p>
        </div>
        <button type="button" className={s.textBtn} onClick={onClose}>
          Close
        </button>
      </div>
      <ul className={s.linkList}>
        {links.map((l) => (
          <li key={l.email}>
            <span>
              <strong>{l.name}</strong>
              <span className={s.muted}>{l.email}</span>
            </span>
            <span className={s.cardTools}>
              <button
                type="button"
                className={s.textBtn}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(full(l.url));
                    setCopied(l.email);
                  } catch {
                    setCopied("");
                  }
                }}
              >
                {copied === l.email ? "Copied" : "Copy link"}
              </button>
              <a href={l.url} className={s.textBtn} target="_blank" rel="noreferrer">
                Open
              </a>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* Import wizard */

type Step = "upload" | "match" | "check" | "done";
const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "match", label: "Match columns" },
  { id: "check", label: "Check rows" },
  { id: "done", label: "Done" },
];

function ImportWizard({ existing, by, onClose, onLinks }: { existing: Customer[]; by: string; onClose: () => void; onLinks: (l: SentLink[]) => void }) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState("");
  const [table, setTable] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [over, setOver] = useState(false);
  const [filter, setFilter] = useState<"all" | CheckedRow["status"]>("all");
  const [invite, setInvite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ added: number; updated: number; skipped: number; invited: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => (mapping ? checkRows(table, mapping, existing) : []), [table, mapping, existing]);
  const counts = { new: rows.filter((r) => r.status === "new").length, update: rows.filter((r) => r.status === "update").length, error: rows.filter((r) => r.status === "error").length };
  const missing = mapping ? FIELDS.filter((f) => f.required && mapping[f.id] < 0) : [];

  const load = (name: string, t: string[][]) => {
    setFile(name);
    setTable(t);
    setMapping(autoMatch(t[0]));
    setError("");
    setStep("match");
  };

  const read = async (f: File | undefined) => {
    if (!f) return;
    setReading(true);
    try {
      load(f.name, await readTable(f));
    } catch (e) {
      setError(e instanceof Error ? e.message : "The file could not be read.");
    } finally {
      setReading(false);
      if (input.current) input.current.value = "";
    }
  };

  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void read(e.dataTransfer.files[0]);
  };

  const run = async () => {
    setBusy(true);
    const good = rows.filter((r) => r.status !== "error");
    const { added, updated } = importCustomers(good.map((r) => r.row));
    const links: SentLink[] = [];
    if (invite && added.length) {
      for (const c of added) links.push({ name: `${c.contact || c.email}, ${c.company}`, email: c.email, url: (await createSetupLink(c.id)).url });
    }
    logImport({ by, file, added: added.length, updated, skipped: counts.error });
    setResult({ added: added.length, updated, skipped: counts.error, invited: links.length });
    if (links.length) onLinks(links);
    setBusy(false);
    setStep("done");
  };

  const exportErrors = () =>
    downloadCsv("surreal-import-skipped.csv", [["Line", ...table[0], "Why it was skipped"], ...rows.filter((r) => r.status === "error").map((r) => [r.line, ...table[r.line - 1], r.issues.join("; ")])]);

  const at = STEPS.findIndex((x) => x.id === step);
  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <section className={s.card} aria-labelledby="import-title">
      <div className={s.cardHead}>
        <div>
          <h2 id="import-title" className={s.cardTitle}>
            Import customers
          </h2>
          <p className={s.muted}>From an Excel workbook or a CSV: the current site&apos;s dealer export or RightClick&apos;s customer list.</p>
        </div>
        <button type="button" className={s.textBtn} onClick={onClose}>
          {step === "done" ? "Close" : "Cancel"}
        </button>
      </div>

      <ol className={s.steps} aria-label="Import steps">
        {STEPS.map((x, i) => (
          <li key={x.id} data-state={i < at ? "done" : i === at ? "current" : undefined} aria-current={i === at ? "step" : undefined}>
            <span>{i + 1}</span>
            {x.label}
          </li>
        ))}
      </ol>

      {step === "upload" && (
        <>
          <label
            className={s.drop}
            data-over={over || undefined}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={drop}
          >
            <input ref={input} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className={s.srOnly} onChange={(e) => read(e.target.files?.[0])} />
            <svg aria-hidden viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" />
            </svg>
            <strong>{reading ? "Reading the file" : "Drop a file here, or choose one"}</strong>
            <span className={s.muted}>Excel (.xlsx) or CSV, header row first, up to 5,000 customers</span>
          </label>
          {error && (
            <p className={s.error} role="alert">
              {error}
            </p>
          )}
          <div className={s.cardTools}>
            <a href={TEMPLATE} className={s.textBtn} download>
              Download the Excel template
            </a>
            <button type="button" className={s.textBtn} onClick={() => downloadCsv("surreal-dealer-import.csv", [FIELDS.map((f) => f.label)])}>
              CSV template
            </button>
            <button type="button" className={s.textBtn} onClick={() => load("Sample customers (preview)", SAMPLE_TABLE)}>
              Try it with a sample file
            </button>
          </div>
          <p className={s.note}>Passwords are never imported. Each customer chooses their own from a setup link, so no password travels in a spreadsheet or an email.</p>
        </>
      )}

      {step === "match" && mapping && (
        <>
          <p className={s.muted}>
            <strong className={s.fileName}>{file}</strong> · {table.length - 1} rows. We matched the columns we recognised; check each one. Email and Company are required.
          </p>
          <div className={s.mapList}>
            {FIELDS.map((f) => {
              const col = mapping[f.id];
              const example = col >= 0 ? table.slice(1).find((r) => r[col])?.[col] : "";
              return (
                <label key={f.id} className={s.mapRow} data-missing={f.required && col < 0 ? "" : undefined}>
                  <span className={s.mapField}>
                    <strong>
                      {f.label}
                      {f.required && <em> required</em>}
                    </strong>
                    <span className={s.muted}>{f.hint}</span>
                  </span>
                  <select className={s.select} value={col} onChange={(e) => setMapping({ ...mapping, [f.id]: Number(e.target.value) })}>
                    <option value={-1}>Not in this file</option>
                    {table[0].map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <span className={s.mapExample}>{example ? `e.g. ${example}` : ""}</span>
                </label>
              );
            })}
          </div>
          {missing.length > 0 && (
            <p className={s.error} role="alert">
              Choose the column for {missing.map((f) => f.label).join(" and ")}.
            </p>
          )}
          <div className={s.cardTools}>
            <button type="button" className={s.primary} disabled={missing.length > 0} onClick={() => setStep("check")}>
              Check {table.length - 1} rows
            </button>
            <button type="button" className={s.textBtn} onClick={() => setStep("upload")}>
              Choose another file
            </button>
          </div>
        </>
      )}

      {step === "check" && (
        <>
          <div className={s.checkSummary} role="group" aria-label="Filter rows">
            {(["all", "new", "update", "error"] as const).map((k) => (
              <button key={k} type="button" className={s.segBtn} aria-checked={filter === k} role="radio" onClick={() => setFilter(k)}>
                {k === "all" ? `All ${rows.length}` : `${ROW_LABEL[k]} ${counts[k]}`}
              </button>
            ))}
          </div>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Line</th>
                  <th scope="col">Result</th>
                  <th scope="col">Company</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Email</th>
                  <th scope="col">Account</th>
                  <th scope="col">Role</th>
                  <th scope="col">Notes</th>
                </tr>
              </thead>
              <tbody>
                {shown.slice(0, 200).map((r) => (
                  <tr key={r.line}>
                    <th scope="row" className="tabular">
                      {r.line}
                    </th>
                    <td>
                      <span className={s.statusChip} data-status={r.status}>
                        {ROW_LABEL[r.status]}
                      </span>
                    </td>
                    <td>{r.row.company}</td>
                    <td>{r.row.contact}</td>
                    <td>{r.row.email}</td>
                    <td className="tabular">{r.row.account}</td>
                    <td>{r.row.role === "owner" ? "Owner" : "Associate"}</td>
                    <td className={s.notesCell}>
                      {r.issues.map((x) => (
                        <span key={x} className={s.error}>
                          {x}
                        </span>
                      ))}
                      {r.notes.map((x) => (
                        <span key={x} className={s.muted}>
                          {x}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shown.length > 200 && <p className={s.muted}>Showing the first 200 of {shown.length} rows.</p>}
          <label className={s.switchRow}>
            <input type="checkbox" checked={invite} onChange={(e) => setInvite(e.target.checked)} />
            <span>
              Send setup links to the {counts.new} new {counts.new === 1 ? "customer" : "customers"} now
              <span className={s.muted}> Or send them later, one at a time or all together, from the list.</span>
            </span>
          </label>
          <div className={s.cardTools}>
            <button type="button" className={s.primary} disabled={busy || counts.new + counts.update === 0} onClick={run}>
              {busy ? "Importing" : `Import ${counts.new + counts.update} ${counts.new + counts.update === 1 ? "customer" : "customers"}`}
            </button>
            {counts.error > 0 && (
              <button type="button" className={s.textBtn} onClick={exportErrors}>
                Download the {counts.error} skipped rows
              </button>
            )}
            <button type="button" className={s.textBtn} onClick={() => setStep("match")}>
              Back to columns
            </button>
          </div>
        </>
      )}

      {step === "done" && result && (
        <>
          <dl className={s.resultList}>
            <div>
              <dt>Added</dt>
              <dd>{result.added}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{result.updated}</dd>
            </div>
            <div>
              <dt>Skipped</dt>
              <dd>{result.skipped}</dd>
            </div>
            <div>
              <dt>Setup links</dt>
              <dd>{result.invited}</dd>
            </div>
          </dl>
          <p className={s.muted}>
            {result.invited
              ? "The setup links are listed above. Customers who were already on the site kept their status and password."
              : "New customers are listed as Not invited. Send their setup links from the list when you are ready."}
          </p>
          <div className={s.cardTools}>
            <button type="button" className={s.primary} onClick={onClose}>
              See the customers
            </button>
            <button
              type="button"
              className={s.textBtn}
              onClick={() => {
                setResult(null);
                setStep("upload");
              }}
            >
              Import another file
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/* Page */

export default function AdminDealers() {
  const access = useAdminAccess();
  const readOnly = access !== "edit";
  const staff = useStaff();
  const customers = useCustomers();
  const imports = useImportLog();
  const [importing, setImporting] = useState(false);
  const [links, setLinks] = useState<SentLink[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "all">("all");
  const [confirmId, setConfirmId] = useState("");

  const by = staff?.name ? `${staff.name}, ${ROLE_LABEL[staff.role]}` : staff ? ROLE_LABEL[staff.role] : "";
  const count = (st: CustomerStatus) => customers.filter((c) => c.status === st).length;
  const stores = new Set(customers.map((c) => c.account || c.company)).size;

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return customers
      .filter((c) => (status === "all" || c.status === status) && (!term || [c.company, c.contact, c.email, c.account, c.city].join(" ").toLowerCase().includes(term)))
      .sort((a, b) => a.company.localeCompare(b.company) || (a.role === b.role ? a.contact.localeCompare(b.contact) : a.role === "owner" ? -1 : 1));
  }, [customers, q, status]);

  const send = async (cs: Customer[]) => {
    const out: SentLink[] = [];
    for (const c of cs) out.push({ name: `${c.contact || c.email}, ${c.company}`, email: c.email, url: (await createSetupLink(c.id)).url });
    setLinks(out);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const notInvited = customers.filter((c) => c.status === "not-invited");

  return (
    <div className={s.page}>
      <header className={s.pageHead}>
        <div>
          <p className={s.kicker}>Dealers</p>
          <h1 className={s.pageTitle}>Customers and logins</h1>
          <p className={s.pageLine}>
            The dealers who log in to the site. Import existing customers from Excel, then send each a setup link: they choose their own password and their account opens with
            their orders, memo and invoices.
          </p>
        </div>
        {!readOnly && !importing && (
          <button type="button" className={s.primary} onClick={() => setImporting(true)}>
            Import customers
          </button>
        )}
      </header>

      <dl className={`${s.stats} ${s.statsFour}`}>
        {(
          [
            ["Logins", customers.length, `${stores} stores`],
            ["Active", count("active"), "Password set"],
            ["Setup link sent", count("invited"), `Links last ${INVITE_HOURS} hours`],
            ["Not invited", count("not-invited"), "Imported, no link yet"],
          ] as const
        ).map(([label, value, line]) => (
          <div key={label} className={s.stat}>
            <dt>{label}</dt>
            <dd>{value}</dd>
            <span>{line}</span>
          </div>
        ))}
      </dl>

      {links.length > 0 && <LinkList links={links} onClose={() => setLinks([])} />}

      {importing && <ImportWizard existing={customers} by={by} onClose={() => setImporting(false)} onLinks={setLinks} />}

      <section className={s.card} aria-labelledby="customers-title">
        <div className={s.cardHead}>
          <h2 id="customers-title" className={s.cardTitle}>
            Customers
          </h2>
          {!readOnly && notInvited.length > 0 && (
            <button type="button" className={s.textBtn} onClick={() => send(notInvited)}>
              Send setup links to all {notInvited.length} not invited
            </button>
          )}
        </div>
        <div className={s.toolbar}>
          <label className={s.search}>
            <span className={s.srOnly}>Search customers</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Store, name, email or account code" />
          </label>
          <select className={s.select} value={status} onChange={(e) => setStatus(e.target.value as CustomerStatus | "all")} aria-label="Status">
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="invited">Setup link sent</option>
            <option value="not-invited">Not invited</option>
          </select>
          <span className={s.count}>{list.length} logins</span>
          <button
            type="button"
            className={s.textBtn}
            onClick={() =>
              downloadCsv("surreal-dealer-customers.csv", [
                ["Account code", "Company", "Contact name", "Email", "Phone", "City", "State", "Role", "Status", "Imported", "Link sent", "Active since"],
                ...list.map((c) => [c.account, c.company, c.contact, c.email, c.phone, c.city, c.state, c.role === "owner" ? "Owner" : "Associate", STATUS_LABEL[c.status], when(c.importedAt), when(c.invitedAt), when(c.activatedAt)]),
              ])
            }
          >
            Download CSV
          </button>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Store and person</th>
                <th scope="col">Account</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Since</th>
                <th scope="col">
                  <span className={s.srOnly}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <th scope="row">
                    <span className={s.personCell}>
                      <span className={s.pieceName}>{c.company}</span>
                      <span className={s.muted}>
                        {c.contact || "No name"}
                        {c.city ? `, ${c.city}${c.state ? ` ${c.state}` : ""}` : ""}
                        {c.source === "test" ? " · test account" : ""}
                      </span>
                    </span>
                  </th>
                  <td className="tabular">{c.account || "None"}</td>
                  <td>{c.email}</td>
                  <td>{c.role === "owner" ? "Owner" : "Associate"}</td>
                  <td>
                    <span className={s.statusChip} data-status={c.status}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="tabular">{when(c.activatedAt ?? c.invitedAt ?? c.importedAt)}</td>
                  <td>
                    {confirmId === c.id ? (
                      <span className={s.cardTools}>
                        <span className={s.muted}>Remove this login?</span>
                        <button
                          type="button"
                          className={s.textBtn}
                          onClick={() => {
                            removeCustomer(c.id);
                            setConfirmId("");
                          }}
                        >
                          Remove
                        </button>
                        <button type="button" className={s.textBtn} onClick={() => setConfirmId("")}>
                          Keep
                        </button>
                      </span>
                    ) : (
                      <span className={s.cardTools}>
                        <button type="button" className={s.textBtn} disabled={readOnly} onClick={() => send([c])}>
                          {c.status === "active" ? "Send reset link" : c.status === "invited" ? "Resend link" : "Send setup link"}
                        </button>
                        <button type="button" className={s.textBtn} disabled={readOnly} onClick={() => setConfirmId(c.id)} aria-label={`Remove ${c.contact || c.email}`}>
                          Remove
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7}>{customers.length ? "No customers match." : "No customers yet. Import them from Excel to begin."}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {imports.length > 0 && (
        <section className={s.card} aria-labelledby="imports-title">
          <h2 id="imports-title" className={s.cardTitle}>
            Import history
          </h2>
          <ul className={s.activity}>
            {imports.map((i) => (
              <li key={i.id}>
                <span>
                  <strong>{i.file}</strong>
                  {i.added} added, {i.updated} updated, {i.skipped} skipped{i.by ? `, by ${i.by}` : ""}
                </span>
                <time dateTime={i.at}>{new Date(i.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
