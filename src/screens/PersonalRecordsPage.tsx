import { Autocomplete, Box, CircularProgress, Container, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { PersonalRecordsPanel } from "../components/records/PersonalRecordsPanel";
import { useAppContext } from "../state/AppContext";

export function PersonalRecordsPage() {
  const { trainingSets, isLoadingTrainings } = useAppContext();
  const [exerciseFilter, setExerciseFilter] = useState<string | null>(null);

  const exerciseOptions = useMemo(
    () => [...new Set(trainingSets.map((set) => set.exercise))].sort(),
    [trainingSets],
  );

  const filteredTrainingSets = useMemo(() => {
    if (!exerciseFilter) return trainingSets;
    return trainingSets.filter(
      (set) => set.exercise.toLowerCase() === exerciseFilter.toLowerCase(),
    );
  }, [trainingSets, exerciseFilter]);

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
          Best set per exercise by max weight.
        </Typography>
        <Autocomplete
          options={exerciseOptions}
          value={exerciseFilter}
          onChange={(_, value) => setExerciseFilter(value)}
          renderInput={(params) => (
            <TextField {...params} label="Filter by exercise" placeholder="All exercises" />
          )}
          fullWidth
        />
        <PersonalRecordsPanel trainingSets={filteredTrainingSets} />
      </Stack>
    </Container>
  );
}

