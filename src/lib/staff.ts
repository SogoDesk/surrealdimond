"use client";

/**
 * The staff preview session for the admin console: a role, kept in this
 * browser. Real staff get named logins with the authentication service (Q10
 * recommends one per person); until then the console is entered by role so
 * the access matrix can be seen.
 */

import { ROLES, type Role } from "@/content/admin";
import { createLocalStore } from "./localStore";

export interface StaffSession {
  role: Role;
}

const isSession = (v: unknown): v is StaffSession | null => v === null || (typeof v === "object" && v !== null && ROLES.includes((v as StaffSession).role));
const store = createLocalStore<StaffSession | null>("surreal-staff", null, isSession);

export const useStaff = store.useStore;
export const signInStaff = (role: Role) => store.set({ role });
export const signOutStaff = () => store.set(null);
