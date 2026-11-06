/**
 * Sign-in calls to the Surreal API, used when API_AUTH is on (client.ts). The
 * session itself is an httpOnly cookie the browser cannot read; the dealer and
 * staff stores (src/lib/dealer.ts, src/lib/staff.ts) keep only what the screens
 * show, and the API decides every permission on its own.
 */

import type { DealerSession } from "@/lib/dealer";
import type { StaffSession } from "@/lib/staff";
import { apiFetch, type ApiResponse } from "./client";

export type Me = ApiResponse<"/api/v1/auth/me", "get">;
export type LinkLookup = ApiResponse<"/api/v1/auth/setup/lookup", "post">;
export type MfaBegin = ApiResponse<"/api/v1/auth/mfa/setup", "post">;
export type MfaResult = ApiResponse<"/api/v1/auth/mfa/verify", "post">;
export type AccountView = ApiResponse<"/api/v1/me/account", "get">;

const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const authApi = {
  me: () => apiFetch<Me>("/auth/me"),
  login: (email: string, password: string) => post<Me>("/auth/login", { email, password }),
  logout: () => post<void>("/auth/logout"),
  forgot: (email: string) => post<unknown>("/auth/forgot", { email }),
  lookup: (token: string) => post<LinkLookup>("/auth/setup/lookup", { token }),
  resend: (token: string) => post<unknown>("/auth/setup/resend", { token }),
  setup: (token: string, password: string) => post<Me>("/auth/setup", { token, password }),
  changePassword: (current: string, next: string) => post<Me>("/auth/password", { current, next }),
  mfaBegin: () => post<MfaBegin>("/auth/mfa/setup"),
  mfaVerify: (code: string) => post<MfaResult>("/auth/mfa/verify", { code }),
  mfaRecover: (code: string) => post<void>("/auth/mfa/recover", { code }),
  account: () => apiFetch<AccountView>("/me/account"),
};

/** What the storefront and dashboard screens read, from the API's answer. */
export const toDealerSession = (me: Me): DealerSession | null =>
  me.dealer
    ? {
        email: me.user.email,
        store: me.dealer.store,
        contact: me.user.name,
        demo: false,
        role: me.dealer.role,
        account: me.dealer.account ?? undefined,
      }
    : null;

/** Staff count as signed in to the console only once two-factor is passed. */
export const toStaffSession = (me: Me): StaffSession | null =>
  me.staff?.mfa === "ok" ? { role: me.staff.role, name: me.user.name, email: me.user.email } : null;
