import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../hooks/useAuth';

// Auth & onboarding screens (default-exported in Phase 2)
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';

// Post-auth screens (Phase 3+ rewrites — leave imports untouched)
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { MapScreen } from '../screens/MapScreen';
import SpotDetailsScreen from '../screens/SpotDetailScreen';
import { AddSpotScreen } from '../screens/AddSpotScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { EditSpotScreen } from '../screens/EditSpotScreen';
import { CollectionsScreen } from '../screens/CollectionsScreen';
import { CollectionDetailScreen } from '../screens/CollectionDetailScreen';
import { CreateCollectionScreen } from '../screens/CreateCollectionScreen';
import { ReviewsScreen } from '../screens/ReviewsScreen';
import { WriteReviewScreen } from '../screens/WriteReviewScreen';
import { PhotoViewerScreen } from '../screens/PhotoViewerScreen';

import fieldGuide from '../theme/fieldGuide';
import FieldGuideTabBar from './FieldGuideTabBar';
import AuthNavigationSync from './AuthNavigationSync';
import { navigationRef } from './navigationRef';
import { linkingConfig } from './linking';
import ShareDeepLinkHandler from '../components/ShareDeepLinkHandler';
import { screen as trackScreen } from '../analytics';

// Dev-only gallery of every Field Guide component. Reached via a long
// press on the Profile tab (see listeners below) so it never pollutes
// production builds.
import BecomeSpotOwnerScreen from '../screens/BecomeSpotOwnerScreen';
import MySpotsScreen from '../screens/MySpotsScreen';
import SpotOwnerAnalyticsScreen from '../screens/SpotOwnerAnalyticsScreen';
import FieldGuidePreviewScreen from '../components/fieldguide/preview/FieldGuidePreviewScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Field Guide navigation theme — ink canvas, cream text, ember primary.
// Eliminates the white flash that DefaultTheme paints between transitions.
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: fieldGuide.ink,
    card: fieldGuide.ink,
    text: fieldGuide.cream,
    border: fieldGuide.inkLine,
    primary: fieldGuide.ember,
  },
};

/**
 * Main Tab Navigator (for authenticated users)
 */
const MainTabs = () => {
  const { canAddSpot, isSpotOwner } = useAuth();

  return (
    <Tab.Navigator
      tabBar={(props) => <FieldGuideTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{ tabBarLabel: 'Pocket' }}
      />
      {canAddSpot && !isSpotOwner && (
        <Tab.Screen
          name="AddSpot"
          component={AddSpotScreen}
          options={{ tabBarLabel: 'Add Spot' }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        listeners={({ navigation }) => ({
          // Dev-only shortcut to the Field Guide component gallery.
          tabLongPress: () => {
            if (__DEV__) {
              navigation.navigate('FieldGuidePreview');
            }
          },
        })}
      />
    </Tab.Navigator>
  );
};

/**
 * Root Navigator
 * Splash is always the cold-start route; session routing happens there.
 */
export const AppNavigator = () => {
  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      linking={linkingConfig}
      onStateChange={() => {
        const route = navigationRef.getCurrentRoute();
        if (route?.name) {
          trackScreen(route.name, route.params ?? {});
        }
      }}
    >
      <ShareDeepLinkHandler />
      <AuthNavigationSync />
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Splash"
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="SignIn" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
        />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="SpotDetail" component={SpotDetailsScreen} />
        <Stack.Screen
          name="AddSpot"
          component={AddSpotScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="EditSpot" component={EditSpotScreen} />
        <Stack.Screen name="BecomeSpotOwner" component={BecomeSpotOwnerScreen} />
        <Stack.Screen name="MySpots" component={MySpotsScreen} />
        <Stack.Screen name="SpotOwnerAnalytics" component={SpotOwnerAnalyticsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
        />
        <Stack.Screen
          name="CollectionDetail"
          component={CollectionDetailScreen}
        />
        <Stack.Screen
          name="CreateCollection"
          component={CreateCollectionScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="Reviews" component={ReviewsScreen} />
        <Stack.Screen
          name="WriteReview"
          component={WriteReviewScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="PhotoViewer"
          component={PhotoViewerScreen}
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            headerShown: false,
          }}
        />
        {__DEV__ && (
          <Stack.Screen
            name="FieldGuidePreview"
            component={FieldGuidePreviewScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
