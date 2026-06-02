import React from 'react';
import Svg, { Path } from 'react-native-svg';
import fieldGuide from '../theme/fieldGuide';

/**
 * Monochrome Google "G" used on the auth screens' "Continue with Google"
 * button. Tinted to match the Field Guide cream palette.
 */
export default function GoogleIcon({ size = 18, color = fieldGuide.cream }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M21.35 11.1H12v3.9h5.42c-.24 1.3-1.7 3.8-5.42 3.8-3.27 0-5.93-2.7-5.93-6s2.66-6 5.93-6c1.86 0 3.1.79 3.81 1.47l2.6-2.5C16.86 4.13 14.65 3 12 3 6.92 3 2.8 7.12 2.8 12.2S6.92 21.4 12 21.4c6.94 0 11.5-4.86 11.5-11.7 0-.8-.08-1.4-.15-2z"
      />
    </Svg>
  );
}
