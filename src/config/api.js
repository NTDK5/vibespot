// config/api.js
// Use env override first so mobile can target local/dev/staging backend reliably.
// Example: EXPO_PUBLIC_API_URL=http://192.168.1.20:5000/api
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim();
export const BASE_URL = ENV_BASE_URL || "https://fena-backend.onrender.com/api";
