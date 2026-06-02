/**
 * Wayfinding type stack — Syne (display) + DM Sans (body/UI) +
 * JetBrains Mono (metadata) + Noto Serif Ethiopic (brand Ge'ez only).
 *
 * Keep registered faces in sync with `fieldGuide.fonts` in `./fieldGuide.js`.
 */

import { useFonts } from 'expo-font';
import {
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import {
  NotoSerifEthiopic_600SemiBold,
} from '@expo-google-fonts/noto-serif-ethiopic';

export function useFieldGuideFonts() {
  return useFonts({
    Syne_700Bold,
    Syne_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    NotoSerifEthiopic_600SemiBold,
  });
}

export default useFieldGuideFonts;
