/**
 * SpotPhoto — rounded photo container that hosts the duotone fill,
 * the index stamp, the save stamp, and any extra overlay children.
 *
 * CSS ref: .spot-photo / .spot-photo.tall|wide|square / .spot-photo .index /
 * .save-stamp (css_app.css L433-481)
 *
 * Props:
 *   vibe: vibe key                                     passed to DuotoneVibe
 *   image?: ImageSourcePropType
 *   aspect?: '4/5' | '3/4' | '1/1' | '16/10'           default '4/5'
 *   index?: string                                     IndexStamp content e.g. "NO. 042"
 *   indexPosition?: 'tl'|'tr'|'bl'|'br'                default 'tl'
 *   saved?: boolean
 *   onToggleSave?: () => void
 *   showSaveStamp?: boolean                            default true (set false for ChampionCard)
 *   children?: ReactNode                               extra overlays
 *   style?: ViewStyle
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import fieldGuide from '../../../theme/fieldGuide';
import DuotoneVibe from './DuotoneVibe';
import IndexStamp from './IndexStamp';
import SaveStamp from './SaveStamp';

const ASPECT = {
  '4/5':   4 / 5,
  '3/4':   3 / 4,
  '1/1':   1,
  '16/10': 16 / 10,
};

export default function SpotPhoto({
  vibe = 'cafe',
  image,
  aspect = '4/5',
  index,
  indexPosition = 'tl',
  saved = false,
  onToggleSave,
  showSaveStamp = true,
  children,
  style,
}) {
  return (
    <View
      style={[
        styles.container,
        { aspectRatio: ASPECT[aspect] || ASPECT['4/5'] },
        style,
      ]}
    >
      <DuotoneVibe vibe={vibe} image={image} />
      {index ? (
        <IndexStamp position={indexPosition}>{index}</IndexStamp>
      ) : null}
      {showSaveStamp && onToggleSave ? (
        <SaveStamp saved={saved} onToggle={onToggleSave} />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: fieldGuide.radius.lg,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
    position: 'relative',
  },
});
