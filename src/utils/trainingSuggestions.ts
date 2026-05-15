import type { ExerciseRecord } from "../api/exercises";
import type { MuscleGroupRecord } from "../api/muscleGroups";
import type { TrainingSetRecord } from "../api/trainings";
import { getExerciseRegions, type MuscleRegion } from "./trainingRegions";

export type WorkoutSuggestionItem = {
  label: string;
  lastDoneDate?: string;
  regions: string[];
  exerciseId?: string;
};

export function buildLastDoneByExercise(
  trainingSets: TrainingSetRecord[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const set of trainingSets) {
    const key = set.exercise.toLowerCase();
    const current = map.get(key);
    if (!current || set.date > current) {
      map.set(key, set.date);
    }
  }
  return map;
}

export function getExercisesDoneToday(
  trainingSets: TrainingSetRecord[],
  today: string,
): Set<string> {
  const done = new Set<string>();
  for (const set of trainingSets) {
    if (set.date === today) {
      done.add(set.exercise.toLowerCase());
    }
  }
  return done;
}

export function filterExercisesByRegion(
  exercises: ExerciseRecord[],
  region: string,
  muscleGroups: MuscleGroupRecord[],
): ExerciseRecord[] {
  const exerciseMap = new Map(exercises.map((item) => [item.label.toLowerCase(), item]));
  return exercises.filter((exercise) => {
    const regions = getExerciseRegions({
      exerciseLabel: exercise.label,
      exerciseMap,
      muscleGroups,
    });
    return regions.includes(region as MuscleRegion);
  });
}

function exerciseLabelMatchesRegion(
  label: string,
  region: string,
  exerciseMap: Map<string, ExerciseRecord>,
  muscleGroups: MuscleGroupRecord[],
): boolean {
  const regions = getExerciseRegions({
    exerciseLabel: label,
    exerciseMap,
    muscleGroups,
  });
  return regions.includes(region as MuscleRegion);
}

export function buildWorkoutSuggestions(params: {
  exercises: ExerciseRecord[];
  trainingSets: TrainingSetRecord[];
  muscleGroups: MuscleGroupRecord[];
  region: string;
  today: string;
  sessionExerciseLabels: string[];
}): {
  previouslyDone: WorkoutSuggestionItem[];
  tryThis: WorkoutSuggestionItem[];
} {
  const { exercises, trainingSets, muscleGroups, region, today, sessionExerciseLabels } =
    params;

  const exerciseMap = new Map(exercises.map((item) => [item.label.toLowerCase(), item]));
  const lastDoneByExercise = buildLastDoneByExercise(trainingSets);
  const doneToday = getExercisesDoneToday(trainingSets, today);

  const excluded = new Set<string>();
  for (const label of doneToday) excluded.add(label);
  for (const label of sessionExerciseLabels) {
    excluded.add(label.toLowerCase());
  }

  const uniqueHistoryLabels = new Set<string>();
  for (const set of trainingSets) {
    uniqueHistoryLabels.add(set.exercise);
  }

  const previouslyDone: WorkoutSuggestionItem[] = [];
  for (const label of uniqueHistoryLabels) {
    const key = label.toLowerCase();
    if (excluded.has(key)) continue;
    if (!exerciseLabelMatchesRegion(label, region, exerciseMap, muscleGroups)) continue;

    const lastDoneDate = lastDoneByExercise.get(key);
    if (!lastDoneDate) continue;

    const meta = exerciseMap.get(key);
    previouslyDone.push({
      label,
      lastDoneDate,
      regions: getExerciseRegions({ exerciseLabel: label, exerciseMap, muscleGroups }),
      exerciseId: meta?.id,
    });
  }

  previouslyDone.sort((a, b) => {
    const dateA = a.lastDoneDate ?? "";
    const dateB = b.lastDoneDate ?? "";
    return dateA.localeCompare(dateB);
  });

  const tryThis: WorkoutSuggestionItem[] = [];
  for (const exercise of filterExercisesByRegion(exercises, region, muscleGroups)) {
    const key = exercise.label.toLowerCase();
    if (excluded.has(key)) continue;
    if (lastDoneByExercise.has(key)) continue;

    tryThis.push({
      label: exercise.label,
      regions: getExerciseRegions({
        exerciseLabel: exercise.label,
        exerciseMap,
        muscleGroups,
      }),
      exerciseId: exercise.id,
    });
  }

  tryThis.sort((a, b) => a.label.localeCompare(b.label));

  return { previouslyDone, tryThis };
}
