import { useQuery } from "@tanstack/react-query";
import { getPersonalizedSpots } from "../services/recommendations.service";
import { useAuth } from "./useAuth";

export const usePersonalizedSpots = (location) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["personalized-spots", user?.id, location?.latitude, location?.longitude],
    queryFn: async () => {
      const result = await getPersonalizedSpots(
        location
          ? { lat: location.latitude, lng: location.longitude }
          : {}
      );
      return result;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
};

