/**
 * Canonical amenity / services catalog.
 *
 * A spot's `features` array (free-form strings on the backend) is mapped
 * against this catalog so the UI can render clean, icon-backed chips.
 * Known features resolve to a catalog entry (label + Ionicons glyph);
 * anything unrecognised is kept verbatim as a "custom" amenity so legacy
 * free-text data still shows up.
 *
 * Storage convention: when a user picks a catalog amenity we persist its
 * human-readable `label` (e.g. "Wheelchair accessible"). That keeps the
 * stored value readable, backward-compatible with old free-text entries,
 * and friendly to the tag/OG pipeline that lowercases features.
 */

export const DEFAULT_AMENITY_ICON = 'pricetag-outline';

/**
 * Each entry: { key, label, icon, group, aliases }
 *   - key:    stable identifier (used for de-dupe / selection)
 *   - label:  what we display and persist
 *   - icon:   Ionicons name (@expo/vector-icons)
 *   - group:  coarse grouping (display/organisation only)
 *   - aliases: extra strings that should resolve to this entry
 */
export const AMENITIES = Object.freeze([
  // Connectivity & comfort
  { key: 'wifi', label: 'Wi-Fi', icon: 'wifi', group: 'comfort', aliases: ['wi fi', 'wifi', 'internet', 'wireless'] },
  { key: 'power_outlets', label: 'Power outlets', icon: 'flash-outline', group: 'comfort', aliases: ['outlets', 'sockets', 'charging', 'plugs'] },
  { key: 'air_conditioning', label: 'Air conditioning', icon: 'snow-outline', group: 'comfort', aliases: ['ac', 'a/c', 'aircon'] },
  { key: 'outdoor_seating', label: 'Outdoor seating', icon: 'sunny-outline', group: 'comfort', aliases: ['outdoor', 'terrace', 'patio', 'courtyard', 'garden'] },
  { key: 'indoor_seating', label: 'Indoor seating', icon: 'home-outline', group: 'comfort', aliases: ['indoor', 'seating'] },
  { key: 'restrooms', label: 'Restrooms', icon: 'water-outline', group: 'comfort', aliases: ['restroom', 'toilet', 'toilets', 'washroom', 'bathroom'] },
  { key: 'good_for_work', label: 'Good for work', icon: 'laptop-outline', group: 'comfort', aliases: ['work', 'laptop friendly', 'workspace', 'coworking'] },
  { key: 'prayer_area', label: 'Prayer area', icon: 'moon-outline', group: 'comfort', aliases: ['prayer', 'prayer room', 'masjid'] },

  // Access & parking
  { key: 'wheelchair_accessible', label: 'Wheelchair accessible', icon: 'accessibility-outline', group: 'access', aliases: ['accessible', 'wheelchair', 'step free'] },
  { key: 'parking', label: 'Parking', icon: 'car-outline', group: 'access', aliases: ['car park', 'parking lot', 'free parking'] },
  { key: 'open_24_7', label: 'Open 24/7', icon: 'time-outline', group: 'access', aliases: ['24/7', '24 hours', 'always open'] },

  // Payments
  { key: 'card_payments', label: 'Card payments', icon: 'card-outline', group: 'payments', aliases: ['card', 'cards', 'visa', 'mastercard', 'pos'] },
  { key: 'mobile_money', label: 'Mobile money', icon: 'phone-portrait-outline', group: 'payments', aliases: ['telebirr', 'cbe birr', 'mobile payment', 'mpesa', 'm-pesa'] },
  { key: 'cash_only', label: 'Cash only', icon: 'cash-outline', group: 'payments', aliases: ['cash', 'cash-only'] },

  // Dining & service
  { key: 'serves_coffee', label: 'Coffee', icon: 'cafe-outline', group: 'dining', aliases: ['coffee', 'espresso', 'macchiato'] },
  { key: 'serves_food', label: 'Food', icon: 'restaurant-outline', group: 'dining', aliases: ['food', 'meals', 'kitchen'] },
  { key: 'vegetarian', label: 'Vegetarian options', icon: 'leaf-outline', group: 'dining', aliases: ['vegetarian', 'vegan', 'fasting', 'fasting food'] },
  { key: 'alcohol', label: 'Serves alcohol', icon: 'wine-outline', group: 'dining', aliases: ['alcohol', 'bar', 'drinks', 'beer', 'wine'] },
  { key: 'reservations', label: 'Reservations', icon: 'calendar-outline', group: 'dining', aliases: ['reservation', 'booking', 'reserve'] },
  { key: 'takeaway', label: 'Takeaway', icon: 'bag-handle-outline', group: 'dining', aliases: ['take away', 'to go', 'takeout'] },
  { key: 'delivery', label: 'Delivery', icon: 'bicycle-outline', group: 'dining', aliases: ['delivers', 'home delivery'] },

  // Atmosphere
  { key: 'pet_friendly', label: 'Pet friendly', icon: 'paw-outline', group: 'atmosphere', aliases: ['pets', 'dog friendly', 'dogs'] },
  { key: 'kid_friendly', label: 'Kid friendly', icon: 'happy-outline', group: 'atmosphere', aliases: ['kids', 'family friendly', 'children'] },
  { key: 'groups_welcome', label: 'Groups welcome', icon: 'people-outline', group: 'atmosphere', aliases: ['groups', 'large groups'] },
  { key: 'live_music', label: 'Live music', icon: 'musical-notes-outline', group: 'atmosphere', aliases: ['music', 'dj', 'band'] },
  { key: 'smoking_area', label: 'Smoking area', icon: 'flame-outline', group: 'atmosphere', aliases: ['smoking', 'shisha', 'hookah'] },
]);

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

// Build a lookup once: normalized key/label/alias -> catalog entry.
const LOOKUP = (() => {
  const map = new Map();
  for (const a of AMENITIES) {
    map.set(normalize(a.key), a);
    map.set(normalize(a.label), a);
    for (const alias of a.aliases || []) {
      map.set(normalize(alias), a);
    }
  }
  return map;
})();

/** Resolve a single stored feature string to a catalog entry, or null. */
export function findAmenity(value) {
  if (value == null) return null;
  return LOOKUP.get(normalize(value)) || null;
}

/**
 * Map a spot's stored `features` to display-ready amenities.
 * Known entries get a label + icon; unknown ones are kept as custom
 * amenities with the default icon. De-duplicates by resolved key.
 */
export function resolveAmenities(features = []) {
  const list = Array.isArray(features) ? features : [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const text = String(raw ?? '').trim();
    if (!text) continue;
    const match = findAmenity(text);
    const key = match ? match.key : normalize(text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(
      match
        ? { key: match.key, label: match.label, icon: match.icon, custom: false }
        : { key, label: text, icon: DEFAULT_AMENITY_ICON, custom: true },
    );
  }
  return out;
}

/** True when `features` already contains the given catalog amenity. */
export function isAmenitySelected(features = [], amenity) {
  if (!amenity) return false;
  return (Array.isArray(features) ? features : []).some((v) => {
    const a = findAmenity(v);
    return a ? a.key === amenity.key : false;
  });
}

/** Toggle a catalog amenity in a features array; returns the next array. */
export function toggleAmenity(features = [], amenity) {
  if (!amenity) return features;
  if (isAmenitySelected(features, amenity)) {
    return features.filter((v) => {
      const a = findAmenity(v);
      return !(a && a.key === amenity.key);
    });
  }
  return [...features, amenity.label];
}
