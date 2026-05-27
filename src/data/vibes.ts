export type Vibe = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
};

export const ETHIOPIAN_VIBES: Vibe[] = [
  {
    id: "coffee_culture",
    name: "Coffee Culture",
    description:
      "Slow, social Ethiopian coffee ceremonies, neighborhood cafés, and third-wave roasteries.",
    color: "#8B4513", // warm brown
    icon: "cafe",
  },
  {
    id: "nightlife",
    name: "Nightlife",
    description:
      "Late-night azmari bets, rooftop bars, live music, and neon-lit dance floors.",
    color: "#C724FF", // neon purple
    icon: "moon",
  },
  {
    id: "nature",
    name: "Nature Escape",
    description:
      "Lakes, mountains, and viewpoints where the city noise disappears into open sky.",
    color: "#1DB954", // lush green
    icon: "leaf",
  },
  {
    id: "chill",
    name: "Chill & Unplugged",
    description:
      "Quiet corners, lakeside vibes, and cozy lounges perfect for reading or slow conversations.",
    color: "#3B82F6", // calm blue
    icon: "cloud-outline",
  },
  {
    id: "cultural",
    name: "Cultural & Historic",
    description:
      "Museums, UNESCO sites, rock-hewn churches, and places that tell Ethiopia’s deep story.",
    color: "#B91C1C", // deep red
    icon: "book",
  },
  {
    id: "art",
    name: "Art & Creative",
    description:
      "Galleries, studios, creative hubs, and murals where Addis and beyond experiment visually.",
    color: "#F97316", // warm orange
    icon: "color-palette",
  },
  {
    id: "romantic",
    name: "Romantic",
    description:
      "Sunset views, candlelit terraces, and quiet waterfront walks made for two.",
    color: "#EC4899", // soft pink
    icon: "heart",
  },
  {
    id: "foodie",
    name: "Food & Flavors",
    description:
      "Injera spots, modern Ethiopian fusion, and global flavors in buzzing neighborhoods.",
    color: "#F59E0B", // golden
    icon: "restaurant",
  },
  {
    id: "social",
    name: "Social & Lively",
    description:
      "Busy terraces, community hangouts, and easy meet-up spots packed with energy.",
    color: "#6366F1", // indigo
    icon: "people",
  },
  {
    id: "adventure",
    name: "Adventure",
    description:
      "Hikes, viewpoints, off-road drives, and trips that feel a bit off the beaten path.",
    color: "#EA580C", // adventure orange
    icon: "trail-sign",
  },
];

