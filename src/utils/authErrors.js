/**
 * Backend-tolerant error normalization for the auth flows added in
 * Phase 2 (forgot-password / verify-email / resend-verification).
 *
 * The three endpoints may not exist on the backend yet — this helper
 * maps whatever the network throws into a single user-facing string
 * so the UI never crashes and never shows a raw stack trace.
 *
 * Mapping (matches the spec):
 *   404           → "This isn't wired up yet — write the editors at
 *                    readers@vibespot.co for now."
 *   ≥500          → the server's `message` verbatim (or a fallback).
 *   no response   → "Off the grid. Check your connection."
 *   anything else → the server's `message` or the supplied fallback.
 *
 * Accepts a raw Axios error, a normalized payload from our
 * `axios.js` response interceptor (`error.normalized`), or anything
 * with a `.message` property.
 */

const NOT_WIRED_UP =
  "This isn't wired up yet — write the editors at readers@vibespot.co for now.";
const OFFLINE = 'Off the grid. Check your connection.';

export function normalizeAuthError(err, fallback = 'Something went wrong.') {
  if (!err) return fallback;

  const status =
    err?.normalized?.status ??
    err?.response?.status ??
    err?.status ??
    null;

  const serverMessage =
    err?.response?.data?.message ??
    err?.normalized?.message ??
    err?.data?.message ??
    err?.message ??
    null;

  // No response at all means we never reached the server — typically
  // a network error in axios. (Note: our axios interceptor will have
  // already retried once.)
  const noResponse =
    !err?.response && !err?.normalized?.status && status === null;

  if (status === 404) return NOT_WIRED_UP;
  if (status && status >= 500) return serverMessage || fallback;
  if (noResponse) return OFFLINE;
  return serverMessage || fallback;
}

export default normalizeAuthError;
