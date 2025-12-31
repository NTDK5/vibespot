import { useQuery } from "@tanstack/react-query";
import { getMySpotVibes } from "../services/vibes.service.js";


export const useMySpotVibes = (spotId: string) =>
  useQuery({
    queryKey: ["my-spot-vibes", spotId],
    queryFn: () => getMySpotVibes(spotId),
    enabled: !!spotId,
  });
