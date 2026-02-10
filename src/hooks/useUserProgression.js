import { useQuery } from "@tanstack/react-query";
import { getUserProgression } from "../services/recommendations.service";
import { useAuth } from "./useAuth";

export const useUserProgression = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-progression", user?.id],
    queryFn: getUserProgression,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
};

