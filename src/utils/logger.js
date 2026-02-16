// src/utils/logger.js
// Lightweight structured logger for the mobile app.
// Mirrors backend shape (no stack trace on client logs).

function nowIso() {
  return new Date().toISOString();
}

function write({ level = "info", service = "app", action = "log", message = "", metadata } = {}) {
  const entry = {
    timestamp: nowIso(),
    level,
    service,
    action,
    message,
    ...(metadata !== undefined ? { metadata } : {}),
  };

  // In RN we don't have file transports; console is acceptable.
  // Use a single-line JSON for easy parsing in remote log collectors.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

export const logger = {
  info: (e) => write({ level: "info", ...(typeof e === "string" ? { message: e } : e) }),
  warn: (e) => write({ level: "warn", ...(typeof e === "string" ? { message: e } : e) }),
  error: (e) => write({ level: "error", ...(typeof e === "string" ? { message: e } : e) }),
  debug: (e) => write({ level: "debug", ...(typeof e === "string" ? { message: e } : e) }),
};

