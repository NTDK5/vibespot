// config/api.js
//
// Production: https://vibespot-backend.onrender.com/api
// Local dev:  EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api  (LAN IP, not localhost on device)
//
// Empty or whitespace-only EXPO_PUBLIC_API_URL is treated as unset → production URL.

export const PRODUCTION_API_URL = "https://vibespot-backend.onrender.com/api";

const ENV_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").trim();

export const BASE_URL =
  ENV_BASE_URL.length > 0 ? ENV_BASE_URL : PRODUCTION_API_URL;

/** Root health check (backend GET / returns status + db). */
export function getHealthCheckUrl() {
  const base = BASE_URL.replace(/\/+$/, "");
  if (base.endsWith("/api")) {
    return `${base.slice(0, -4)}/`;
  }
  return `${base}/`;
}
