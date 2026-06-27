import {
  buildEditorsRoute,
  normalizeEditorsRouteApiResponse,
} from '../../src/utils/editorsRouteHelpers';

describe('buildEditorsRoute', () => {
  const picks = [
    {
      id: 'a',
      title: 'Tomoca Coffee',
      category: 'cafe',
      latitude: 9.01,
      longitude: 38.75,
      description: 'Cardamom buns and strong espresso in Bole.',
      tags: ['Cozy', 'Work-friendly'],
    },
    {
      id: 'b',
      title: 'Gallery One',
      category: 'gallery',
      latitude: 9.015,
      longitude: 38.755,
    },
    {
      id: 'c',
      title: 'Skyline Roof',
      category: 'rooftop',
      latitude: 9.02,
      longitude: 38.76,
      district: 'Bole',
    },
  ];

  it('returns null when fewer than two picks', () => {
    expect(buildEditorsRoute([])).toBeNull();
    expect(buildEditorsRoute([picks[0]])).toBeNull();
  });

  it('builds three stops with walk legs and footer totals', () => {
    const route = buildEditorsRoute(picks);
    expect(route).not.toBeNull();
    expect(route.stops).toHaveLength(3);
    expect(route.legs).toHaveLength(2);
    expect(route.legs[0]?.minutes).toBeGreaterThan(0);
    expect(route.footer.distanceLabel).toBeTruthy();
    expect(route.footer.durationLabel).toMatch(/min walking/);
    expect(route.footer.endsNear).toBe('Bole');
    expect(route.byline).toBe('Curated by FENA editors');
  });

  it('uses API metadata overrides when provided', () => {
    const route = buildEditorsRoute(picks.slice(0, 2), {
      kicker: 'Tonight · curated',
      title: 'Golden thread',
      editorName: 'Selam T.',
      source: 'curated',
    });
    expect(route.title).toBe('Golden thread');
    expect(route.kicker).toBe('Tonight · curated');
    expect(route.byline).toBe('Threaded by Selam T., city editor');
    expect(route.source).toBe('curated');
  });

  it('normalizeEditorsRouteApiResponse maps stops and meta', () => {
    const normalized = normalizeEditorsRouteApiResponse({
      source: 'curated',
      kicker: 'Tonight · curated',
      title: 'Golden thread',
      editorName: 'Selam T.',
      stops: [
        { whenTag: 'Coffee hour', spot: picks[0] },
        { whenTag: 'Gallery hour', spot: picks[1] },
      ],
    });
    expect(normalized.picks).toHaveLength(2);
    expect(normalized.picks[0]._routeWhenTag).toBe('Coffee hour');
    expect(normalized.meta.title).toBe('Golden thread');
  });
});
