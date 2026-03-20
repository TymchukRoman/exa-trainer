import { invoke } from "@tauri-apps/api/core";

type ExerciseOutputDto = {
  id: string;
  label: string;
  muscleGroup: string[];
  isDefault: boolean;
};

export type ExerciseRecord = {
  id: string;
  label: string;
  muscleGroup: string[];
  isDefault: boolean;
};

export async function getExercises(): Promise<ExerciseRecord[]> {
  const result = await invoke<ExerciseOutputDto[]>("get_exercises");
  return result.map((item) => ({
    id: item.id,
    label: item.label,
    muscleGroup: item.muscleGroup,
    isDefault: item.isDefault,
  }));
}

export async function createExercise(input: {
  label: string;
  muscleGroup: string[];
}): Promise<string> {
  return invoke<string>("create_exercise", { input });
}

export async function deleteExercise(id: string): Promise<number> {
  return invoke<number>("delete_exercise", { id });
}
