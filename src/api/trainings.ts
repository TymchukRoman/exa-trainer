import { invoke } from "@tauri-apps/api/core";

export type TrainingSetInput = {
  exercise: string;
  reps: number;
  weight: number;
  date: string;
};

type TrainingSetOutputDto = {
  id: string;
  exercise: string;
  reps: number;
  weight: number;
  date_ms: number;
};

export type TrainingSetRecord = {
  id: string;
  exercise: string;
  reps: number;
  weight: number;
  date: string;
};

export async function saveTrainingSets(sets: TrainingSetInput[]): Promise<number> {
  return invoke<number>("save_training_sets", { sets });
}

export async function getTrainingSets(): Promise<TrainingSetRecord[]> {
  const rows = await invoke<TrainingSetOutputDto[]>("get_training_sets");
  return rows.map((row) => ({
    id: row.id,
    exercise: row.exercise,
    reps: row.reps,
    weight: row.weight,
    date: new Date(row.date_ms).toISOString().slice(0, 10),
  }));
}

export async function deleteTrainingSet(id: string): Promise<number> {
  return invoke<number>("delete_training_set", { id });
}

export async function updateTrainingSet(params: {
  id: string;
  reps: number;
  weight: number;
}): Promise<number> {
  return invoke<number>("update_training_set", {
    id: params.id,
    input: { reps: params.reps, weight: params.weight },
  });
}

