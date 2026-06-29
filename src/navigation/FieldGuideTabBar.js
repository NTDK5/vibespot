/**
 * FieldGuideTabBar
 *
 * Custom React Navigation bottom tab bar implementing the
 * `.tabbar` / `.tabbar-item` rules from css_app.css (lines 233–272):
 *
 *   - Ink background, hairline top border in cream@8%.
 *   - 56pt tall, sitting above the home-indicator safe area.
 *   - Each item: stroke-only Ionicon (22x22) + mono uppercase label
 *     at 8.5pt with 0.18em (~1.53px) tracking.
 *   - Inactive items use cream@34%; active items use full cream and
 *     get a 4x4 ember dot anchored 2px below the label.
 *
 * The icon set stays the same as the previous tab bar — only the
 * "-outline" variants are used; the active state is signalled by
 * color and the dot, never by switching to a filled glyph.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import fieldGuide from '../theme/fieldGuide';

const ROUTE_ICON = {
  Home:        'home-outline',
  Explore:     'search-outline',
  Map:         'map-outline',
  Profile:     'person-outline',
  AddSpot:     'add-circle-outline',
  Collections: 'bookmark-outline',
};

function resolveLabel(options, routeName) {
  const raw =
    options.tabBarLabel !== undefined ? options.tabBarLabel :
    options.title !== undefined       ? options.title       :
    routeName;
  // `tabBarLabel` may be a render function — fall back to the route
  // name in that case rather than rendering a function as a child.
  return typeof raw === 'string' ? raw : routeName;
}

export default function FieldGuideTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 4,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label = resolveLabel(options, route.name);
        const iconName = ROUTE_ICON[route.name] || 'ellipse-outline';
        const tintColor = isFocused ? fieldGuide.cream : fieldGuide.creamFaint;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            android_ripple={null}
            style={styles.item}
          >
            <Ionicons name={iconName} size={22} color={tintColor} />
            <View style={styles.labelWrap}>
              <Text
                numberOfLines={1}
                style={[styles.label, { color: tintColor }]}
              >
                {String(label).toUpperCase()}
              </Text>
              {isFocused && <View style={styles.activeDot} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 14,
    backgroundColor: fieldGuide.ink,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: fieldGuide.inkLine,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  labelWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 8.5,
    letterSpacing: 1.53,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: fieldGuide.ember,
  },
});
