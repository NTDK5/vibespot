import { useQuery } from "@tanstack/react-query";
import { getAllVibes } from "../services/vibes.service";

export const useVibes = () =>
  useQuery({
    queryKey: ["vibes"],
    queryFn: getAllVibes,
    staleTime: 1000 * 60 * 10, // 10 min cache
  });
