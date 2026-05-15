import { useCallback, useMemo, useState } from "react";
import {
  addExerciseToSession,
  readTrainingSession,
  removeExerciseFromSession,
} from "../utils/trainingSessionStorage";

export function useTrainingSession(today: string) {
  const [version, setVersion] = useState(0);

  const session = useMemo(() => {
    void version;
    return readTrainingSession(today);
  }, [today, version]);

  const exerciseLabels = session.exerciseLabels;

  const addExercise = useCallback(
    (label: string) => {
      addExerciseToSession(label, today);
      setVersion((v) => v + 1);
    },
    [today],
  );

  const removeExercise = useCallback(
    (label: string) => {
      removeExerciseFromSession(label, today);
      setVersion((v) => v + 1);
    },
    [today],
  );

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  return {
    exerciseLabels,
    addExercise,
    removeExercise,
    refresh,
  };
}
