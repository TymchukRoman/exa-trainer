import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { createExercise, deleteExercise } from "../api/exercises";
import { MuscleGroupPicker } from "../components/pickers/MuscleGroupPicker";
import { useAppContext } from "../state/AppContext";
import { toErrorMessage } from "../utils/errors";
import {
  getCatalogMuscleGroupIdsSorted,
  formatMuscleGroupsForDisplay,
} from "../utils/muscleGroups";
import { getExerciseRegions } from "../utils/trainingRegions";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { Exercise } from "../components/Exercise";

export function ExercisesPage() {
  const { exercises, muscleGroups, isLoadingExercises, refetchExercises } = useAppContext();
  const [name, setName] = useState("");
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [isBodyweightOnly, setIsBodyweightOnly] = useState(false);
  const [usesDuration, setUsesDuration] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const sortedExercises = useMemo(
    () => [...exercises].sort((a, b) => a.label.localeCompare(b.label)),
    [exercises],
  );
  const exerciseMap = useMemo(
    () => new Map(exercises.map((item) => [item.label.toLowerCase(), item])),
    [exercises],
  );
  const muscleGroupOptions = useMemo(
    () => getCatalogMuscleGroupIdsSorted(muscleGroups),
    [muscleGroups],
  );

  async function handleCreate() {
    setStatus(null);
    const label = name.trim();
    const muscleGroup = selectedMuscleGroups;

    if (!label) {
      setStatus({ type: "error", message: "Exercise name is required." });
      return;
    }
    if (muscleGroup.length === 0) {
      setStatus({ type: "error", message: "Add at least one muscle group." });
      return;
    }
    const duplicate = exercises.find((item) => item.label.toLowerCase() === label.toLowerCase());
    if (duplicate) {
      setDuplicateWarning(duplicate.label);
      return;
    }

    setIsSaving(true);
    try {
      await createExercise({ label, muscleGroup, isBodyweightOnly, usesDuration });
      await refetchExercises();
      setName("");
      setSelectedMuscleGroups([]);
      setIsBodyweightOnly(false);
      setUsesDuration(false);
      setStatus({ type: "success", message: "Exercise added." });
    } catch (error) {
      setStatus({
        type: "error",
        message: toErrorMessage(error, "Failed to create exercise."),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setStatus(null);
    setDeletingId(id);
    try {
      await deleteExercise(id);
      await refetchExercises();
      setStatus({ type: "success", message: "Exercise deleted." });
    } catch (error) {
      setStatus({
        type: "error",
        message: toErrorMessage(error, "Failed to delete exercise."),
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Typography color="text.secondary">
          Manage custom exercises used by training forms and dashboards.
        </Typography>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              {status ? <Alert severity={status.type}>{status.message}</Alert> : null}
              <Autocomplete
                freeSolo
                options={sortedExercises.map((item) => item.label)}
                inputValue={name}
                onInputChange={(_, value) => setName(value)}
                onChange={(_, value) => setName(typeof value === "string" ? value : "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Exercise name"
                    helperText="Type to see similar existing exercises."
                    fullWidth
                  />
                )}
                fullWidth
              />
              <MuscleGroupPicker
                catalog={muscleGroups}
                options={muscleGroupOptions}
                value={selectedMuscleGroups}
                onChange={setSelectedMuscleGroups}
                label="Muscle groups"
                placeholder="Select..."
                helperText="Pick canonical muscle ids from the app catalog (loaded from the app bundle)."
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isBodyweightOnly}
                      onChange={(e) => setIsBodyweightOnly(e.target.checked)}
                    />
                  }
                  label="Bodyweight only (disable weight input)"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={usesDuration}
                      onChange={(e) => setUsesDuration(e.target.checked)}
                    />
                  }
                  label="Track duration instead of reps"
                />
              </Stack>
              <Box>
                <Button variant="contained" onClick={handleCreate} disabled={isSaving}>
                  Add custom exercise
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {isLoadingExercises ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                {sortedExercises.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                      flexWrap: "wrap",
                    }}
                  >
                    <Stack spacing={0.25}>
                      <Exercise
                        label={item.label}
                        to={`/exercise/${item.id}`}
                        regions={Array.from(
                          new Set(
                            getExerciseRegions({
                              exerciseLabel: item.label,
                              exerciseMap,
                              muscleGroups,
                            }),
                          ),
                        )}
                        detailed
                        description={formatMuscleGroupsForDisplay(muscleGroups, item.muscleGroup)}
                      />
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                        {item.isBodyweightOnly ? (
                          <Chip label="Bodyweight" size="small" variant="outlined" />
                        ) : null}
                        {item.usesDuration ? (
                          <Chip label="Duration" size="small" variant="outlined" />
                        ) : null}
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {item.isDefault ? (
                        <Chip label="Default" size="small" />
                      ) : (
                        <>
                          <Chip label="Custom" size="small" color="primary" />
                          <IconButton
                            size="small"
                            aria-label="Delete exercise"
                            onClick={() => void handleDelete(item.id)}
                            disabled={deletingId === item.id}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
      <Dialog open={Boolean(duplicateWarning)} onClose={() => setDuplicateWarning(null)}>
        <DialogTitle>Exercise already exists</DialogTitle>
        <DialogContent>
          <Typography>
            {duplicateWarning
              ? `"${duplicateWarning}" already exists. Please use another name or reuse the existing exercise.`
              : "This exercise already exists."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateWarning(null)} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
