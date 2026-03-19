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
import exercisesCatalog from "../data/exercises.json";
import { useAppContext } from "../state/AppContext";
import { TrainingSetItem } from "./TrainingSetItem";

type ExerciseSet = {
  reps: number;
  weight: number;
};

type ExerciseDraft = {
  id: string;
  name: string;
  sets: ExerciseSet[];
  isAddingSet: boolean;
  repsInput: string;
  weightInput: string;
};

export function NewTrainingDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { refetchTrainingSets } = useAppContext();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateStr, setDateStr] = useState(today);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [exerciseInputValue, setExerciseInputValue] = useState("");
  const [selectedExerciseOption, setSelectedExerciseOption] = useState<string | null>(null);
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
    const candidate = (selectedExerciseOption ?? exerciseInputValue).trim();
    return candidate;
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

    setExercises((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        sets: [],
        isAddingSet: false,
        repsInput: "",
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
                options={exercisesCatalog}
                value={selectedExerciseOption}
                inputValue={exerciseInputValue}
                onChange={(_, value) => setSelectedExerciseOption(value)}
                onInputChange={(_, value) => setExerciseInputValue(value)}
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
                          />
                        ))}
                      </List>
                    )}

                    {exercise.isAddingSet ? (
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <TextField
                          label="Reps"
                          type="number"
                          value={exercise.repsInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            setExercises((prev) =>
                              prev.map((item) =>
                                item.id === exercise.id ? { ...item, repsInput: value } : item,
                              ),
                            );
                          }}
                          inputProps={{ min: 1 }}
                          fullWidth
                        />
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
                        <Button
                          variant="contained"
                          onClick={() => {
                            const reps = Number(exercise.repsInput);
                            const weight = Number(exercise.weightInput);
                            if (!Number.isFinite(reps) || reps <= 0) {
                              setStatus({
                                type: "error",
                                message: `Invalid reps for ${exercise.name}.`,
                              });
                              return;
                            }
                            if (!Number.isFinite(weight)) {
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
                                      sets: [...item.sets, { reps, weight }],
                                      repsInput: "",
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
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to save training sets.",
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

