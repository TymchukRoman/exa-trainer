import { TrainingSetRecord } from "../api/trainings";

export type TopExerciseStat = {
  exercise: string;
  count: number;
  avgWeight: number;
};

export type PersonalRecordStat = {
  exercise: string;
  weight: number;
  reps: number;
  date: string;
};

export type DaySummary = {
  count: number;
  exercises: Array<{ exercise: string; sets: number }>;
};

export function getTopExercises(trainingSets: TrainingSetRecord[]): TopExerciseStat[] {
  const map = new Map<string, { count: number; totalWeight: number }>();
  for (const set of trainingSets) {
    const current = map.get(set.exercise) ?? { count: 0, totalWeight: 0 };
    current.count += 1;
    current.totalWeight += set.weight;
    map.set(set.exercise, current);
  }

  return [...map.entries()]
    .map(([exercise, v]) => ({
      exercise,
      count: v.count,
      avgWeight: v.count ? v.totalWeight / v.count : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function getPersonalRecords(trainingSets: TrainingSetRecord[]): PersonalRecordStat[] {
  const map = new Map<string, { weight: number; reps: number; date: string }>();

  for (const set of trainingSets) {
    const current = map.get(set.exercise);
    if (!current) {
      map.set(set.exercise, { weight: set.weight, reps: set.reps, date: set.date });
      continue;
    }
    if (set.weight > current.weight) {
      map.set(set.exercise, { weight: set.weight, reps: set.reps, date: set.date });
    } else if (set.weight === current.weight && set.reps > current.reps) {
      map.set(set.exercise, { weight: set.weight, reps: set.reps, date: set.date });
    }
  }

  return [...map.entries()]
    .map(([exercise, record]) => ({ exercise, ...record }))
    .sort((a, b) => b.weight - a.weight);
}

export function getDaySummaryMap(trainingSets: TrainingSetRecord[]): Map<string, DaySummary> {
  const map = new Map<string, Map<string, number>>();
  for (const set of trainingSets) {
    const byExercise = map.get(set.date) ?? new Map<string, number>();
    byExercise.set(set.exercise, (byExercise.get(set.exercise) ?? 0) + 1);
    map.set(set.date, byExercise);
  }

  const summary = new Map<string, DaySummary>();
  for (const [date, byExercise] of map.entries()) {
    const exercises = [...byExercise.entries()]
      .map(([exercise, sets]) => ({ exercise, sets }))
      .sort((a, b) => b.sets - a.sets);
    const count = exercises.reduce((acc, item) => acc + item.sets, 0);
    summary.set(date, { count, exercises });
  }
  return summary;
}

