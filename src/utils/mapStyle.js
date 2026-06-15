/**
 * fieldGuideTileStyle — Leaflet tile config for the Field Guide ink
 * canvas. Uses CartoDB "dark matter" so the city reads as the same
 * late-evening editorial palette as the rest of the app.
 *
 * Shape matches what LeafletMap consumes: an object that gets passed
 * to `L.tileLayer(url, options)`.
 */
export const fieldGuideTileStyle = Object.freeze({
  id: 'fieldguide',
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '© OpenStreetMap · © CARTO',
  subdomains: 'abcd',
  maxZoom: 19,
});
