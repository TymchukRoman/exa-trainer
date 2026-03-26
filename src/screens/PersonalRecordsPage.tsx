import { Autocomplete, Box, CircularProgress, Container, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { ExerciseRecord } from "../api/exercises";
import { ExerciseRecordsCard } from "../components/records/ExerciseRecordsCard";
import { useAppContext } from "../state/AppContext";
import { formatDurationMs } from "../utils/duration";
import { getMaxDurationRecords, getMaxRepsRecords, getMaxWeightRecords } from "../utils/trainingStats";

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
  const { trainingSets, exercises, isLoadingTrainings } = useAppContext();
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

  const muscleGroupOptions = useMemo(() => {
    const set = new Set<string>();
    for (const exercise of exercises) {
      for (const g of exercise.muscleGroup) {
        set.add(g);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [exercises]);

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
  const maxDurationRecords = useMemo(
    () => getMaxDurationRecords(filteredTrainingSets),
    [filteredTrainingSets],
  );

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
        <Typography variant="h4" fontWeight={800}>
          Personal records
        </Typography>
        <Typography color="text.secondary">
          Best set per exercise by max weight or max reps. Use filters to narrow exercises.
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
          <Autocomplete
            sx={{ flex: 1 }}
            multiple
            options={muscleGroupOptions}
            value={muscleGroupFilter}
            onChange={(_, value) => setMuscleGroupFilter(value)}
            renderInput={(params) => (
              <TextField {...params} label="Muscle groups" placeholder="Any" />
            )}
          />
        </Stack>
        <ExerciseRecordsCard
          title="Max weight"
          subtitle="Heaviest successful set per exercise"
          trainingSets={filteredTrainingSets}
          emphasis="weight"
          getRecords={getMaxWeightRecords}
        />
        <ExerciseRecordsCard
          title="Max reps"
          subtitle="Most reps in a single set per exercise"
          trainingSets={filteredTrainingSets}
          emphasis="reps"
          getRecords={getMaxRepsRecords}
        />
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
            Max duration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Longest set duration per exercise.
          </Typography>
          {maxDurationRecords.length === 0 ? (
            <Typography color="text.secondary">No timed sets for current filters.</Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                gap: 1.25,
              }}
            >
              {maxDurationRecords.map((record) => (
                <Stack key={record.exercise} spacing={0.25}>
                  <Typography fontWeight={700} variant="body2">
                    {record.exercise}
                  </Typography>
                  <Typography variant="body1" fontWeight={800}>
                    {formatDurationMs(record.durationMs)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {record.weight} kg
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {record.date}
                  </Typography>
                </Stack>
              ))}
            </Box>
          )}
        </Box>
      </Stack>
    </Container>
  );
}
