/**
 * Wayfinding type stack — Syne (display) + DM Sans (body/UI) +
 * JetBrains Mono (metadata) + Noto Serif Ethiopic (brand Ge'ez only).
 *
 * Critical faces (DM Sans + JetBrains Mono) gate first paint.
 * Display + Ethiopic load in the background after mount.
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

/** Body + mono — enough for splash, sign-in, and tab chrome. */
export function useCriticalFonts() {
  return useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
}

/** Display + Ge'ez — load after first paint without blocking cold start. */
export function DeferredFontLoader() {
  useFonts({
    Syne_700Bold,
    Syne_800ExtraBold,
    NotoSerifEthiopic_600SemiBold,
  });
  return null;
}

/** @deprecated Prefer useCriticalFonts + DeferredFontLoader for faster startup. */
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

export default useCriticalFonts;
