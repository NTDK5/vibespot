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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { signOutUser, changePassword } from '../services/auth.service';
import { getSavedSpots, unsaveSpot } from '../services/savedSpots.service';
import { getSpotById } from '../services/spots.service';
import { getVisitedSpots } from '../services/visitedSpots.service';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ProfileScreen = ({ navigation }) => {
  const { user, isSuperAdmin } = useAuth();
  const [savedSpots, setSavedSpots] = useState([]);
  const [visitedSpots, setVisitedSpots] = useState([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [loadingVisitedSpots, setLoadingVisitedSpots] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      loadSavedSpots();
      loadVisitedSpots();
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
            await signOutUser();
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#6C5CE7', '#A29BFE']}
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

        {/* Menu Items */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Home')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="home-outline" size={24} color="#6C5CE7" />
            </View>
            <Text style={styles.menuText}>Home</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Explore')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="search-outline" size={24} color="#6C5CE7" />
            </View>
            <Text style={styles.menuText}>Explore</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Map')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="map-outline" size={24} color="#6C5CE7" />
            </View>
            <Text style={styles.menuText}>Map View</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="lock-closed-outline" size={24} color="#6C5CE7" />
            </View>
            <Text style={styles.menuText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('AddSpot')}
            >
              <View style={[styles.menuIcon, styles.adminIcon]}>
                <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
              </View>
              <Text style={[styles.menuText, styles.adminMenuText]}>Add Spot</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Saved Spots */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Spots</Text>
            <Text style={styles.sectionCount}>({savedSpots.length})</Text>
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Visited Spots</Text>
            <Text style={styles.sectionCount}>({visitedSpots.length})</Text>
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

        {/* Sign Out */}
        <View style={styles.section}>
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
    </SafeAreaView>
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
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
});
