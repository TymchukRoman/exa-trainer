import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
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
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { TrainingSetItem } from "../components/TrainingSetItem";
import { deleteTrainingSet, updateTrainingSet } from "../api/trainings";
import { useAppContext } from "../state/AppContext";
import { getExerciseMeta } from "../utils/exerciseCatalog";

export function TrainingsListPage() {
  const {
    groupedTrainingSets,
    isLoadingTrainings,
    isFetchingTrainings,
    refetchTrainingSets,
  } = useAppContext();

  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);

  const filteredGroups = useMemo(() => {
    return groupedTrainingSets.filter((dateGroup) => {
      const d = dayjs(dateGroup.date, "YYYY-MM-DD");
      if (fromDate && d.isBefore(fromDate, "day")) return false;
      if (toDate && d.isAfter(toDate, "day")) return false;
      return true;
    });
  }, [groupedTrainingSets, fromDate, toDate]);

  const [editOpen, setEditOpen] = useState(false);
  const [editSetId, setEditSetId] = useState<string | null>(null);
  const [editReps, setEditReps] = useState<string>("");
  const [editWeight, setEditWeight] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const openEdit = (set: { id: string; reps: number; weight: number }) => {
    setEditSetId(set.id);
    setEditReps(String(set.reps));
    setEditWeight(String(set.weight));
    setEditStatus(null);
    setEditOpen(true);
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDelete = (id: string) => {
    setDeleteSetId(id);
    setDeleteOpen(true);
    setIsDeleting(false);
  };

  const handleSaveEdit = async () => {
    if (!editSetId) return;
    setEditStatus(null);

    const reps = Number(editReps);
    const weight = Number(editWeight);
    if (!Number.isFinite(reps) || reps <= 0) {
      setEditStatus("Reps must be greater than zero.");
      return;
    }
    if (!Number.isFinite(weight)) {
      setEditStatus("Weight must be a valid number.");
      return;
    }

    setIsEditing(true);
    try {
      await updateTrainingSet({ id: editSetId, reps, weight });
      await refetchTrainingSets();
      setEditOpen(false);
    } catch (e) {
      setEditStatus(e instanceof Error ? e.message : "Failed to update set.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSetId) return;
    setIsDeleting(true);
    try {
      await deleteTrainingSet(deleteSetId);
      await refetchTrainingSets();
      setDeleteOpen(false);
    } catch (e) {
      // Keep it simple: show as alert in confirm dialog.
      // For now we just close to avoid complex state.
      setDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingTrainings) {
    return (
      <Container maxWidth="md" sx={{ py: 3, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={700}>
          Trainings
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <DatePicker
            label="From"
            value={fromDate}
            onChange={(value) => setFromDate(value)}
            slotProps={{ textField: { fullWidth: true } }}
          />
          <DatePicker
            label="To"
            value={toDate}
            onChange={(value) => setToDate(value)}
            slotProps={{ textField: { fullWidth: true } }}
          />
          <Button
            variant="outlined"
            onClick={() => {
              setFromDate(null);
              setToDate(null);
            }}
          >
            Clear
          </Button>
        </Stack>

        {isFetchingTrainings ? (
          <Typography color="text.secondary">Refreshing...</Typography>
        ) : null}

        {filteredGroups.length === 0 ? (
          <Typography color="text.secondary">
            No trainings found for selected date range.
          </Typography>
        ) : (
          filteredGroups.map((dateGroup) => (
            <Card key={dateGroup.date} variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h6">{dateGroup.date}</Typography>
                  <Divider />
                  {dateGroup.exercises.map((exerciseGroup) => (
                    <Box key={`${dateGroup.date}-${exerciseGroup.exercise}`}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {exerciseGroup.exercise}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                        Muscle groups:{" "}
                        {getExerciseMeta(exerciseGroup.exercise)?.muscleGroup.join(", ") ?? "other"}
                      </Typography>
                      <List dense disablePadding>
                        {exerciseGroup.sets.map((setItem, index) => (
                          <TrainingSetItem
                            key={setItem.id}
                            index={index}
                            reps={setItem.reps}
                            weight={setItem.weight}
                            onEdit={() => openEdit(setItem)}
                            onDelete={() => openDelete(setItem.id)}
                          />
                        ))}
                      </List>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit set</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {editStatus ? <Alert severity="error">{editStatus}</Alert> : null}
            <TextField
              label="Reps"
              type="number"
              value={editReps}
              onChange={(e) => setEditReps(e.currentTarget.value)}
              inputProps={{ min: 1 }}
              fullWidth
            />
            <TextField
              label="Weight (kg)"
              type="number"
              value={editWeight}
              onChange={(e) => setEditWeight(e.currentTarget.value)}
              inputProps={{ min: -999999, step: 0.5 }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={isEditing}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Delete set?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This will permanently remove the set from MongoDB.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={isDeleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

