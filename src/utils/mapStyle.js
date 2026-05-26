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

/**
 * Legacy Google-style mapStyle JSON kept around so any consumer that
 * still imports it (e.g. react-native-maps wrappers in older code
 * paths) keeps working until they migrate to Leaflet + tile presets.
 */
export const cleanMapStyle = [
    {
      "featureType": "poi",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "poi.business",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "poi.park",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "poi.medical",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "poi.school",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "transit",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "administrative",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "road",
      "stylers": [{ "visibility": "simplified" }]
    }
  ];
  