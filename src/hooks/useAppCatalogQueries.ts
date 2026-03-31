import { useQuery } from "@tanstack/react-query";
import { getExercises } from "../api/exercises";
import { getMuscleGroups } from "../api/muscleGroups";

export function useAppCatalogQueries(isConfigured: boolean) {
  const muscleGroupsQuery = useQuery({
    queryKey: ["muscle-groups"],
    queryFn: getMuscleGroups,
  });

  const exercisesQuery = useQuery({
    queryKey: ["exercises"],
    queryFn: getExercises,
    enabled: isConfigured,
  });

  return { muscleGroupsQuery, exercisesQuery };
}
