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
  IconButton,
  List,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Delete as DeleteIcon, FileDownload as FileDownloadIcon } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { TrainingSetItem } from "../components/TrainingSetItem";
import { softDeleteTrainingSets, updateTrainingSet } from "../api/trainings";
import { useAppContext } from "../state/AppContext";
import { MuscleRegionPicker } from "../components/pickers/MuscleRegionPicker";
import { Exercise } from "../components/Exercise";
import { formatDurationMs, parseDurationToMs } from "../utils/duration";
import { formatMuscleGroupsForDisplay } from "../utils/muscleGroups";
import { getMuscleRegionIconSrc } from "../constants/muscleRegionIcons";
import { getExerciseRegions } from "../utils/trainingRegions";
import { buildTrainingExportRows } from "../utils/trainingExport";
import { useDataExport } from "../hooks/useDataExport";

export function TrainingsListPage() {
  const {
    groupedTrainingSets,
    exercises,
    muscleGroups,
    isLoadingTrainings,
    isFetchingTrainings,
    refetchTrainingSets,
  } = useAppContext();

  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);

  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const m of muscleGroups) set.add(m.region);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [muscleGroups]);

  const exerciseMap = useMemo(
    () => new Map(exercises.map((item) => [item.label.toLowerCase(), item])),
    [exercises],
  );

  const regionsByExerciseLabel = useMemo(() => {
    const labels = new Set<string>();
    for (const dateGroup of groupedTrainingSets) {
      for (const ex of dateGroup.exercises) {
        labels.add(ex.exercise.toLowerCase());
      }
    }

    const map = new Map<string, string[]>();
    for (const label of labels) {
      map.set(
        label,
        getExerciseRegions({
          exerciseLabel: label,
          exerciseMap,
          muscleGroups,
        }),
      );
    }
    return map;
  }, [groupedTrainingSets, exerciseMap, muscleGroups]);

  const regionFilterSet = useMemo(() => new Set(regionFilter), [regionFilter]);

  const filteredGroups = useMemo(() => {
    const dateFiltered = groupedTrainingSets.filter((dateGroup) => {
      const d = dayjs(dateGroup.date, "YYYY-MM-DD");
      if (fromDate && d.isBefore(fromDate, "day")) return false;
      if (toDate && d.isAfter(toDate, "day")) return false;
      return true;
    });

    if (regionFilter.length === 0) {
      return dateFiltered;
    }

    return dateFiltered
      .map((dateGroup) => {
        const exercises = dateGroup.exercises.filter((exerciseGroup) => {
          const regions = regionsByExerciseLabel.get(exerciseGroup.exercise.toLowerCase()) ?? [];
          const matchesRegion = regionFilterSet.size === 0 || regions.some((r) => regionFilterSet.has(r));

          return matchesRegion;
        });
        return { ...dateGroup, exercises };
      })
      .filter((g) => g.exercises.length > 0);
  }, [
    groupedTrainingSets,
    fromDate,
    toDate,
    regionFilter,
    regionsByExerciseLabel,
    regionFilterSet,
  ]);

  const exportRows = useMemo(() => buildTrainingExportRows(filteredGroups), [filteredGroups]);
  const {
    startExport,
    exportSuccess,
    exportError,
    isExporting,
    openExportedFile,
    dismissExportFeedback,
  } = useDataExport(exportRows);

  const [editOpen, setEditOpen] = useState(false);
  const [editSetId, setEditSetId] = useState<string | null>(null);
  const [editExerciseName, setEditExerciseName] = useState<string>("");
  const [editReps, setEditReps] = useState<string>("");
  const [editDuration, setEditDuration] = useState<string>("");
  const [editWeight, setEditWeight] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const openEdit = (set: { id: string; reps: number; weight: number; durationMs?: number }, exerciseName: string) => {
    setEditSetId(set.id);
    setEditExerciseName(exerciseName);
    setEditReps(String(set.reps));
    setEditDuration(set.durationMs ? formatDurationMs(set.durationMs) : "");
    setEditWeight(String(set.weight));
    setEditStatus(null);
    setEditOpen(true);
  };
  const editingExercise = exerciseMap.get(editExerciseName.toLowerCase());
  const isDurationExercise = editingExercise?.usesDuration ?? false;
  const isBodyweightOnly = editingExercise?.isBodyweightOnly ?? false;

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteLabel, setDeleteLabel] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  const openDelete = (params: { ids: string[]; label: string }) => {
    setDeleteIds(params.ids);
    setDeleteLabel(params.label);
    setDeleteOpen(true);
    setIsDeleting(false);
  };

  const handleSaveEdit = async () => {
    if (!editSetId) return;
    setEditStatus(null);

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
      <Container maxWidth="lg" sx={{ py: 3, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
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
              setRegionFilter([]);
            }}
          >
            Clear
          </Button>
          <Box sx={{ ml: { sm: "auto" } }}>
            <Tooltip title="Export to Excel">
              <span>
                <IconButton
                  aria-label="Export to Excel"
                  onClick={() => void startExport()}
                  disabled={exportRows.length === 0 || isExporting}
                  size="small"
                >
                  {isExporting ? <CircularProgress size={18} /> : <FileDownloadIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Stack>

        {exportSuccess ? (
          <Alert
            severity="success"
            onClose={dismissExportFeedback}
            action={
              exportSuccess.canOpen ? (
                <Button color="inherit" size="small" onClick={() => void openExportedFile()}>
                  Open file
                </Button>
              ) : undefined
            }
          >
            Export saved as {exportSuccess.filename}
          </Alert>
        ) : null}
        {exportError ? (
          <Alert severity="error" onClose={dismissExportFeedback}>
            {exportError}
          </Alert>
        ) : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <MuscleRegionPicker
              value={regionFilter}
              options={regionOptions}
              onChange={setRegionFilter}
              label="Filter by muscle region"
              placeholder="Any"
            />
          </Box>
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
                  <Stack spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
                      <Typography variant="h6">
                        {dayjs(dateGroup.date, "YYYY-MM-DD").format("ddd")} · {dateGroup.date}
                      </Typography>
                      <IconButton
                        aria-label="Delete day"
                        onClick={() =>
                          openDelete({
                            ids: dateGroup.exercises.flatMap((ex) => ex.sets.map((s) => s.id)),
                            label: `Delete all sets on ${dateGroup.date}?`,
                          })
                        }
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: "wrap" }}>
                      {dateGroup.exercises.map((exerciseGroup, idx) => {
                        const regions = getExerciseRegions({
                          exerciseLabel: exerciseGroup.exercise,
                          exerciseMap,
                          muscleGroups,
                        });
                        const uniq = Array.from(new Set(regions));
                        return (
                          <Stack
                            key={`${dateGroup.date}-${exerciseGroup.exercise}-${idx}`}
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            {uniq.map((region) => (
                              <Tooltip key={`${dateGroup.date}-${exerciseGroup.exercise}-${idx}-${region}`} title={region}>
                                <Box
                                  component="img"
                                  src={getMuscleRegionIconSrc(region)}
                                  alt={region}
                                  sx={{ width: 18, height: 18, opacity: 0.85 }}
                                />
                              </Tooltip>
                            ))}
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Stack>
                  <Divider />
                  {dateGroup.exercises.map((exerciseGroup) => (
                    <Box key={`${dateGroup.date}-${exerciseGroup.exercise}`}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
                        <Exercise
                          label={exerciseGroup.exercise}
                          to={
                            exerciseMap.get(exerciseGroup.exercise.toLowerCase())?.id
                              ? `/exercise/${exerciseMap.get(exerciseGroup.exercise.toLowerCase())?.id}`
                              : undefined
                          }
                          regions={Array.from(
                            new Set(
                              getExerciseRegions({
                                exerciseLabel: exerciseGroup.exercise,
                                exerciseMap,
                                muscleGroups,
                              }),
                            ),
                          )}
                        />
                        <IconButton
                          aria-label="Delete exercise"
                          onClick={() =>
                            openDelete({
                              ids: exerciseGroup.sets.map((s) => s.id),
                              label: `Delete all sets for ${exerciseGroup.exercise} on ${dateGroup.date}?`,
                            })
                          }
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                        Muscle groups:{" "}
                        {formatMuscleGroupsForDisplay(
                          muscleGroups,
                          exerciseMap.get(exerciseGroup.exercise.toLowerCase())?.muscleGroup ?? [
                            "other",
                          ],
                        )}
                      </Typography>
                      <List dense disablePadding>
                        {exerciseGroup.sets.map((setItem, index) => (
                          <TrainingSetItem
                            key={setItem.id}
                            index={index}
                            reps={setItem.reps}
                            weight={setItem.weight}
                            durationMs={setItem.durationMs}
                            isBodyweightOnly={exerciseMap.get(exerciseGroup.exercise.toLowerCase())?.isBodyweightOnly}
                            onEdit={() => openEdit(setItem, exerciseGroup.exercise)}
                            onDelete={() =>
                              openDelete({
                                ids: [setItem.id],
                                label: `Delete set ${index + 1} from ${exerciseGroup.exercise}?`,
                              })
                            }
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
            {isDurationExercise ? (
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
            {isBodyweightOnly ? null : (
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
          <Button variant="contained" onClick={handleSaveEdit} disabled={isEditing}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Remove from history?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {deleteLabel || "This will remove the selected item(s) from your history."} This is a soft delete.
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

