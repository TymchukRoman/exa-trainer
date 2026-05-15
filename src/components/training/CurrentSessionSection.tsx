import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import type { GroupedTrainingByExercise } from "../../state/AppContext";
import type { ExerciseRecord } from "../../api/exercises";
import type { MuscleGroupRecord } from "../../api/muscleGroups";
import { SessionExerciseCard } from "./SessionExerciseCard";

export type SessionExerciseEntry = {
  label: string;
  sets: Array<{ id: string; reps: number; weight: number; durationMs?: number }>;
  isPending: boolean;
};

export function buildSessionExercises(params: {
  todayExercises: GroupedTrainingByExercise[];
  pendingLabels: string[];
}): SessionExerciseEntry[] {
  const { todayExercises, pendingLabels } = params;
  const loggedKeys = new Set(todayExercises.map((ex) => ex.exercise.toLowerCase()));
  const entries: SessionExerciseEntry[] = todayExercises.map((ex) => ({
    label: ex.exercise,
    sets: ex.sets,
    isPending: false,
  }));

  for (const label of pendingLabels) {
    if (loggedKeys.has(label.toLowerCase())) continue;
    entries.push({ label, sets: [], isPending: true });
  }

  return entries;
}

export function CurrentSessionSection({
  todayExercises,
  pendingLabels,
  exercises,
  muscleGroups,
  today,
  onSetSaved,
  onRemovePending,
  openEdit,
  openDelete,
}: {
  todayExercises: GroupedTrainingByExercise[];
  pendingLabels: string[];
  exercises: ExerciseRecord[];
  muscleGroups: MuscleGroupRecord[];
  today: string;
  onSetSaved: (exerciseLabel: string) => void;
  onRemovePending: (label: string) => void;
  openEdit: (
    set: { id: string; reps: number; weight: number; durationMs?: number },
    exerciseName: string,
    meta: { isBodyweightOnly: boolean; usesDuration: boolean },
  ) => void;
  openDelete: (params: { ids: string[]; label: string }) => void;
}) {
  const sessionExercises = useMemo(
    () => buildSessionExercises({ todayExercises, pendingLabels }),
    [todayExercises, pendingLabels],
  );

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Current session</Typography>

          {sessionExercises.length === 0 ? (
            <Typography color="text.secondary">
              No exercises in today&apos;s session yet. Pick a region above and tap a suggestion.
            </Typography>
          ) : (
            <Stack spacing={2} divider={<Divider />}>
              {sessionExercises.map((entry) => (
                <SessionExerciseCard
                  key={entry.label}
                  exerciseLabel={entry.label}
                  sets={entry.sets}
                  isPending={entry.isPending}
                  exercises={exercises}
                  muscleGroups={muscleGroups}
                  today={today}
                  onSetSaved={() => onSetSaved(entry.label)}
                  onRemovePending={() => onRemovePending(entry.label)}
                  onEditSet={openEdit}
                  onDeleteSet={openDelete}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
