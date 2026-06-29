/**
 * Wayfinding type stack — Geist (display + body/UI) +
 * Geist Mono (metadata) + Noto Serif Ethiopic (brand Ge'ez only).
 *
 * Critical faces (Geist 400/500/600/700 + Geist Mono) gate first paint.
 * Display extra-bold + Ethiopic load in the background after mount.
 */

import { useFonts } from 'expo-font';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
} from '@expo-google-fonts/geist';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
} from '@expo-google-fonts/geist-mono';
import {
  NotoSerifEthiopic_600SemiBold,
} from '@expo-google-fonts/noto-serif-ethiopic';

/** Body + display + mono — enough for splash, sign-in, and tab chrome. */
export function useCriticalFonts() {
  return useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });
}

/** Display heavy + Ge'ez — load after first paint without blocking cold start. */
export function DeferredFontLoader() {
  useFonts({
    Geist_800ExtraBold,
    NotoSerifEthiopic_600SemiBold,
  });
  return null;
}

/** @deprecated Prefer useCriticalFonts + DeferredFontLoader for faster startup. */
export function useFieldGuideFonts() {
  return useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    NotoSerifEthiopic_600SemiBold,
  });
}

export default useCriticalFonts;
