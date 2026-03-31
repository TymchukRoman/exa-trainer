import type { ExerciseRecord } from "../api/exercises";
import type { MuscleGroupRecord } from "../api/muscleGroups";
import { buildMuscleGroupById } from "./muscleGroups";

const REGION_PRIORITY = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "hips",
  "neck",
] as const;

export type MuscleRegion = (typeof REGION_PRIORITY)[number];

export function getExerciseRegions(params: {
  exerciseLabel: string;
  exerciseMap: Map<string, ExerciseRecord>;
  muscleGroups: MuscleGroupRecord[];
}): MuscleRegion[] {
  const meta = params.exerciseMap.get(params.exerciseLabel.toLowerCase());
  const muscleById = buildMuscleGroupById(params.muscleGroups);
  const regions = new Set<MuscleRegion>();

  for (const groupId of meta?.muscleGroup ?? ["other"]) {
    const rawRegion = muscleById.get(groupId)?.region;
    const region = rawRegion?.trim().toLowerCase() as MuscleRegion | undefined;
    if (region && REGION_PRIORITY.includes(region)) regions.add(region);
  }

  return REGION_PRIORITY.filter((r) => regions.has(r));
}

export function getExercisePrimaryRegion(params: {
  exerciseLabel: string;
  exerciseMap: Map<string, ExerciseRecord>;
  muscleGroups: MuscleGroupRecord[];
}): MuscleRegion {
  return getExerciseRegions(params)[0] ?? "core";
}

