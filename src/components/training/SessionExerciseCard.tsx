import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import {
  Box,
  Collapse,
  IconButton,
  List,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { saveTrainingSets } from "../../api/trainings";
import type { ExerciseRecord } from "../../api/exercises";
import type { MuscleGroupRecord } from "../../api/muscleGroups";
import { formatMuscleGroupsForDisplay } from "../../utils/muscleGroups";
import { getExerciseRegions } from "../../utils/trainingRegions";
import { toErrorMessage } from "../../utils/errors";
import { Exercise } from "../Exercise";
import { TrainingSetItem } from "../TrainingSetItem";
import { InlineAddSetForm } from "./InlineAddSetForm";

type SessionSet = {
  id: string;
  reps: number;
  weight: number;
  durationMs?: number;
};

export function SessionExerciseCard({
  exerciseLabel,
  sets,
  isPending,
  exercises,
  muscleGroups,
  today,
  onSetSaved,
  onRemovePending,
  onEditSet,
  onDeleteSet,
}: {
  exerciseLabel: string;
  sets: SessionSet[];
  isPending: boolean;
  exercises: ExerciseRecord[];
  muscleGroups: MuscleGroupRecord[];
  today: string;
  onSetSaved: () => void;
  onRemovePending: () => void;
  onEditSet: (
    set: SessionSet,
    exerciseName: string,
    meta: { isBodyweightOnly: boolean; usesDuration: boolean },
  ) => void;
  onDeleteSet: (params: { ids: string[]; label: string }) => void;
}) {
  const [isAddingSet, setIsAddingSet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const exerciseMap = new Map(exercises.map((item) => [item.label.toLowerCase(), item]));
  const meta = exerciseMap.get(exerciseLabel.toLowerCase());
  const regions = getExerciseRegions({
    exerciseLabel,
    exerciseMap,
    muscleGroups,
  });

  const handleAddSet = async (input: { reps: number; weight: number; durationMs?: number }) => {
    setSaveError(null);
    setIsSaving(true);
    try {
      await saveTrainingSets([
        {
          exercise: exerciseLabel,
          reps: input.reps,
          weight: input.weight,
          durationMs: input.durationMs,
          date: today,
        },
      ]);
      onSetSaved();
      setIsAddingSet(false);
    } catch (error) {
      setSaveError(toErrorMessage(error, "Failed to save set."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
        <Exercise
          label={exerciseLabel}
          to={meta?.id ? `/exercise/${meta.id}` : undefined}
          regions={Array.from(new Set(regions))}
        />
        <Stack direction="row" spacing={0.5} alignItems="center">
          {isPending ? (
            <Tooltip title="Remove from session">
              <IconButton
                aria-label="Remove from session"
                size="small"
                onClick={onRemovePending}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          <Tooltip title="Add set">
            <IconButton
              aria-label="Add set"
              size="small"
              color="primary"
              onClick={() => setIsAddingSet((v) => !v)}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
        Muscle groups:{" "}
        {formatMuscleGroupsForDisplay(muscleGroups, meta?.muscleGroup ?? ["other"])}
      </Typography>

      {sets.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          No sets yet.
        </Typography>
      ) : (
        <List dense disablePadding>
          {sets.map((setItem, index) => (
            <TrainingSetItem
              key={setItem.id}
              index={index}
              reps={setItem.reps}
              weight={setItem.weight}
              durationMs={setItem.durationMs}
              isBodyweightOnly={meta?.isBodyweightOnly}
              onEdit={() =>
                onEditSet(setItem, exerciseLabel, {
                  isBodyweightOnly: meta?.isBodyweightOnly ?? false,
                  usesDuration: meta?.usesDuration ?? false,
                })
              }
              onDelete={() =>
                onDeleteSet({
                  ids: [setItem.id],
                  label: `Delete set ${index + 1} from ${exerciseLabel}?`,
                })
              }
            />
          ))}
        </List>
      )}

      <Collapse in={isAddingSet}>
        <Box sx={{ mt: 1 }}>
          {saveError ? (
            <Typography variant="caption" color="error" sx={{ display: "block", mb: 0.5 }}>
              {saveError}
            </Typography>
          ) : null}
          <InlineAddSetForm
            usesDuration={meta?.usesDuration ?? false}
            isBodyweightOnly={meta?.isBodyweightOnly ?? false}
            isSaving={isSaving}
            onSubmit={handleAddSet}
            onCancel={() => {
              setIsAddingSet(false);
              setSaveError(null);
            }}
          />
        </Box>
      </Collapse>
    </Box>
  );
}
