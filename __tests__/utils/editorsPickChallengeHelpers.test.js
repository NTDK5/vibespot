import {
  buildChallengeStops,
  getChallengeNodeState,
  normalizeEditorsPickChallengeResponse,
} from '../../src/utils/editorsPickChallengeHelpers';

describe('editorsPickChallengeHelpers', () => {
  const picks = [
    { id: 'a', title: 'One', category: 'cafe' },
    { id: 'b', title: 'Two', category: 'gallery' },
    { id: 'c', title: 'Three', category: 'rooftop' },
  ];

  it('returns null when fewer than three picks', () => {
    expect(buildChallengeStops(picks.slice(0, 2))).toBeNull();
  });

  it('marks visited stops and suggests first unvisited when none visited', () => {
    const stops = buildChallengeStops(picks, []);
    expect(stops).toHaveLength(3);
    expect(stops[0].visited).toBe(false);
    expect(stops[0].isNextSuggested).toBe(true);
    expect(stops[1].visited).toBe(false);
    expect(getChallengeNodeState(stops[0])).toBe('next');
    expect(getChallengeNodeState(stops[1])).toBe('unvisited');
  });

  it('marks individual visited stops without suggesting next when any visit exists', () => {
    const stops = buildChallengeStops(picks, ['b']);
    expect(stops[1].visited).toBe(true);
    expect(stops[0].isNextSuggested).toBe(false);
    expect(stops[2].isNextSuggested).toBe(false);
    expect(getChallengeNodeState(stops[1])).toBe('visited');
  });

  it('does not hardcode stop 1 as next when some visits exist', () => {
    const stops = buildChallengeStops(picks, ['a']);
    expect(stops[0].visited).toBe(true);
    expect(stops[1].isNextSuggested).toBe(false);
    expect(stops[2].isNextSuggested).toBe(false);
    expect(getChallengeNodeState(stops[1])).toBe('unvisited');
  });

  it('normalizes API challenge payload', () => {
    const normalized = normalizeEditorsPickChallengeResponse({
      kicker: 'THIS WEEK · CHALLENGE',
      title: "Editor's picks",
      challengeKey: 'route_abc',
      picks,
      progress: {
        visitedSpotIds: ['a'],
        visitedCount: 1,
        total: 3,
        completed: false,
        bonusXpAwarded: false,
        bonusXpAmount: 50,
      },
    });
    expect(normalized.picks).toHaveLength(3);
    expect(normalized.progress.visitedCount).toBe(1);
  });
});
