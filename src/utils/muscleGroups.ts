import type { ExerciseRecord } from "../api/exercises";
import type { MuscleGroupRecord } from "../api/muscleGroups";

export type { MuscleGroupRecord };

function humanizeId(id: string): string {
  return id
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function buildMuscleGroupById(catalog: MuscleGroupRecord[]): Map<string, MuscleGroupRecord> {
  return new Map(catalog.map((m) => [m.id, m]));
}

/** Display label for a muscle id (catalog name or humanized slug). */
export function getMuscleGroupName(catalog: MuscleGroupRecord[], id: string): string {
  const map = buildMuscleGroupById(catalog);
  return map.get(id)?.name ?? humanizeId(id);
}

/** Comma-separated display names for exercise muscleGroup ids. */
export function formatMuscleGroupsForDisplay(catalog: MuscleGroupRecord[], ids: string[]): string {
  return ids.map((id) => getMuscleGroupName(catalog, id)).join(", ");
}

/** All canonical muscle ids from the catalog, sorted by display name. */
export function getCatalogMuscleGroupIdsSorted(catalog: MuscleGroupRecord[]): string[] {
  return [...catalog]
    .map((m) => m.id)
    .sort((a, b) =>
      getMuscleGroupName(catalog, a).localeCompare(getMuscleGroupName(catalog, b)),
    );
}

/**
 * Muscle ids for pickers: catalog plus any legacy ids present on exercises (e.g. old DB data).
 */
export function getMuscleGroupOptionsMerged(
  catalog: MuscleGroupRecord[],
  exercises: ExerciseRecord[],
): string[] {
  const set = new Set<string>();
  for (const id of getCatalogMuscleGroupIdsSorted(catalog)) {
    set.add(id);
  }
  for (const ex of exercises) {
    for (const g of ex.muscleGroup) {
      set.add(g);
    }
  }
  return [...set].sort((a, b) =>
    getMuscleGroupName(catalog, a).localeCompare(getMuscleGroupName(catalog, b)),
  );
}
