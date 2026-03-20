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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { createExercise, deleteExercise } from "../api/exercises";
import { useAppContext } from "../state/AppContext";

export function ExercisesPage() {
  const { exercises, isLoadingExercises, refetchExercises } = useAppContext();
  const [name, setName] = useState("");
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedExercises = useMemo(
    () => [...exercises].sort((a, b) => a.label.localeCompare(b.label)),
    [exercises],
  );
  const muscleGroupOptions = useMemo(() => {
    const groups = new Set<string>();
    for (const exercise of exercises) {
      for (const group of exercise.muscleGroup) {
        groups.add(group);
      }
    }
    return [...groups].sort((a, b) => a.localeCompare(b));
  }, [exercises]);

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

    setIsSaving(true);
    try {
      await createExercise({ label, muscleGroup });
      await refetchExercises();
      setName("");
      setSelectedMuscleGroups([]);
      setStatus({ type: "success", message: "Exercise added." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create exercise.",
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
        message: error instanceof Error ? error.message : "Failed to delete exercise.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={700}>
          Exercises
        </Typography>
        <Typography color="text.secondary">
          Manage custom exercises used by training forms and dashboards.
        </Typography>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              {status ? <Alert severity={status.type}>{status.message}</Alert> : null}
              <TextField
                label="Exercise name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
              <Autocomplete
                multiple
                options={muscleGroupOptions}
                value={selectedMuscleGroups}
                onChange={(_, value) => setSelectedMuscleGroups(value)}
                disableCloseOnSelect
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Muscle groups"
                    helperText="Select one or more muscle groups."
                    fullWidth
                  />
                )}
              />
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
                      <Typography fontWeight={700}>{item.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.muscleGroup.join(", ")}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {item.isDefault ? (
                        <Chip label="Default" size="small" />
                      ) : (
                        <>
                          <Chip label="Custom" size="small" color="primary" />
                          <Button
                            size="small"
                            color="error"
                            onClick={() => void handleDelete(item.id)}
                            disabled={deletingId === item.id}
                          >
                            Delete
                          </Button>
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
    </Container>
  );
}
