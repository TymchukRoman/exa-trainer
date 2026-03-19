import exercisesCatalogJson from "../data/exercises.json";

export type ExerciseCatalogItem = {
  label: string;
  muscleGroup: string[];
};

const exercisesCatalog = exercisesCatalogJson as ExerciseCatalogItem[];

const byLabel = new Map<string, ExerciseCatalogItem>(
  exercisesCatalog.map((item) => [item.label.toLowerCase(), item]),
);

export function getExercisesCatalog(): ExerciseCatalogItem[] {
  return exercisesCatalog;
}

export function getExerciseMeta(label: string): ExerciseCatalogItem | null {
  return byLabel.get(label.toLowerCase()) ?? null;
}

