/**
 * FENA — Field Guide design system tokens.
 *
 * Default export is the **dark** palette for static imports. Prefer
 * `useTheme().fieldGuide` or `useThemedStyles()` so light / system modes apply.
 */

import { buildFieldGuide, buildFgType } from './fieldGuideThemes';

const darkFieldGuide = buildFieldGuide(true);
const darkFgType = buildFgType(darkFieldGuide);

export const fieldGuide = darkFieldGuide;
export const fgType = darkFgType;

export { buildFieldGuide, buildFgType } from './fieldGuideThemes';
export { fieldGuideBase } from './fieldGuideBase';

export default fieldGuide;
