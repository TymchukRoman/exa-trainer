import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { softDeleteTrainingSets, updateTrainingSet } from "../api/trainings";
import { formatDurationMs, parseDurationToMs } from "../utils/duration";

type ExerciseMeta = {
  isBodyweightOnly: boolean;
  usesDuration: boolean;
};

export function useTrainingSetActions(refetchTrainingSets: () => Promise<unknown>) {
  const [editOpen, setEditOpen] = useState(false);
  const [editSetId, setEditSetId] = useState<string | null>(null);
  const [editExerciseName, setEditExerciseName] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editStatus, setEditStatus] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editMeta, setEditMeta] = useState<ExerciseMeta>({
    isBodyweightOnly: false,
    usesDuration: false,
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteLabel, setDeleteLabel] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const openEdit = (
    set: { id: string; reps: number; weight: number; durationMs?: number },
    exerciseName: string,
    meta: ExerciseMeta,
  ) => {
    setEditSetId(set.id);
    setEditExerciseName(exerciseName);
    setEditReps(String(set.reps));
    setEditDuration(set.durationMs ? formatDurationMs(set.durationMs) : "");
    setEditWeight(String(set.weight));
    setEditMeta(meta);
    setEditStatus(null);
    setEditOpen(true);
  };

  const openDelete = (params: { ids: string[]; label: string }) => {
    setDeleteIds(params.ids);
    setDeleteLabel(params.label);
    setDeleteOpen(true);
    setIsDeleting(false);
  };

  const handleSaveEdit = async () => {
    if (!editSetId) return;
    setEditStatus(null);

    const isDurationExercise = editMeta.usesDuration;
    const isBodyweightOnly = editMeta.isBodyweightOnly;
    const reps = isDurationExercise ? 1 : Number(editReps);
    const parsedDuration = isDurationExercise ? parseDurationToMs(editDuration) : null;
    const durationMs = parsedDuration ?? undefined;
    const weight = isBodyweightOnly ? 0 : Number(editWeight);

    if (!isDurationExercise && (!Number.isFinite(reps) || reps <= 0)) {
      setEditStatus("Reps must be greater than zero.");
      return;
    }
    if (isDurationExercise && !parsedDuration) {
      setEditStatus("Duration format must be like 1h 2m 1s.");
      return;
    }
    if (!isBodyweightOnly && !Number.isFinite(weight)) {
      setEditStatus("Weight must be a valid number.");
      return;
    }

    setIsEditing(true);
    try {
      await updateTrainingSet({ id: editSetId, reps, weight, durationMs });
      await refetchTrainingSets();
      setEditOpen(false);
    } catch (e) {
      setEditStatus(e instanceof Error ? e.message : "Failed to update set.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (deleteIds.length === 0) return;
    setIsDeleting(true);
    try {
      await softDeleteTrainingSets(deleteIds);
      await refetchTrainingSets();
      setDeleteOpen(false);
    } catch {
      setDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const dialogs = (
    <>
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit set</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {editStatus ? <Alert severity="error">{editStatus}</Alert> : null}
            <Typography variant="body2" color="text.secondary">
              {editExerciseName}
            </Typography>
            {editMeta.usesDuration ? (
              <TextField
                label="Duration"
                placeholder="1h 2m 1s"
                value={editDuration}
                onChange={(e) => setEditDuration(e.currentTarget.value)}
                fullWidth
              />
            ) : (
              <TextField
                label="Reps"
                type="number"
                value={editReps}
                onChange={(e) => setEditReps(e.currentTarget.value)}
                inputProps={{ min: 1 }}
                fullWidth
              />
            )}
            {editMeta.isBodyweightOnly ? null : (
              <TextField
                label="Weight (kg)"
                type="number"
                value={editWeight}
                onChange={(e) => setEditWeight(e.currentTarget.value)}
                inputProps={{ min: -999999, step: 0.5 }}
                fullWidth
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleSaveEdit()} disabled={isEditing}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Remove from history?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {deleteLabel || "This will remove the selected item(s) from your history."} This is a
            soft delete.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  return { openEdit, openDelete, dialogs };
}
