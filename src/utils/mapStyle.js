/**
 * Field Guide map tile styles — dark ink canvas and light paper canvas.
 */

export const fieldGuideTileStyle = Object.freeze({
  id: 'fieldguide-dark',
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '© OpenStreetMap · © CARTO',
  subdomains: 'abcd',
  maxZoom: 19,
});

export const fieldGuideTileStyleLight = Object.freeze({
  id: 'fieldguide-light',
  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  attribution: '© OpenStreetMap · © CARTO',
  subdomains: 'abcd',
  maxZoom: 19,
});

export function getFieldGuideTileStyle(isDark) {
  return isDark ? fieldGuideTileStyle : fieldGuideTileStyleLight;
}

/** @deprecated use getFieldGuideTileStyle(isDark) */
export default fieldGuideTileStyle;
