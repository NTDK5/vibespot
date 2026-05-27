/**
 * Thin wrapper around @expo-google-fonts so the rest of the app can
 * call `useFieldGuideFonts()` and get a `[loaded, error]` tuple back.
 *
 * Only the faces referenced by the Field Guide design system are
 * registered here — Fraunces 300/400/400_Italic/500/700,
 * Inter 400/500/600/700, JetBrains Mono 400/500. Keep this list in
 * sync with `fieldGuide.fonts` in `./fieldGuide.js`.
 */

import { useFonts } from 'expo-font';
import {
  Fraunces_300Light,
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

export function useFieldGuideFonts() {
  return useFonts({
    Fraunces_300Light,
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
}

export default useFieldGuideFonts;
