import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { signOutUser, changePassword } from '../services/auth.service';
import { getSavedSpots, unsaveSpot } from '../services/savedSpots.service';
import { getSpotById } from '../services/spots.service';
import { getVisitedSpots } from '../services/visitedSpots.service';
import { getUserCollections } from '../services/collections.service';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Switch, Dimensions } from 'react-native';
import { Directions } from 'react-native-gesture-handler';
import { useUserProgression } from '../hooks/useUserProgression';
import { Platform } from 'react-native';
const { width } = Dimensions.get("window");
export const ProfileScreen = ({ navigation }) => {
  const { user, isSuperAdmin, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [savedSpots, setSavedSpots] = useState([]);
  const [visitedSpots, setVisitedSpots] = useState([]);
  const [myCollections, setMyCollections] = useState([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [loadingVisitedSpots, setLoadingVisitedSpots] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const {
    data: progression,
    isLoading: loadingProgression,
  } = useUserProgression();
  const [lastBadgeId, setLastBadgeId] = useState(null);

  // Show a toast-like alert when a new badge is unlocked
  useEffect(() => {
    if (progression?.newestBadge?.id && progression.newestBadge.id !== lastBadgeId) {
      const name = progression.newestBadge.name || 'badge';
      const message = `🎉 You unlocked the ${name} badge!`;

      if (Platform.OS === 'android') {
        // Prefer native toast on Android
        try {
          const { ToastAndroid } = require('react-native');
          ToastAndroid.show(message, ToastAndroid.LONG);
        } catch {
          Alert.alert('Achievement unlocked', message);
        }
      } else {
        Alert.alert('Achievement unlocked', message);
      }

      setLastBadgeId(progression.newestBadge.id);
    }
  }, [progression, lastBadgeId]);

  useEffect(() => {
    if (user) {
      loadSavedSpots();
      loadVisitedSpots();
      loadMyCollections();
    }
  }, [user]);

  const loadSavedSpots = async () => {
    setLoadingSpots(true);
    try {
      const spots = await getSavedSpots();
      if (!spots.error) {
        setSavedSpots(Array.isArray(spots) ? spots : []);
      }
    } catch (error) {
      console.error('Error loading saved spots:', error);
    } finally {
      setLoadingSpots(false);
    }
  };

  const loadVisitedSpots = async () => {
    setLoadingVisitedSpots(true);
    try {
      const spots = await getVisitedSpots();
      if (!spots.error) {
        setVisitedSpots(Array.isArray(spots) ? spots : []);
      }
    } catch (error) {
      console.error('Error loading visited spots:', error);
    } finally {
      setLoadingVisitedSpots(false);
    }
  };

  const loadMyCollections = async () => {
    setLoadingCollections(true);
    try {
      const collections = await getUserCollections(user.id);
      if (!collections.error) {
        setMyCollections(Array.isArray(collections) ? collections : []);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadSavedSpots(),
        loadVisitedSpots(),
        loadMyCollections(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (result.error) {
              Alert.alert('Error', result.error);
            }
            // Navigation will automatically redirect to login due to user state change
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUnsaveSpot = async (spotId) => {
    Alert.alert(
      'Remove Saved Spot',
      'Are you sure you want to remove this spot from your saved list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await unsaveSpot(spotId);
            if (!result.error) {
              loadSavedSpots();
            } else {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const displayName = user?.name || 'User';
  const renderItem = (label, icon, onPress, admin = false) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingsRow}>
        <View style={styles.settingsLeft}>
          <View
            style={[
              styles.iconPill,
              { backgroundColor: admin ? "#007AFF20" : "#007A8C15" },
            ]}
          >
            <Ionicons name={icon} size={18} color={admin ? "#007AFF" : theme.primary} />
          </View>
  
          <Text style={[styles.settingsText, { color: theme.text }]}>
            {label}
          </Text>
        </View>
  
        <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} 
          />
        }
        style={styles.content}
      >
        <LinearGradient
          colors={["#007A8C", "#0FA4B8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}

          style={styles.header}
        >
          <View style={styles.avatarContainer}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#6C5CE7" />
              </View>
            )}
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.roleBadge, isSuperAdmin && styles.superAdminBadge]}>
            <Text style={styles.roleText}>
              {isSuperAdmin ? 'Superadmin' : 'User'}
            </Text>
          </View>
        </LinearGradient>

        {/* Level & XP Progress */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Level</Text>
              <Text style={[styles.sectionCount, { color: theme.textMuted }]}>
                {loadingProgression || !progression
                  ? 'Loading progression...'
                  : `Level ${progression.level} • ${progression.xp} XP`}
              </Text>
            </View>
          </View>
          {loadingProgression || !progression ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.surfaceAlt || '#E5E7EB' }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.primary,
                      width: `${Math.min(
                        (progression.xp / progression.nextLevelXp) * 100,
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
                {progression.xp} / {progression.nextLevelXp} XP to Level {progression.level + 1}
              </Text>
              {progression.newestBadge && (
                <View style={styles.newBadgePill}>
                  <Ionicons name="sparkles-outline" size={16} color={theme.primary} />
                  <Text style={[styles.newBadgeText, { color: theme.primary }]}>
                    New: {progression.newestBadge.name}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Badges */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Badges</Text>
          </View>
          {loadingProgression || !progression ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : !Array.isArray(progression.badges) || progression.badges.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="ribbon-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No badges yet</Text>
              <Text style={styles.emptySubtext}>
                Explore new spots, react with vibes, and grow your collections to unlock badges.
              </Text>
            </View>
          ) : (
            <View style={styles.badgesGrid}>
              {(progression.badges || []).map((badge) => {
                const unlocked = badge.unlocked;
                const isNewest = progression.newestBadge?.id === badge.id;
                return (
                  <View
                    key={badge.id}
                    style={[
                      styles.badgeItem,
                      {
                        borderColor: unlocked ? theme.primary : theme.border,
                        backgroundColor: unlocked ? theme.primarySoft || '#E0F2FE' : theme.surfaceAlt || '#F3F4F6',
                        opacity: unlocked ? 1 : 0.6,
                      },
                    ]}
                  >
                    <View style={styles.badgeIconWrap}>
                      <Text style={styles.badgeIconText}>{badge.icon || '🏅'}</Text>
                    </View>
                    <Text
                      style={[
                        styles.badgeName,
                        { color: unlocked ? theme.text : theme.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {badge.name}
                    </Text>
                    <Text
                      style={[styles.badgeDescription, { color: theme.textMuted }]}
                      numberOfLines={2}
                    >
                      {badge.description}
                    </Text>
                    <View style={styles.badgeFooterRow}>
                      <Text style={[styles.badgeStatus, { color: unlocked ? '#16A34A' : theme.textMuted }]}>
                        {unlocked ? 'Unlocked' : 'Locked'}
                      </Text>
                      {isNewest && (
                        <View style={styles.newChip}>
                          <Text style={styles.newChipText}>New</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
  {/* Dark Mode */}
  <View style={styles.settingsRow}>
    <View style={[styles.settingsLeft]}>
      <View style={[styles.iconPill, { backgroundColor: "#007A8C20" }]}>
        <Ionicons name={isDark ? "moon" : "sunny"} size={18} color="#007A8C" />
      </View>
      <Text style={[styles.settingsText, { color: theme.text }]}>Dark Mode</Text>
    </View>

    <Switch
      trackColor={{ false: "#ccc", true: "#007A8C" }}
      thumbColor="#fff"
      onValueChange={toggleTheme}
      value={isDark}
    />
  </View>

  {renderItem("Home", "home-outline", () => navigation.navigate("Home"))}
  {renderItem("Explore", "search-outline", () => navigation.navigate("Explore"))}
  {renderItem("Map View", "map-outline", () => navigation.navigate("Map"))}
  {renderItem("Change Password", "lock-closed-outline", () =>
    setShowPasswordModal(true)
  )}

  {isSuperAdmin &&
    renderItem("Add Spot", "add-circle-outline", () =>
      navigation.navigate("AddSpot"),
      true
    )}
</View>

        {/* Saved Spots */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Saved Spots</Text>
            <Text style={[styles.sectionCount, { color: theme.textMuted }]}>({savedSpots.length})</Text>
          </View>

          {loadingSpots ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6C5CE7" />
            </View>
          ) : savedSpots.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No saved spots yet</Text>
              <Text style={styles.emptySubtext}>Save spots to view them here</Text>
            </View>
          ) : (
            <View style={styles.spotsList}>
              {savedSpots.map((spot) => (
                <TouchableOpacity
                  key={spot.id}
                  style={styles.spotCard}
                  onPress={() => navigation.navigate('SpotDetail', { spotId: spot.id })}
                >
                  <Image
                    source={{ uri: spot.images?.[0] || spot.thumbnail }}
                    style={styles.spotImage}
                    resizeMode="cover"
                  />
                  <View style={styles.spotInfo}>
                    <Text style={styles.spotTitle} numberOfLines={1}>
                      {spot.title}
                    </Text>
                    <Text style={styles.spotCategory} numberOfLines={1}>
                      {spot.category?.replace('_', ' ')}
                    </Text>
                    <View style={styles.spotMeta}>
                      <View style={styles.spotRating}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.spotRatingText}>
                          {spot.ratingAvg?.toFixed(1) || '0.0'}
                        </Text>
                      </View>
                      <Text style={styles.spotPrice}>{spot.priceRange?.toUpperCase()}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.unsaveButton}
                    onPress={() => handleUnsaveSpot(spot.id)}
                  >
                    <Ionicons name="bookmark" size={20} color="#ff9900" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>



        {/* Visited Spots */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Visited Spots</Text>
            <Text style={[styles.sectionCount, { color: theme.textMuted }]}>({visitedSpots.length})</Text>
          </View>

          {loadingVisitedSpots ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6C5CE7" />
            </View>
          ) : visitedSpots.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No visited spots yet</Text>
              <Text style={styles.emptySubtext}>Mark spots as visited to see them here</Text>
            </View>
          ) : (
            <View style={styles.spotsList}>
              {visitedSpots.map((spot) => (
                <TouchableOpacity
                  key={spot.id}
                  style={styles.spotCard}
                  onPress={() => navigation.navigate('SpotDetail', { spotId: spot.id })}
                >
                  <Image
                    source={{ uri: spot.images?.[0] || spot.thumbnail }}
                    style={styles.spotImage}
                    resizeMode="cover"
                  />
                  <View style={styles.spotInfo}>
                    <Text style={[styles.spotTitle, { color: theme.text }]} numberOfLines={1}>
                      {spot.title}
                    </Text>
                    <Text style={[styles.spotCategory, { color: theme.textMuted }]} numberOfLines={1}>
                      {spot.category?.replace('_', ' ')}
                    </Text>
                    <View style={styles.spotMeta}>
                      <View style={styles.spotRating}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.spotRatingText}>
                          {spot.ratingAvg?.toFixed(1) || '0.0'}
                        </Text>
                      </View>
                      <View style={styles.visitedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                        <Text style={styles.visitedBadgeText}>Visited</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* My Collections */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>My Collections</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Collections')}>
              <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {loadingCollections ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6C5CE7" />
            </View>
          ) : myCollections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="albums-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No collections yet</Text>
              <Text style={styles.emptySubtext}>Create collections to organize your favorite spots</Text>
              <TouchableOpacity
                style={styles.createCollectionButton}
                onPress={() => navigation.navigate('Collections')}
              >
                <Text style={styles.createCollectionButtonText}>Create Collection</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.collectionsList}
            >
              {myCollections.slice(0, 5).map((collection) => {
                const coverImage =
                  collection.coverImage ||
                  collection.spots?.[0]?.spot?.thumbnail ||
                  collection.spots?.[0]?.spot?.images?.[0];
                return (
                  <TouchableOpacity
                    key={collection.id}
                    style={styles.collectionCard}
                    onPress={() =>
                      navigation.navigate('CollectionDetail', {
                        collectionId: collection.id,
                      })
                    }
                  >
                    <Image
                      source={{ uri: coverImage }}
                      style={styles.collectionImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.collectionGradient}
                    />
                    <View style={styles.collectionInfo}>
                      <Text style={styles.collectionTitle} numberOfLines={2}>
                        {collection.title}
                      </Text>
                      <Text style={styles.collectionCount}>
                        {collection.spotCount || 0} spots
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Sign Out */}
        <View style={[styles.section, {backgroundColor: theme.surfaceAlt}]}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="danger"
            style={styles.signOutButton}
          />
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                placeholder="Current Password"
                secureTextEntry
                value={passwordData.currentPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, currentPassword: text })
                }
              />
              <TextInput
                style={styles.modalInput}
                placeholder="New Password"
                secureTextEntry
                value={passwordData.newPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, newPassword: text })
                }
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Confirm New Password"
                secureTextEntry
                value={passwordData.confirmPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, confirmPassword: text })
                }
              />

              <Button
                title={changingPassword ? 'Changing...' : 'Change Password'}
                onPress={handleChangePassword}
                loading={changingPassword}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  superAdminBadge: {
    backgroundColor: 'rgba(255,215,0,0.3)',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  
    // Android elevation
    elevation: 6,
  
    // prevents children from overflowing rounded corners
    overflow: "hidden",
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsCard: {
    borderRadius: 20,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginTop: 20,
  
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  
  settingsText: {
    fontSize: 15,
    fontWeight: "500",
  },
  
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C5CE720',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  adminIcon: {
    backgroundColor: '#007AFF20',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  adminMenuText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionCount: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  spotsList: {
    padding: 16,
  },
  spotCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  spotImage: {
    width: 100,
    height: 100,
  },
  spotInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  spotTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  spotCategory: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  spotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spotRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spotRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  spotPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  unsaveButton: {
    padding: 12,
    justifyContent: 'center',
  },
  signOutButton: {
    margin: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalBody: {
    gap: 16,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButton: {
    marginTop: 8,
  },
  visitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  visitedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  seeAll: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '600',
  },
  collectionsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  collectionCard: {
    width: 200,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  collectionImage: {
    width: '100%',
    height: '100%',
  },
  collectionGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  collectionInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  collectionCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  createCollectionButton: {
    marginTop: 16,
    backgroundColor: '#007A8C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createCollectionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  progressBar: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  newBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(22,163,74,0.08)',
    marginTop: 4,
    gap: 6,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 12,
  },
  badgeItem: {
    width: (width - 16 * 2 - 12) / 2,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  badgeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeIconText: {
    fontSize: 18,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  badgeDescription: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 4,
  },
  badgeFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  newChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#F97316',
  },
  newChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});
