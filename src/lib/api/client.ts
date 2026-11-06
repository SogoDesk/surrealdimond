/**
 * The way every page reaches the Surreal API (the separate surreal-diamonds-api
 * service). In the browser it calls /api/v1 on this site, which next.config.ts
 * rewrites to the API on the private network, so there is no CORS and the
 * session cookie stays first-party. On the server it calls API_INTERNAL_URL
 * directly. The types come from the API's OpenAPI document: run
 * `npm run api:types` after the API changes.
 */

import type { paths } from "./schema";

export const API_BASE = "/api/v1";

/**
 * Sign in through the API instead of the preview's browser storage. Fixed at
 * build time and on only where NEXT_PUBLIC_API_AUTH is set (a developer's
 * .env.local today), so the live site keeps working until the API is deployed.
 */
export const API_AUTH = process.env.NEXT_PUBLIC_API_AUTH === "true";

/** Every API error has this shape (`fields` maps a form field to its message). */
export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type ApiPath = keyof paths;
type Method = "get" | "post" | "put" | "patch" | "delete";

/** The JSON body a route answers with on success: `ApiResponse<"/api/v1/health", "get">`. */
export type ApiResponse<P extends ApiPath, M extends Method> = paths[P][M] extends {
  responses: { 200: { content: { "application/json": infer Body } } };
}
  ? Body
  : paths[P][M] extends { responses: { 201: { content: { "application/json": infer Body } } } }
    ? Body
    : unknown;

function baseUrl(): string {
  if (typeof window !== "undefined") return API_BASE;
  const internal = process.env.API_INTERNAL_URL;
  if (!internal) throw new Error("API_INTERNAL_URL is not set, so the server cannot reach the API.");
  return `${internal.replace(/\/+$/, "")}${API_BASE}`;
}

/**
 * Calls the API and returns its JSON, or throws ApiRequestError with the API's
 * code, message and field errors. `path` is relative to /api/v1 ("/health").
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  // Marks the request as the site's own; the API refuses changes without it.
  headers.set("x-requested-with", "surreal-web");
  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${baseUrl()}${path}`, { ...init, headers, credentials: "same-origin" });

  if (!response.ok) {
    let body: Partial<ApiErrorBody> = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // Not JSON (a proxy error page, for example): fall back to the status.
    }
    throw new ApiRequestError(
      response.status,
      body.error?.code ?? `http_${response.status}`,
      body.error?.message ?? "Something went wrong. Please try again.",
      body.error?.fields,
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** The API answers (liveness), and can reach its database (readiness). */
export const api = {
  health: () => apiFetch<ApiResponse<"/api/v1/health", "get">>("/health"),
  ready: () => apiFetch<ApiResponse<"/api/v1/health/ready", "get">>("/health/ready"),
};
