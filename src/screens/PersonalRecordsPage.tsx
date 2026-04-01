import { Autocomplete, Box, Card, CardContent, CircularProgress, Container, Divider, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { ExerciseRecord } from "../api/exercises";
import { MuscleGroupPicker } from "../components/pickers/MuscleGroupPicker";
import { useAppContext } from "../state/AppContext";
import { formatDurationMs } from "../utils/duration";
import { getCatalogMuscleGroupIdsSorted } from "../utils/muscleGroups";
import { getMaxDurationRecords, getMaxRepsRecords, getMaxWeightRecords } from "../utils/trainingStats";
import { getExerciseRegions } from "../utils/trainingRegions";
import { Exercise } from "../components/Exercise";

function exerciseMatchesMuscleGroups(
  exerciseLabel: string,
  exerciseMap: Map<string, ExerciseRecord>,
  selected: string[],
): boolean {
  if (selected.length === 0) return true;
  const groups = exerciseMap.get(exerciseLabel.toLowerCase())?.muscleGroup ?? ["other"];
  return selected.some((g) => groups.includes(g));
}

export function PersonalRecordsPage() {
  const { trainingSets, exercises, muscleGroups, isLoadingTrainings } = useAppContext();
  const [exerciseFilter, setExerciseFilter] = useState<string | null>(null);
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string[]>([]);

  const exerciseMap = useMemo(
    () => new Map(exercises.map((item) => [item.label.toLowerCase(), item])),
    [exercises],
  );

  const exerciseOptions = useMemo(
    () => [...new Set(trainingSets.map((set) => set.exercise))].sort(),
    [trainingSets],
  );

  const muscleGroupOptions = useMemo(
    () => getCatalogMuscleGroupIdsSorted(muscleGroups),
    [muscleGroups],
  );

  const filteredTrainingSets = useMemo(() => {
    let rows = trainingSets;
    if (exerciseFilter) {
      rows = rows.filter((set) => set.exercise.toLowerCase() === exerciseFilter.toLowerCase());
    }
    if (muscleGroupFilter.length > 0) {
      rows = rows.filter((set) => exerciseMatchesMuscleGroups(set.exercise, exerciseMap, muscleGroupFilter));
    }
    return rows;
  }, [trainingSets, exerciseFilter, muscleGroupFilter, exerciseMap]);

  const maxWeightByExercise = useMemo(() => {
    const records = getMaxWeightRecords(filteredTrainingSets);
    return new Map(records.map((r) => [r.exercise, r]));
  }, [filteredTrainingSets]);
  const maxRepsByExercise = useMemo(() => {
    const records = getMaxRepsRecords(filteredTrainingSets);
    return new Map(records.map((r) => [r.exercise, r]));
  }, [filteredTrainingSets]);
  const maxDurationByExercise = useMemo(() => {
    const records = getMaxDurationRecords(filteredTrainingSets);
    return new Map(records.map((r) => [r.exercise, r]));
  }, [filteredTrainingSets]);

  const visibleExercises = useMemo(() => {
    const set = new Set<string>();
    for (const k of maxWeightByExercise.keys()) set.add(k);
    for (const k of maxRepsByExercise.keys()) set.add(k);
    for (const k of maxDurationByExercise.keys()) set.add(k);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [maxWeightByExercise, maxRepsByExercise, maxDurationByExercise]);

  if (isLoadingTrainings) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography color="text.secondary">
          Best set per exercise. Use filters to narrow exercises.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Autocomplete
            sx={{ flex: 1 }}
            options={exerciseOptions}
            value={exerciseFilter}
            onChange={(_, value) => setExerciseFilter(value)}
            renderInput={(params) => (
              <TextField {...params} label="Exercise" placeholder="All exercises" />
            )}
          />
          <Box sx={{ flex: 1 }}>
            <MuscleGroupPicker
              catalog={muscleGroups}
              options={muscleGroupOptions}
              value={muscleGroupFilter}
              onChange={setMuscleGroupFilter}
              label="Muscle groups"
              placeholder="Any"
            />
          </Box>
        </Stack>

        {visibleExercises.length === 0 ? (
          <Typography color="text.secondary">No records for the current filters.</Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
              gap: 1.5,
            }}
          >
            {visibleExercises.map((exerciseLabel) => {
              const meta = exerciseMap.get(exerciseLabel.toLowerCase());
              const isDuration = meta?.usesDuration ?? false;
              const isBodyweightOnly = meta?.isBodyweightOnly ?? false;
              const weightRecord = maxWeightByExercise.get(exerciseLabel);
              const repsRecord = maxRepsByExercise.get(exerciseLabel);
              const durationRecord = maxDurationByExercise.get(exerciseLabel);

              return (
                <Card key={exerciseLabel} variant="outlined">
                  <CardContent>
                    <Stack spacing={1.25}>
                      <Exercise
                        label={exerciseLabel}
                        to={
                          exerciseMap.get(exerciseLabel.toLowerCase())?.id
                            ? `/exercise/${exerciseMap.get(exerciseLabel.toLowerCase())?.id}`
                            : undefined
                        }
                        regions={Array.from(
                          new Set(
                            getExerciseRegions({
                              exerciseLabel,
                              exerciseMap,
                              muscleGroups,
                            }),
                          ),
                        )}
                      />
                      <Divider />

                      {!isBodyweightOnly && weightRecord ? (
                        <Stack spacing={0.25}>
                          <Typography variant="body2" color="text.secondary">
                            Max weight
                          </Typography>
                          <Typography variant="body1" fontWeight={800}>
                            {weightRecord.weight} kg
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {weightRecord.reps} reps · {weightRecord.date}
                          </Typography>
                        </Stack>
                      ) : null}

                      {!isDuration && repsRecord ? (
                        <Stack spacing={0.25}>
                          <Typography variant="body2" color="text.secondary">
                            Max reps
                          </Typography>
                          <Typography variant="body1" fontWeight={800}>
                            {repsRecord.reps} reps
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {repsRecord.weight} kg · {repsRecord.date}
                          </Typography>
                        </Stack>
                      ) : null}

                      {isDuration && durationRecord ? (
                        <Stack spacing={0.25}>
                          <Typography variant="body2" color="text.secondary">
                            Max time
                          </Typography>
                          <Typography variant="body1" fontWeight={800}>
                            {formatDurationMs(durationRecord.durationMs)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {durationRecord.weight} kg · {durationRecord.date}
                          </Typography>
                        </Stack>
                      ) : null}

                      {!weightRecord && !repsRecord && !durationRecord ? (
                        <Typography variant="body2" color="text.secondary">
                          No records yet.
                        </Typography>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Stack>
    </Container>
  );
}
