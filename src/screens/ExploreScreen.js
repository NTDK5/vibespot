import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpotCard } from '../components/SpotCard';
import { getAllSpots, searchSpots } from '../services/spots.service';
import { CATEGORIES } from '../utils/constants';
import { NearbySpotCard } from '../components/NearbySpotCard';
import {useTheme} from '../context/ThemeContext'
/**
 * Explore Screen
 * Browse and search spots
 */
export const ExploreScreen = ({ navigation }) => {
  const [spots, setSpots] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const {theme} = useTheme()
  /* ----------------------------------
     Initial load (no filters)
  ----------------------------------- */
  useEffect(() => {
    fetchSpots();
  }, [selectedCategory]);

  /* ----------------------------------
     Debounced Search
  ----------------------------------- */
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSpots();
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  /* ----------------------------------
     Fetch Spots (Search + Filters)
  ----------------------------------- */
  const fetchSpots = async () => {
    setLoading(true);
    try {
      // If no search and no category → fallback to all spots
      if (!searchQuery.trim() && !selectedCategory) {
        const data = await getAllSpots();
        setSpots(data);
        return;
      }

      const result = await searchSpots({
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
      });

      setSpots(result?.data || []);
    } catch (error) {
      console.error('Error fetching spots:', error);
      setSpots([]);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
     Render Spot Card
  ----------------------------------- */
  const renderSpot = ({ item }) => (
    <NearbySpotCard
      spot={item}
      onPress={() =>
        navigation.navigate('SpotDetail', { spotId: item.id })
      }
    />
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      {/* 🔍 Search Bar */}
      <View style={[styles.searchContainer, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Ionicons name="search" size={20} color={theme.text} />
        <TextInput
          style={[styles.searchInput,{color: theme.text}]}
          placeholder="Search spots..."
          placeholderTextColor={theme.text}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* 🏷️ Categories */}
      <View style={[styles.categoriesContainer, {backgroundColor:theme.background,}]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', label: 'All', icon: 'grid' }, ...CATEGORIES]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const active =
              (item.id === 'all' && !selectedCategory) ||
              selectedCategory === item.id;

            return (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  {backgroundColor: theme.surface},
                  active && {backgroundColor: theme.primary},

                ]}
                onPress={() =>
                  setSelectedCategory(item.id === 'all' ? null : item.id)
                }
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={active ? "#fff": theme.text}
                />
                <Text
                  style={[
                    styles.categoryText,
                    {color: theme.text},
                    active && styles.categoryTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 📍 Spot List */}
      <FlatList
        data={spots}
        renderItem={renderSpot}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery || selectedCategory
                  ? 'No results found'
                  : 'No spots available'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

/* ----------------------------------
   Styles
----------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical:15
    // backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation:4
    // marginTop:10
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    marginLeft: 8,
  },
  categoriesContainer: {
    // backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    // borderBottomColor: '#e0e0e0',
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    // backgroundColor: '#f5f5f5',
    marginRight: 8,
    elevation:2
  },
  categoryChipActive: {
    // backgroundColor: '#007AFF',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
