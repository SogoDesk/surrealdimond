"use client";

/**
 * Staff and roles (BRD section 4, R-35, B-04): the five staff roles with
 * what each is for, and the access matrix, module by module, that the
 * console enforces (edit, view or no access). The matrix is our proposal
 * until Surreal's role-to-page breakdown (C-05). Named staff logins, one per
 * person with administrator rights where needed (Q10), arrive with the
 * authentication service; the list of staff users lives here then.
 */

import { ROLES, ROLE_LABEL, ROLE_LINE, adminModules, type Access } from "@/content/admin";
import { useStaff } from "@/lib/staff";
import s from "./admin.module.css";

const LABEL: Record<Access, string> = { edit: "Edit", view: "View", none: "None" };

export default function AdminStaff() {
  const staff = useStaff();
  return (
    <div className={s.page}>
      <header className={s.pageHead}>
        <div>
          <p className={s.kicker}>Staff and roles</p>
          <h1 className={s.pageTitle}>Who can do what</h1>
          <p className={s.pageLine}>Five staff roles. Each module is open to edit, open to view, or closed, per role. Dealers and dealer associates sign in to the storefront, not the console.</p>
        </div>
      </header>

      <ul className={s.roles}>
        {ROLES.map((r) => (
          <li key={r} className={s.roleCard} data-current={staff?.role === r ? "" : undefined}>
            <strong>{ROLE_LABEL[r]}</strong>
            <span>{ROLE_LINE[r]}</span>
            {staff?.role === r && <span className={s.countChip}>You</span>}
          </li>
        ))}
      </ul>

      <section className={s.card} aria-labelledby="matrix-title">
        <div className={s.cardHead}>
          <div>
            <h2 id="matrix-title" className={s.cardTitle}>
              Access matrix
            </h2>
            <p className={s.muted}>Proposed. Surreal confirms it with the role-to-page breakdown.</p>
          </div>
        </div>
        <div className={s.tableWrap}>
          <table className={`${s.table} ${s.matrix}`}>
            <thead>
              <tr>
                <th scope="col">Module</th>
                {ROLES.map((r) => (
                  <th key={r} scope="col">
                    {ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminModules.map((m) => (
                <tr key={m.id}>
                  <th scope="row">
                    <strong>{m.label}</strong>
                    <span className={s.muted}>{m.line}</span>
                  </th>
                  {ROLES.map((r) => (
                    <td key={r}>
                      <span className={s.accessChip} data-access={m.access[r]}>
                        {LABEL[m.access[r]]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={s.card} aria-labelledby="users-title">
        <h2 id="users-title" className={s.cardTitle}>
          Staff users
        </h2>
        <p className={s.muted}>
          Staff users get named logins, one per person, when the authentication service is set up. Add, remove and assign roles here then. Until then the preview console is entered by role.
        </p>
      </section>
    </div>
  );
}
