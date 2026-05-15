import { CircularProgress, Container, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { CurrentSessionSection } from "../components/training/CurrentSessionSection";
import { SelectWorkoutSection } from "../components/training/SelectWorkoutSection";
import { useTrainingSession } from "../hooks/useTrainingSession";
import { useTrainingSetActions } from "../hooks/useTrainingSetActions";
import { useAppContext } from "../state/AppContext";
import { removeExerciseFromSession } from "../utils/trainingSessionStorage";

export function TrainingPage() {
  const {
    groupedTrainingSets,
    trainingSets,
    exercises,
    muscleGroups,
    isLoadingTrainings,
    isFetchingTrainings,
    refetchTrainingSets,
  } = useAppContext();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { exerciseLabels, addExercise, removeExercise, refresh } = useTrainingSession(today);
  const { openEdit, openDelete, dialogs } = useTrainingSetActions(refetchTrainingSets);

  const todayExercises = useMemo(() => {
    const group = groupedTrainingSets.find((g) => g.date === today);
    return group?.exercises ?? [];
  }, [groupedTrainingSets, today]);

  const sessionExerciseLabels = useMemo(() => {
    const seen = new Map<string, string>();
    for (const label of exerciseLabels) seen.set(label.toLowerCase(), label);
    for (const ex of todayExercises) seen.set(ex.exercise.toLowerCase(), ex.exercise);
    return [...seen.values()];
  }, [exerciseLabels, todayExercises]);

  const pendingOnlyLabels = useMemo(() => {
    const loggedKeys = new Set(todayExercises.map((ex) => ex.exercise.toLowerCase()));
    return exerciseLabels.filter((label) => !loggedKeys.has(label.toLowerCase()));
  }, [exerciseLabels, todayExercises]);

  const handleSelectExercise = (label: string) => {
    addExercise(label);
  };

  const handleSetSaved = (exerciseLabel: string) => {
    removeExerciseFromSession(exerciseLabel, today);
    refresh();
    void refetchTrainingSets();
  };

  if (isLoadingTrainings) {
    return (
      <Container maxWidth="lg" sx={{ py: 3, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        {isFetchingTrainings ? (
          <Typography color="text.secondary">Refreshing...</Typography>
        ) : null}

        <SelectWorkoutSection
          exercises={exercises}
          trainingSets={trainingSets}
          muscleGroups={muscleGroups}
          today={today}
          sessionExerciseLabels={sessionExerciseLabels}
          onSelectExercise={handleSelectExercise}
        />

        <CurrentSessionSection
          todayExercises={todayExercises}
          pendingLabels={pendingOnlyLabels}
          exercises={exercises}
          muscleGroups={muscleGroups}
          today={today}
          onSetSaved={handleSetSaved}
          onRemovePending={removeExercise}
          openEdit={openEdit}
          openDelete={openDelete}
        />
      </Stack>

      {dialogs}
    </Container>
  );
}
