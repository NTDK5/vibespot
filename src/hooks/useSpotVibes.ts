import { useQuery } from "@tanstack/react-query";
import { getSpotVibes } from "../services/vibes.service.js";


export const useSpotVibes = (spotId: string) =>
  useQuery({
    queryKey: ["spot-vibes", spotId],
    queryFn: () => getSpotVibes(spotId),
    enabled: !!spotId,
  });
