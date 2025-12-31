import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSpotVibes } from "../services/vibes.service.js";

export const useUpdateSpotVibes = (spotId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vibeIds: string[]) =>
      addSpotVibes(spotId, vibeIds),

    onMutate: async (vibeIds) => {
      await queryClient.cancelQueries({
        queryKey: ["my-spot-vibes", spotId],
      });

      const previous = queryClient.getQueryData<string[]>([
        "my-spot-vibes",
        spotId,
      ]);

      queryClient.setQueryData(
        ["my-spot-vibes", spotId],
        vibeIds
      );

      return { previous };
    },

    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["my-spot-vibes", spotId],
          context.previous
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["spot-vibes", spotId],
      });
    },
  });
};
