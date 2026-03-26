import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { saveTrainingSets } from "../api/trainings";
import { useAppContext } from "../state/AppContext";
import { parseDurationToMs } from "../utils/duration";
import { toErrorMessage } from "../utils/errors";
import { TrainingSetItem } from "./TrainingSetItem";

type ExerciseSet = {
  reps: number;
  weight: number;
  durationMs?: number;
};

type ExerciseDraft = {
  id: string;
  name: string;
  isBodyweightOnly: boolean;
  usesDuration: boolean;
  sets: ExerciseSet[];
  isAddingSet: boolean;
  metricInput: string;
  weightInput: string;
};

export function NewTrainingDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { refetchTrainingSets, exercises: exerciseOptions } = useAppContext();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateStr, setDateStr] = useState(today);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [exerciseInputValue, setExerciseInputValue] = useState("");
  const [selectedExerciseOption, setSelectedExerciseOption] = useState<
    { label: string; muscleGroup: string[]; isBodyweightOnly: boolean; usesDuration: boolean } | string | null
  >(null);
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDateStr(today);
    setIsPickerOpen(false);
    setExerciseInputValue("");
    setSelectedExerciseOption(null);
    setExercises([]);
    setStatus(null);
  }, [open, today]);

  const canSave = exercises.some((exercise) => exercise.sets.length > 0);
  function resolveExerciseName() {
    if (typeof selectedExerciseOption === "string") {
      return selectedExerciseOption.trim();
    }
    if (selectedExerciseOption && typeof selectedExerciseOption === "object") {
      return selectedExerciseOption.label.trim();
    }
    return exerciseInputValue.trim();
  }

  function addExercise() {
    const name = resolveExerciseName();
    if (!name) {
      return;
    }

    const alreadyExists = exercises.some(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );
    if (alreadyExists) {
      setStatus({ type: "error", message: "Exercise already added." });
      return;
    }

    const meta = exerciseOptions.find((item) => item.label.toLowerCase() === name.toLowerCase());

    setExercises((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        isBodyweightOnly: meta?.isBodyweightOnly ?? false,
        usesDuration: meta?.usesDuration ?? false,
        sets: [],
        isAddingSet: false,
        metricInput: "",
        weightInput: "",
      },
    ]);
    setSelectedExerciseOption(null);
    setExerciseInputValue("");
    setIsPickerOpen(false);
    setStatus(null);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New training</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

          <DatePicker
            label="Date"
            value={dayjs(dateStr)}
            onChange={(value: Dayjs | null) => {
              if (!value) return;
              setDateStr(value.format("YYYY-MM-DD"));
            }}
            slotProps={{ textField: { fullWidth: true } }}
          />

          <Divider />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Exercises</Typography>
            <Button variant="outlined" onClick={() => setIsPickerOpen((v) => !v)}>
              Add exercise
            </Button>
          </Stack>

          {isPickerOpen ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Autocomplete
                freeSolo
                options={exerciseOptions}
                value={selectedExerciseOption}
                inputValue={exerciseInputValue}
                onChange={(_, value) => setSelectedExerciseOption(value)}
                onInputChange={(_, value) => setExerciseInputValue(value)}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.label
                }
                renderOption={(props, option) => (
                  <li {...props}>
                    <Stack>
                      <Typography>{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.muscleGroup.join(", ")}
                      </Typography>
                    </Stack>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Exercise name"
                    placeholder="Pick or type custom exercise"
                  />
                )}
                fullWidth
              />
              <Button variant="contained" onClick={addExercise}>
                Add
              </Button>
            </Stack>
          ) : null}

          {exercises.length === 0 ? (
            <Typography color="text.secondary">
              No exercises added yet.
            </Typography>
          ) : null}

          <Stack spacing={2}>
            {exercises.map((exercise) => (
              <Card key={exercise.id} variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" fontWeight={700}>
                        {exercise.name}
                      </Typography>
                      <Button
                        color="error"
                        onClick={() =>
                          setExercises((prev) => prev.filter((item) => item.id !== exercise.id))
                        }
                      >
                        Remove
                      </Button>
                    </Stack>

                    {exercise.sets.length === 0 ? (
                      <Typography color="text.secondary">No sets yet.</Typography>
                    ) : (
                      <List dense disablePadding>
                        {exercise.sets.map((setItem, index) => (
                          <TrainingSetItem
                            key={`${exercise.id}-${index}`}
                            index={index}
                            reps={setItem.reps}
                            weight={setItem.weight}
                            durationMs={setItem.durationMs}
                            isBodyweightOnly={exercise.isBodyweightOnly}
                          />
                        ))}
                      </List>
                    )}

                    {exercise.isAddingSet ? (
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <TextField
                          label={exercise.usesDuration ? "Duration" : "Reps"}
                          placeholder={exercise.usesDuration ? "1h 2m 1s" : undefined}
                          type={exercise.usesDuration ? "text" : "number"}
                          value={exercise.metricInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            setExercises((prev) =>
                              prev.map((item) =>
                                item.id === exercise.id ? { ...item, metricInput: value } : item,
                              ),
                            );
                          }}
                          inputProps={exercise.usesDuration ? undefined : { min: 1 }}
                          fullWidth
                        />
                        {exercise.isBodyweightOnly ? null : (
                          <TextField
                            label="Weight (kg)"
                            type="number"
                            value={exercise.weightInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              setExercises((prev) =>
                                prev.map((item) =>
                                  item.id === exercise.id ? { ...item, weightInput: value } : item,
                                ),
                              );
                            }}
                            inputProps={{ min: -999999, step: 0.5 }}
                            fullWidth
                          />
                        )}
                        <Button
                          variant="contained"
                          onClick={() => {
                            const reps = exercise.usesDuration ? 1 : Number(exercise.metricInput);
                            const parsedDuration = exercise.usesDuration
                              ? parseDurationToMs(exercise.metricInput)
                              : null;
                            const durationMs = parsedDuration ?? undefined;
                            const weight = exercise.isBodyweightOnly ? 0 : Number(exercise.weightInput);

                            if (exercise.usesDuration && !parsedDuration) {
                              setStatus({
                                type: "error",
                                message: `Invalid duration for ${exercise.name}. Use format like "1h 2m 1s".`,
                              });
                              return;
                            }
                            if (!exercise.usesDuration && (!Number.isFinite(reps) || reps <= 0)) {
                              setStatus({
                                type: "error",
                                message: `Invalid reps for ${exercise.name}.`,
                              });
                              return;
                            }
                            if (!exercise.isBodyweightOnly && !Number.isFinite(weight)) {
                              setStatus({
                                type: "error",
                                message: `Invalid weight for ${exercise.name}.`,
                              });
                              return;
                            }

                            setExercises((prev) =>
                              prev.map((item) =>
                                item.id === exercise.id
                                  ? {
                                      ...item,
                                      sets: [...item.sets, { reps, weight, durationMs }],
                                      metricInput: "",
                                      weightInput: "",
                                      isAddingSet: false,
                                    }
                                  : item,
                              ),
                            );
                            setStatus(null);
                          }}
                        >
                          Add set
                        </Button>
                      </Stack>
                    ) : (
                      <Button
                        variant="outlined"
                        onClick={() =>
                          setExercises((prev) =>
                            prev.map((item) =>
                              item.id === exercise.id ? { ...item, isAddingSet: true } : item,
                            ),
                          )
                        }
                      >
                        Add set
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!canSave || isSaving}
          onClick={async () => {
            setStatus(null);
            const flattenedSets = exercises.flatMap((exercise) =>
              exercise.sets.map((setItem) => ({
                exercise: exercise.name,
                reps: setItem.reps,
                weight: setItem.weight,
                durationMs: setItem.durationMs,
                date: dateStr,
              })),
            );

            if (flattenedSets.length === 0) {
              setStatus({
                type: "error",
                message: "Add at least one exercise set before saving.",
              });
              return;
            }

            setIsSaving(true);
            try {
              await saveTrainingSets(flattenedSets);
              await refetchTrainingSets();
              onClose();
            } catch (error) {
              setStatus({
                type: "error",
                message: toErrorMessage(error, "Failed to save training sets."),
              });
            } finally {
              setIsSaving(false);
            }
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

