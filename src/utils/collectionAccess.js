/**
 * Pocket (collection) create access — read & like stay open for everyone.
 * Create / edit / delete require the Explorer badge (explorer_spots_visited).
 */

export function canCreateCollections(user, progression) {
  if (user?.canCreateCollections === true) return true;
  if (progression?.canCreateCollections === true) return true;
  return false;
}

export function resolveUnlockBadge(user, progression) {
  return (
    progression?.collectionsUnlockBadge ??
    user?.collectionsUnlockBadge ?? {
      name: 'Explorer',
      icon: 'compass',
      criteriaType: 'explorer_spots_visited',
      criteriaValue: 10,
    }
  );
}

export function getExplorerVisitProgress(progression, badgeProgress, unlockBadge) {
  const required = unlockBadge?.criteriaValue ?? 10;

  if (progression?.canCreateCollections) {
    return { current: required, required };
  }

  if (badgeProgress?.next_badge?.criteriaType === 'explorer_spots_visited') {
    return {
      current: badgeProgress.current_value ?? 0,
      required: badgeProgress.required_value ?? required,
    };
  }

  const explorer = progression?.badges?.find(
    (b) => b.criteriaType === 'explorer_spots_visited' && !b.unlocked,
  );
  if (explorer) {
    return { current: 0, required: explorer.criteriaValue ?? required };
  }

  return { current: 0, required };
}

export function showCollectionsLockedToast(toast, unlockBadge, progress) {
  const name = unlockBadge?.name ?? 'Explorer';
  const required = progress?.required ?? unlockBadge?.criteriaValue ?? 10;
  const current = Math.min(progress?.current ?? 0, required);
  const lines = [
    'Pockets are for Explorers',
    `Visit ${required} spots to earn the ${name} badge, then create public or private collections.`,
    `Progress: ${current} / ${required} spots visited`,
  ];
  toast.show(lines.join('\n'), { variant: 'info', durationMs: 5000 });
}
