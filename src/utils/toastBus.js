let handler = null;

export function setToastHandler(fn) {
  handler = fn;
}

export function showToast(message, options) {
  if (handler) return handler(message, options);
  // fallback: no-op (during early boot)
}

