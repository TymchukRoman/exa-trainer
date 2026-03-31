import { invoke } from "@tauri-apps/api/core";

export type MuscleGroupRecord = {
  id: string;
  name: string;
  region: string;
  altNames: string[];
  imageUrl: string | null;
  description?: string;
};

export async function getMuscleGroups(): Promise<MuscleGroupRecord[]> {
  return invoke<MuscleGroupRecord[]>("get_muscle_groups");
}
