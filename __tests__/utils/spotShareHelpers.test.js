import {
  buildSpotSharePayload,
  buildCollectionSharePayload,
  shareMessageForPlatform,
  topVibesDisplay,
} from '../../src/utils/spotShareHelpers';
import { buildSpotShareUrl } from '../../src/config/appUrl';

describe('spotShareHelpers', () => {
  const spot = {
    id: 'spot-abc',
    title: 'Tomoca Coffee',
    address: 'Bole',
    ratingAvg: 4.6,
    ratingCount: 128,
    shareUrl: 'https://fena.app/s/spot-abc',
  };

  it('buildSpotSharePayload includes vibes, rating, and URL', () => {
    const payload = buildSpotSharePayload(spot, {
      walkMin: 12,
      topVibes: [
        { name: 'Cozy', count: 5 },
        { name: 'Work-friendly', count: 3 },
      ],
    });

    expect(payload.message).toContain('Tomoca Coffee — Bole');
    expect(payload.message).toContain('Cozy · Work-friendly');
    expect(payload.message).toContain('12 min walk');
    expect(payload.message).toContain('★ 4.6 (128)');
    expect(payload.message).toContain('https://fena.app/s/spot-abc');
    expect(payload.message).toContain('Discovered on FENA');
  });

  it('topVibesDisplay returns top 3 by count', () => {
    expect(
      topVibesDisplay([
        { name: 'Quiet', count: 1 },
        { name: 'Cozy', count: 9 },
        { name: 'Lively', count: 4 },
        { name: 'Work-friendly', count: 7 },
      ]),
    ).toBe('Cozy · Work-friendly · Lively');
  });

  it('shareMessageForPlatform folds URL into message on Android-style payloads', () => {
    const payload = {
      message: 'Tomoca Coffee\nDiscovered on FENA',
      url: 'https://fena.app/s/spot-abc',
    };
    const out = shareMessageForPlatform(payload);
    expect(out.message).toContain('https://fena.app/s/spot-abc');
    expect(out.url).toBeUndefined();
  });

  it('buildCollectionSharePayload formats pocket copy', () => {
    const payload = buildCollectionSharePayload({
      id: 'pocket-1',
      title: 'Weekend Cafés',
      spotCount: 4,
      shareUrl: 'https://fena.app/p/pocket-1',
    });
    expect(payload.message).toContain('Weekend Cafés — 4 spots on FENA');
    expect(payload.message).toContain('https://fena.app/p/pocket-1');
  });
});

describe('appUrl', () => {
  it('buildSpotShareUrl uses public origin', () => {
    expect(buildSpotShareUrl('abc123')).toMatch(/\/s\/abc123$/);
  });
});
