/**
 * issueDate — editorial "VOL. xx / ISSUE yy / DAY · DD MON" helpers.
 *
 * The Home masthead (screens/07-home.html L262-274) prints a small
 * row of mono metadata that frames the app like a printed magazine.
 * These helpers compute the three values without pulling a date lib:
 *
 *   getVolumeNumber()    → 1, 2, 3, …    (year - 2022; 2026 → 4)
 *   getIssueNumber()     → 1..53         (ISO 8601 week-of-year)
 *   formatShortDate(d)   → { dayName, dayNum, monShort } uppercase
 *
 * All values default to `new Date()` so callers can do
 * `formatShortDate()` with no argument.
 */

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

/**
 * ISO 8601 week number. The week that contains the year's first
 * Thursday is week 01. Days are anchored Mon..Sun so a Sunday-evening
 * date doesn't roll into next week's issue.
 */
export function getIssueNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/**
 * Volume number — the design's printed-zine signature. 2022 is Vol. 0,
 * so 2026 is Vol. 4, 2027 is Vol. 5, etc.
 */
export function getVolumeNumber(date = new Date()) {
  return date.getFullYear() - 2022;
}

/**
 * Editorial short date for the masthead. Returns uppercase strings
 * so callers can drop them straight into mono caps.
 */
export function formatShortDate(date = new Date()) {
  return {
    dayName: DAY_NAMES[date.getDay()],
    dayNum: String(date.getDate()),
    monShort: MONTH_NAMES[date.getMonth()],
  };
}

/**
 * Convenience: zero-padded "VOL. 04 / ISSUE 28" string used twice
 * in the Home masthead. Kept here so the formatting stays consistent
 * with whatever the rest of the app prints.
 */
export function formatVolumeIssue(date = new Date()) {
  const vol = String(getVolumeNumber(date)).padStart(2, '0');
  const issue = String(getIssueNumber(date)).padStart(2, '0');
  return `VOL. ${vol} / ISSUE ${issue}`;
}
