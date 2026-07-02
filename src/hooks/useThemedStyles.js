import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Rebuild StyleSheet when the resolved Field Guide palette changes.
 * @template T
 * @param {(fieldGuide: import('../theme/fieldGuideThemes').buildFieldGuide extends (...args: any) => infer R ? R : never) => T} factory
 */
export function useThemedStyles(factory) {
  const { fieldGuide, isDark, preference } = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- factory is a stable module-level createStyles fn
  return useMemo(() => factory(fieldGuide), [fieldGuide, isDark, preference]);
}
