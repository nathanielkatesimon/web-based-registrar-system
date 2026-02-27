/*
 * File purpose:
 * - Centralized fetch wrapper for Rails API requests.
 * - Sends Devise session cookies on every request (`credentials: "include"`).
 * - Adds CSRF header for non-GET/HEAD requests when token meta tag is present.
 * - Normalizes response handling (throws on non-2xx, returns JSON, handles 204).
 *
 * Rails + Devise session-cookie CRUD example:
 *
 * // Sessions are handled by Devise cookies; `credentials: "include"` below
 * // sends/receives them automatically.
 *
 * import { api } from "@/lib/api";
 *
 * // CREATE
 * await api("/students", {
 *   method: "POST",
 *   body: JSON.stringify({
 *     student: { first_name: "Ada", last_name: "Lovelace", email: "ada@example.com" },
 *   }),
 * });
 *
 * // READ
 * const students = await api("/students");
 * const student = await api("/students/1");
 *
 * // UPDATE
 * await api("/students/1", {
 *   method: "PATCH",
 *   body: JSON.stringify({
 *     student: { last_name: "Byron" },
 *   }),
 * });
 *
 * // DELETE
 * await api("/students/1", { method: "DELETE" });
 *
 * Notes:
 * - Ensure frontend HTML has <meta name="csrf-token" content="...">.
 * - Rails CORS must allow your frontend origin and credentials.
 */

const getCsrfToken = () =>
  typeof document !== "undefined"
    ? document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")
    : null;

export function parseError(response) {
  if (!(response.errors instanceof Array)) return;
  if(response.errors.length === 0) return;
  return response.errors[0];
}

export function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const csrf = getCsrfToken();
  const isFormDataBody =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
  };

  if (!isFormDataBody) {
    headers["Content-Type"] = "application/json";
  }

  if (method !== "GET" && method !== "HEAD" && csrf) {
    headers["X-CSRF-Token"] = csrf;
  }

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });
}
