import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// SAMPLE SPOTS (respot with API later)
const sampleSpots = [
  {
    id: "1",
    title: "Skyline Rooftop",
    category: "Nightlife",
    address: "Bole, Addis Ababa",
    price: "$20/hr",
    image:
    require("../../assets/spot2.jpg") ,
  },
  {
    id: "2",
    title: "Green Art Studio",
    category: "Art",
    address: "CMC, Addis Ababa",
    price: "$15/hr",
    image:
    require("../../assets/spot3.jpg") ,
  },
  {
    id: "3",
    title: "Zen Workspace",
    category: "Workspace",
    address: "4 Kilo, Addis Ababa",
    price: "$10/hr",
    image:
    require("../../assets/spot1.webp"),
  },
];
// ---------------- NEARBY SPOTS ----------------
const nearbySpots = [
  {
    id: "n1",
    title: "Unity Park",
    category: "Photoshot",
    distance: "1.2 km",
    time: "5 min",
    rating: 4.8,
    image: require("../../assets/nearby1.jpg"), // respot
  },
  {
    id: "n2",
    title: "Megenagna Sports Arena",
    category: "Sports",
    distance: "2.5 km",
    time: "10 min",
    rating: 4.6,
    image: require("../../assets/nearby2.jpg"),
  },
  {
    id: "n3",
    title: "Artville Creative Hub",
    category: "Art",
    distance: "900 m",
    time: "3 min",
    rating: 4.9,
    image: require("../../assets/nearby3.jpg"),
  },
  {
    id: "n4",
    title: "Blue Hills Workspace",
    category: "Workspace",
    distance: "1.8 km",
    time: "7 min",
    rating: 4.7,
    image: require("../../assets/nearby5.jpg"),
  },
  {
    id: "n5",
    title: "Cinema Galaxy",
    category: "Movies",
    distance: "3.2 km",
    time: "12 min",
    rating: 4.5,
    image: require("../../assets/nearby4.jpg"),
  },
  {
    id: "n6",
    title: "Mount Entoto Trail Start",
    category: "Hiking",
    distance: "4.6 km",
    time: "15 min",
    rating: 4.9,
    image: require("../../assets/nearby7.jpg"),
  },
  {
    id: "n7",
    title: "Vibe Lounge Addis",
    category: "Night Life",
    distance: "1.5 km",
    time: "6 min",
    rating: 4.4,
    image: require("../../assets/nearby8.jpg"),
  },
  {
    id: "n8",
    title: "Zen Garden Café",
    category: "Photoshot",
    distance: "700 m",
    time: "2 min",
    rating: 4.6,
    image: require("../../assets/nearby3.jpg"),
  },
  {
    id: "n9",
    title: "Addis Skate Park",
    category: "Sports",
    distance: "2.1 km",
    time: "8 min",
    rating: 4.8,
    image: require("../../assets/nearby10.jpg"),
  },
];

const categories = [
  { id: "1", name: "Photoshot", icon: "camera" },
  { id: "2", name: "Sports", icon: "football" },
  { id: "3", name: "Art", icon: "color-palette" },
  { id: "4", name: "Workspace", icon: "briefcase" },
  { id: "5", name: "Movies", icon: "film" },
  { id: "6", name: "Hiking", icon: "walk" },
  { id: "7", name: "Night Life", icon: "moon" },
  { id: "8", name: "More", icon: "apps" },
];

export const HomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const renderSpotCard = ({ item }) => (
    <TouchableOpacity
      style={styles.spotCard}
      onPress={() => navigation.navigate("SpotDetail", { spotId: item.id })}
    >
      <Image source={item.image} style={styles.spotImage} />

      <View style={styles.spotOverlay}>
        <Text style={styles.spotTitle}>{item.title}</Text>
        <Text style={styles.spotCategory}>{item.category}</Text>
        <Text style={styles.spotAddress}>{item.address}</Text>

        <View style={styles.spotFooter}>
          <Text style={styles.spotPrice}>{item.price}</Text>

          <TouchableOpacity style={styles.likeButton}>
            <Ionicons name="heart-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
  const renderNearbyCard = ({ item }) => (
    <TouchableOpacity
      style={styles.nearCard}
      onPress={() => navigation.navigate("SpotDetail", { spotId: item.id })}
    >
      <Image source={item.image} style={styles.nearImage} />
  
      <View style={styles.nearInfo}>
        <View style={styles.nearTop}>
          <Text style={styles.nearTitle}>{item.title}</Text>
          <Text style={styles.nearCategory}>{item.category}</Text>
        </View>
  
        {/* Distance + Time */}
        <View style={styles.nearMetaRow}>
          <Ionicons name="location" size={16} color="#6C63FF" />
          <Text style={styles.nearMetaText}>{item.distance}</Text>
  
          <Ionicons name="time-outline" size={16} color="#6C63FF" style={{ marginLeft: 10 }} />
          <Text style={styles.nearMetaText}>{item.time}</Text>
        </View>
  
        {/* Rating */}
        <View style={styles.nearRatingRow}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.nearRating}>{item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  return (
      <FlatList
        data={nearbySpots}
        renderItem={renderNearbyCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.greeting}>Good Morning, Nate 👋</Text>
    
              <TouchableOpacity style={styles.notificationBtn}>
                <Ionicons name="notifications-outline" size={26} color="#333" />
              </TouchableOpacity>
            </View>
    
            {/* SEARCH */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                spotholder="Find your next vibe spot"
              />
              <TouchableOpacity style={styles.filterBtn}>
                <Ionicons name="options" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
    
            {/* CATEGORIES */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
            </View>
    
            <View style={styles.categoriesContainer}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id} style={styles.categoryItem}>
                  <Ionicons name={cat.icon} size={26} color="#555" />
                  <Text style={styles.categoryText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
    
            {/* FEATURED */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Spots</Text>
              <Text style={styles.seeAll}>See All</Text>
            </View>
    
            <FlatList
              data={sampleSpots}
              horizontal
              renderItem={renderSpotCard}
              keyExtractor={(i) => i.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
    
            {/* SPOTS NEARBY TITLE */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Spots Nearby</Text>
              <TouchableOpacity style={styles.nearFilterBtn}>
                <Ionicons name="options-outline" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </>
        }
      />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdfdfd" },

  // HEADER
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontSize: 22, fontWeight: "700", color: "#333" },
  notificationBtn: {
    backgroundColor: "#eee",
    padding: 8,
    borderRadius: 12,
  },

  // SEARCH
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  // SECTION TITLES
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 20, fontWeight: "700" },
  seeAll: { fontSize: 14, color: "#6C63FF", fontWeight: "600" },

  // FEATURED CARD
  spotCard: {
    width: 240,
    height: 320,
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 16,
  },
  spotImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  spotOverlay: {
    position: "absolute",
    bottom: 0,
    padding: 14,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  spotTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  spotCategory: { fontSize: 13, color: "#eee", marginTop: 2 },
  spotAddress: { fontSize: 12, color: "#ddd", marginTop: 2 },

  spotFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spotPrice: { fontSize: 14, fontWeight: "700", color: "#fff" },
  likeButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 6,
    borderRadius: 8,
  },

  // CATEGORIES
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  categoryItem: {
    width: "25%",
    alignItems: "center",
    marginVertical: 14,
  },
  categoryText: {
    marginTop: 6,
    fontSize: 13,
    color: "#444",
    fontWeight: "500",
  },
 // NEARBY CARD - SIDE BY SIDE
nearCard: {
  width: "100%",
  backgroundColor: "#fff",
  borderRadius: 18,
  marginBottom: 16,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
  overflow: "hidden",
  flexDirection: "row",        // SIDE BY SIDE
},

nearImage: {
  width: 160,                  // FIXED IMAGE WIDTH
  height: "100%",              // FULL HEIGHT OF CARD
  borderTopLeftRadius: 18,
  borderBottomLeftRadius: 18,
},

nearInfo: {
  flex: 1,
  padding: 16,
  justifyContent: "center",
},

nearTop: {
  marginBottom: 6,
},

nearTitle: {
  fontSize: 17,
  fontWeight: "700",
  color: "#333",
},

nearCategory: {
  fontSize: 13,
  color: "#777",
  marginTop: 2,
},

nearMetaRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 10,
},

nearMetaText: {
  marginLeft: 4,
  fontSize: 13,
  color: "#555",
  fontWeight: "500",
},

nearRatingRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 6,
},

nearRating: {
  marginLeft: 4,
  fontWeight: "700",
  color: "#333",
},


});
