import { invoke } from "@tauri-apps/api/core";

export type TrainingSetInput = {
  exercise: string;
  reps: number;
  weight: number;
  durationMs?: number;
  date: string;
};

type TrainingSetOutputDto = {
  id: string;
  exercise: string;
  reps: number;
  weight: number;
  duration_ms?: number;
  date_ms: number;
};

export type TrainingSetRecord = {
  id: string;
  exercise: string;
  reps: number;
  weight: number;
  durationMs?: number;
  date: string;
};

export async function saveTrainingSets(sets: TrainingSetInput[]): Promise<number> {
  return invoke<number>("save_training_sets", {
    sets: sets.map((set) => ({
      exercise: set.exercise,
      reps: set.reps,
      weight: set.weight,
      duration_ms: set.durationMs,
      date: set.date,
    })),
  });
}

export async function getTrainingSets(): Promise<TrainingSetRecord[]> {
  const rows = await invoke<TrainingSetOutputDto[]>("get_training_sets");
  return rows.map((row) => ({
    id: row.id,
    exercise: row.exercise,
    reps: row.reps,
    weight: row.weight,
    durationMs: row.duration_ms,
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
  durationMs?: number;
}): Promise<number> {
  return invoke<number>("update_training_set", {
    id: params.id,
    input: { reps: params.reps, weight: params.weight, duration_ms: params.durationMs },
  });
}

