import { kmToMiles, walkingMinutes } from './geo';
import { buildCollectionShareUrl, buildSpotShareUrl } from '../config/appUrl';

export function topVibesDisplay(vibes) {
  if (!Array.isArray(vibes) || !vibes.length) return '';
  const sorted = [...vibes].sort((a, b) => (b?.count || 0) - (a?.count || 0));
  return sorted
    .slice(0, 3)
    .map((v) => String(v?.name || v?.label || v?.id || '').trim())
    .filter(Boolean)
    .join(' · ');
}

export function formatMi(km) {
  if (km == null) return null;
  const miles = kmToMiles(km);
  if (miles < 0.1) return '< 0.1 mi';
  return `${miles.toFixed(1)} mi`;
}

export function buildSubtitleLine(spot, tags, vibeSummary, walkMin) {
  const parts = [];
  if (Array.isArray(tags) && tags.length) {
    parts.push(...tags.slice(0, 3).map(String));
  } else if (vibeSummary) {
    parts.push(...vibeSummary.split(' · '));
  } else if (spot?.hook) {
    parts.push(String(spot.hook));
  }
  return {
    main: parts.join(' · '),
    walk: walkMin != null ? `${walkMin} min walk` : null,
  };
}

export function isChampionSpot(spot) {
  return !!(
    spot?.isWeeklyChampion ||
    spot?.weeklyChampion ||
    spot?.weeklyChampionAt ||
    spot?.championWeek != null ||
    spot?.isChampion
  );
}

export function resolveSpotShareUrl(spot, spotId) {
  return spot?.shareUrl || buildSpotShareUrl(spotId || spot?.id);
}

export function resolveCollectionShareUrl(collection) {
  return collection?.shareUrl || buildCollectionShareUrl(collection?.id);
}

export function buildSpotSharePayload(spot, options = {}) {
  const {
    distanceKm = null,
    walkMin = options.walkMin ?? walkingMinutes(distanceKm),
    topVibes = [],
    userNote = '',
  } = options;

  const title = spot?.title || 'Spot';
  const vibeLine = topVibesDisplay(topVibes);
  const district = spot?.address || spot?.district || '';
  const head = [title, district].filter(Boolean).join(' — ');
  const context = [vibeLine].filter(Boolean).join(' · ');

  const lines = [];
  if (userNote?.trim()) {
    lines.push(userNote.trim());
    lines.push('');
  }
  if (context) lines.push(`${head} · ${context}`);
  else lines.push(head);

  const walkLine = [];
  if (walkMin != null) walkLine.push(`${walkMin} min walk`);
  if (spot?.ratingAvg != null && spot?.ratingCount > 0) {
    walkLine.push(`★ ${Number(spot.ratingAvg).toFixed(1)} (${spot.ratingCount})`);
  }
  if (walkLine.length) lines.push(walkLine.join(' · '));

  const shareUrl = resolveSpotShareUrl(spot);
  if (shareUrl) lines.push(shareUrl);
  lines.push('Discovered on FENA');

  return {
    message: lines.filter(Boolean).join('\n'),
    url: shareUrl,
    title,
  };
}

export function buildCollectionSharePayload(collection, options = {}) {
  const { userNote = '' } = options;
  const title = collection?.title || 'Pocket';
  const count =
    collection?.spotCount ??
    collection?._count?.spots ??
    collection?.spots?.length ??
    0;
  const shareUrl = resolveCollectionShareUrl(collection);

  const lines = [];
  if (userNote?.trim()) {
    lines.push(userNote.trim());
    lines.push('');
  }
  lines.push(`${title} — ${count} spot${count === 1 ? '' : 's'} on FENA`);
  if (shareUrl) lines.push(shareUrl);
  lines.push('Discovered on FENA');

  return {
    message: lines.join('\n'),
    url: shareUrl,
    title,
  };
}

export function shareMessageForPlatform(payload) {
  const { message, url } = payload;
  if (!url) return { message, url: undefined };
  if (message.includes(url)) {
    return { message, url: undefined };
  }
  return { message: `${message}\n${url}`, url: undefined };
}
