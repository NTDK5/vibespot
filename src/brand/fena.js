/**
 * FENA brand constants — single source of truth for user-facing copy.
 * User-facing copy only; technical IDs live in app.json / native config.
 */

export const BRAND = Object.freeze({
  name: 'FENA',
  nameGeez: 'ፍና',
  tagline: 'Where Paths Meet Evening',
  taglineShort: 'WHERE PATHS MEET EVENING',
  shareSuffix: 'on FENA',
  legalName: 'FENA',
  supportEmail: 'readers@fena.app',
  privacyUrl: 'https://fena.app/privacy',
  logoA11yLabel: 'Fena, Where Paths Meet Evening',
});

export const LOGO_LOCKUP = require('../../assets/brand/logo-lockup-alt.svg');
export const LOGO_MARK = require('../../assets/brand/logo-mark-alt.svg');
export const LOGO_MARK_GEEZ = require('../../assets/brand/logo-mark.svg');

/** @param {string} title @param {string} [address] */
export function formatSpotShareMessage(title, address) {
  const base = `${title} ${BRAND.shareSuffix}`;
  return address ? `${base} — ${address}`.trim() : base.trim();
}

/** @param {string} title */
export function formatPhotoShareMessage(title) {
  return title ? `${title} ${BRAND.shareSuffix}` : `A photo ${BRAND.shareSuffix}`;
}
