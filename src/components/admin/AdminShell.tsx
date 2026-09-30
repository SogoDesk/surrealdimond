"use client";

/**
 * The admin console's frame (BRD 5.8), for Surreal staff at /admin. Its own
 * chrome, apart from the storefront: an ink sidebar with the SURREAL
 * wordmark and the modules (each locked or open for the signed-in role, from
 * the access matrix in src/content/admin.ts), and a top bar with the page's
 * breadcrumb, the role switcher, View the site and Sign out.
 *
 * Staff enter by role in the preview (named logins come with the
 * authentication service, Q10). A module the role cannot open shows a locked
 * panel; a view-only role sees the page with its controls disabled, through
 * useAdminAccess().
 */

import Link from "next/link";
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { ROLES, ROLE_LABEL, ROLE_LINE, adminModule, adminModules, type Access, type Role } from "@/content/admin";
import { signInStaff, signOutStaff, useStaff } from "@/lib/staff";
import AdminIcon from "./AdminIcon";
import s from "./admin.module.css";

const AccessContext = createContext<Access>("none");
/** The signed-in role's access to the current module: "edit", "view" or "none". */
export const useAdminAccess = () => useContext(AccessContext);

const noop = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

export default function AdminShell({ moduleId, children }: { moduleId: string; children: ReactNode }) {
  const staff = useStaff();
  const hydrated = useHydrated();
  const mod = adminModule(moduleId);

  if (!hydrated) return <div className={s.boot} aria-busy="true" aria-label="Loading the console" />;

  if (!staff) {
    return (
      <main className={s.signin}>
        <div className={s.signinCard}>
          <p className={s.wordmark}>
            SURREAL <span>Console</span>
          </p>
          <h1 className={s.signinTitle}>Staff sign in</h1>
          <p className={s.signinLine}>Choose a role to preview the console. Each role sees the modules its access allows.</p>
          <ul className={s.roleList}>
            {ROLES.map((r) => (
              <li key={r}>
                <button type="button" className={s.roleBtn} onClick={() => signInStaff(r)}>
                  <strong>{ROLE_LABEL[r]}</strong>
                  <span>{ROLE_LINE[r]}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className={s.signinNote}>Preview: staff get named logins, one per person, when the authentication service is set up.</p>
          <Link href="/" className={s.backLink}>
            Back to the site
          </Link>
        </div>
      </main>
    );
  }

  const access: Access = mod ? mod.access[staff.role] : "none";

  return (
    <div className={s.console}>
      <aside className={s.sidebar} aria-label="Console">
        <Link href="/admin" className={s.brand}>
          SURREAL <span>Console</span>
        </Link>
        <nav>
          <ul className={s.nav}>
            {adminModules.map((m) => {
              const a = m.access[staff.role];
              return (
                <li key={m.id}>
                  <Link href={m.href} className={s.navLink} aria-current={m.id === moduleId ? "page" : undefined} data-locked={a === "none" ? "" : undefined}>
                    <AdminIcon id={m.icon} className={s.navIcon} />
                    <span>{m.label}</span>
                    {a === "none" ? (
                      <svg className={s.lock} viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1" aria-label="No access">
                        <rect x="2.5" y="6" width="9" height="6.5" rx="1" />
                        <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
                      </svg>
                    ) : m.status === "design" ? (
                      <span className={s.navTag}>Soon</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <p className={s.sideNote}>Preview console. Changes are kept in this browser until the database is connected.</p>
      </aside>

      <div className={s.body}>
        <header className={s.topbar}>
          <p className={s.crumb}>
            <Link href="/admin">Console</Link>
            {mod && mod.id !== "overview" && (
              <>
                <span aria-hidden>/</span>
                <span aria-current="page">{mod.label}</span>
              </>
            )}
          </p>
          <div className={s.topTools}>
            <label className={s.roleSwitch}>
              <span>Viewing as</span>
              <select value={staff.role} onChange={(e) => signInStaff(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </label>
            <Link href="/" className={s.topLink} target="_blank" rel="noreferrer">
              View the site
            </Link>
            <button type="button" className={s.topLink} onClick={signOutStaff}>
              Sign out
            </button>
          </div>
        </header>

        <main id="main" className={s.main}>
          {access === "none" ? (
            <div className={s.locked}>
              <span className={s.lockedIcon} aria-hidden>
                <svg viewBox="0 0 14 14" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="0.9">
                  <rect x="2.5" y="6" width="9" height="6.5" rx="1" />
                  <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
                </svg>
              </span>
              <h1 className={s.pageTitle}>{mod?.label ?? "This page"} is not open to {ROLE_LABEL[staff.role]}</h1>
              <p className={s.pageLine}>The access matrix decides which roles see each module. Switch role above, or see who has access under Staff and roles.</p>
            </div>
          ) : (
            <AccessContext.Provider value={access}>
              {access === "view" && moduleId !== "overview" && <p className={s.viewOnly}>View only for {ROLE_LABEL[staff.role]}. Editing is off.</p>}
              {children}
            </AccessContext.Provider>
          )}
        </main>
      </div>
    </div>
  );
}
