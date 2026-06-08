/**
 * Shared spot hours shape: { mon: [8, 17], tue: null, ... }
 * Open/close are 24h numbers (may include fractional hours from the editor).
 * null per day = closed.
 */

export const HOURS_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function parseHourText(text) {
  const m = /^(\d{1,2})(?::(\d{2}))?$/.exec(String(text || '').trim());
  if (!m) return null;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = m[2] ? Math.min(59, Math.max(0, parseInt(m[2], 10))) : 0;
  return h + min / 60;
}

export function createEmptyHours() {
  return HOURS_DAYS.reduce((acc, d) => {
    acc[d] = null;
    return acc;
  }, {});
}

/** Normalize API / legacy shapes into editor + chart format. */
export function normalizeHoursFromSpot(hours) {
  const out = createEmptyHours();
  if (!hours || typeof hours !== 'object' || Array.isArray(hours)) return out;

  HOURS_DAYS.forEach((d) => {
    const v = hours[d];
    if (Array.isArray(v) && v.length >= 2) {
      out[d] = [Number(v[0]), Number(v[1])];
    } else if (v && typeof v === 'object' && v.open != null && v.close != null) {
      const o = parseHourText(v.open);
      const c = parseHourText(v.close);
      if (o != null && c != null) out[d] = [o, c];
    } else {
      out[d] = null;
    }
  });
  return out;
}

/**
 * Serialize editor state for API.
 * Returns null when every day is closed (clears persisted hours on update).
 */
export function hoursForApi(hours) {
  const out = {};
  HOURS_DAYS.forEach((day) => {
    const range = hours?.[day];
    if (Array.isArray(range) && range.length >= 2) {
      out[day] = [Math.floor(range[0]), Math.floor(range[1])];
    }
  });
  return Object.keys(out).length ? out : null;
}
