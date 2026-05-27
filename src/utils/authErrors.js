/**
 * Backend-tolerant error normalization for auth flows (forgot-password,
 * verify-email, resend-verification).
 */

import { BRAND } from '../brand/fena';

const NOT_WIRED_UP = `This isn't wired up yet — write the editors at ${BRAND.supportEmail} for now.`;
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
