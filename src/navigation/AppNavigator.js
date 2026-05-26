import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { useFirstLaunch } from '../hooks/useFirstLaunch';

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
import { EditSpotScreen } from '../screens/EditSpotScreen';
import { CollectionsScreen } from '../screens/CollectionsScreen';
import { CollectionDetailScreen } from '../screens/CollectionDetailScreen';
import { CreateCollectionScreen } from '../screens/CreateCollectionScreen';

import fieldGuide from '../theme/fieldGuide';
import FieldGuideTabBar from './FieldGuideTabBar';

// Dev-only gallery of every Field Guide component. Reached via a long
// press on the Profile tab (see listeners below) so it never pollutes
// production builds.
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
  const { isSuperAdmin } = useAuth();

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
        options={{ tabBarLabel: 'Collections' }}
      />
      {isSuperAdmin && (
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
 * Handles first-launch gating, the auth flow, and the main app stack.
 */
export const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { ready: launchReady, onboarded } = useFirstLaunch();

  if (loading || !launchReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={fieldGuide.ember} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            {!onboarded && (
              <>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              </>
            )}
            <Stack.Screen name="SignIn" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="SpotDetail" component={SpotDetailsScreen} />
            <Stack.Screen name="EditSpot" component={EditSpotScreen} />
            <Stack.Screen
              name="CollectionDetail"
              component={CollectionDetailScreen}
            />
            <Stack.Screen
              name="CreateCollection"
              component={CreateCollectionScreen}
              options={{ presentation: 'modal' }}
            />
            {/* Reachable when authed but the backend says the email is
                still unverified — register() stashes pendingVerificationEmail
                and the screen drives the rest. */}
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            {__DEV__ && (
              <Stack.Screen
                name="FieldGuidePreview"
                component={FieldGuidePreviewScreen}
                options={{ headerShown: false }}
              />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: fieldGuide.ink,
  },
});
