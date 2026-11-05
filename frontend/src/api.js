// Shared API client for FreshTrack.
//
// All backend calls go through here so the base URL and the auth header
// live in ONE place. The backend (Katarina/Eric) runs on :4000 in this setup
// (backend/.env PORT=4000, falls back to 3000) and has CORS enabled, so an
// absolute URL from the Vite dev server (5173) is fine.
//
// Used by BOTH the buyer storefront and the shared auth layer.
export const API_BASE = "http://localhost:4000";

export function authHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Thin fetch wrapper that:
//  - prepends API_BASE
//  - attaches the bearer token when one is supplied
//  - throws a useful Error (with .status and .data) on non-2xx responses
export async function apiFetch(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(token),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
