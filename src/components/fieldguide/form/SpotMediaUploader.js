/**
 * SpotMediaUploader — cover + gallery strip for spot admin flows.
 */

import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';
import MonoMeta from '../primitives/MonoMeta';
import DuotoneVibe from '../spot/DuotoneVibe';
import { pickImage, pickMultipleImages } from '../../../services/upload';

export default function SpotMediaUploader({
  images = [],
  onChange,
  existingUrls = [],
  maxImages = 10,
  vibe = 'cafe',
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [local, setLocal] = useState(images);

  const sync = (next) => {
    setLocal(next);
    onChange?.(next);
  };

  const allPreview = [
    ...existingUrls.map((uri) => ({ uri, remote: true })),
    ...local.map((img) => ({ uri: img.uri, remote: false, asset: img })),
  ];
  const cover = allPreview[0];
  const gallery = allPreview.slice(1);

  const pickCover = async () => {
    const img = await pickImage();
    if (img) sync([img, ...local]);
  };

  const pickMore = async () => {
    const picked = await pickMultipleImages(maxImages - existingUrls.length);
    if (picked?.length) sync([...local, ...picked].slice(0, maxImages));
  };

  const removeAt = (index) => {
    if (index === 0 && cover?.remote) return;
    const localIndex = index - existingUrls.length;
    if (localIndex >= 0) {
      sync(local.filter((_, i) => i !== localIndex));
    }
  };

  return (
    <View style={styles.wrap}>
      <MonoMeta size="eyebrow" style={styles.label}>
        Cover photo
      </MonoMeta>
      <Pressable
        onPress={pickCover}
        accessibilityRole="button"
        accessibilityLabel="Choose cover photo"
        style={({ pressed }) => [
          styles.cover,
          { opacity: pressed ? 0.92 : 1 },
        ]}
      >
        {cover ? (
          <Image source={{ uri: cover.uri }} style={styles.coverImg} />
        ) : (
          <DuotoneVibe vibe={vibe} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.replacePill}>
          <Ionicons name="camera-outline" size={12} color={fieldGuide.cream} />
          <Text style={styles.replaceText}>Replace</Text>
        </View>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.galleryRow}
      >
        {gallery.map((item, i) => (
          <View key={`${item.uri}-${i}`} style={styles.thumb}>
            <Image source={{ uri: item.uri }} style={styles.thumbImg} />
            {!item.remote ? (
              <Pressable
                onPress={() => removeAt(i + 1)}
                style={styles.remove}
                hitSlop={6}
              >
                <Ionicons name="close" size={11} color="#FFF8F1" />
              </Pressable>
            ) : null}
          </View>
        ))}
        {allPreview.length < maxImages ? (
          <Pressable
            onPress={pickMore}
            style={({ pressed }) => [
              styles.addTile,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="add" size={20} color={fieldGuide.creamMute} />
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  wrap: {
    gap: 10,
  },
  label: {
    marginBottom: 4,
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: fieldGuide.radius.md,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  replacePill: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: fieldGuide.radius.full,
    backgroundColor: fieldGuide.canvasElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,239,230,0.18)',
  },
  replaceText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wider(9),
    color: fieldGuide.cream,
    textTransform: 'uppercase',
  },
  galleryRow: {
    gap: 6,
    paddingVertical: 4,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: fieldGuide.radius.sm,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: fieldGuide.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: 72,
    height: 72,
    borderRadius: fieldGuide.radius.sm,
    borderWidth: 1.5,
    borderColor: fieldGuide.inkLine2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
}
