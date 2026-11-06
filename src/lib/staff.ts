"use client";

/**
 * The staff preview session for the admin console: a named test person and
 * their role, kept in this browser (src/content/testAccounts.ts, one dummy
 * login per role for role testing, F-E3). Real staff get named logins with
 * the authentication service (Q10 recommends one per person).
 */

import { ROLES, type Role } from "@/content/admin";
import { authApi } from "./api/auth";
import { API_AUTH } from "./api/client";
import { createLocalStore } from "./localStore";

export interface StaffSession {
  role: Role;
  name?: string;
  email?: string;
}

const isSession = (v: unknown): v is StaffSession | null => v === null || (typeof v === "object" && v !== null && ROLES.includes((v as StaffSession).role));
const store = createLocalStore<StaffSession | null>("surreal-staff", null, isSession);

export const useStaff = store.useStore;
export const signInStaff = (role: Role, person?: { name: string; email: string }) => store.set({ role, ...(person && { name: person.name, email: person.email }) });
export const setStaffSession = (session: StaffSession | null) => store.set(session);
/** Forgets the screens' copy of the session, without calling the API. */
export const clearStaff = () => store.set(null);
export const signOutStaff = () => {
  store.set(null);
  if (API_AUTH) void authApi.logout().catch(() => undefined);
};
