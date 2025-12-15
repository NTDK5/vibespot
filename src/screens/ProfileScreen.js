import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { signOutUser } from '../services/auth';

/**
 * Profile Screen
 */
export const ProfileScreen = ({ navigation }) => {
  const { user, isSuperAdmin } = useAuth();

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

  const displayName =
    user?.name ||
    'User';

  return (
    <ScrollView style={styles.container}>
      {/* 👤 Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color="#666" />
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View
          style={[
            styles.roleBadge,
            isSuperAdmin && styles.superAdminBadge,
          ]}
        >
          <Text style={styles.roleText}>
            {isSuperAdmin ? 'Superadmin' : 'User'}
          </Text>
        </View>
      </View>

      {/* 📂 Menu */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Home</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Explore')}
        >
          <Ionicons name="search-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Explore</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Map')}
        >
          <Ionicons name="map-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Map View</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* 🔒 Superadmin only */}
        {isSuperAdmin && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AddSpot')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            <Text style={[styles.menuText, styles.adminMenuText]}>
              Add Spot
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* 🚪 Sign Out */}
      <View style={styles.section}>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          style={styles.signOutButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  adminMenuText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  signOutButton: {
    margin: 16,
  },
});

