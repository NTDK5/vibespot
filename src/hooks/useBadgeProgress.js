import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getBadgeProgress } from "../services/badgeProgress.service";

export const useBadgeProgress = ({ enabled } = {}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["badge-progress", user?.id],
    queryFn: () => getBadgeProgress(user.id),
    enabled: !!user && !!enabled,
    staleTime: 1000 * 60 * 2,
  });
};

