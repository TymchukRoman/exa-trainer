import { Box, CircularProgress, Container, Stack, Typography } from "@mui/material";
import { MuscleGroupDistributionCard } from "../components/dashboard/MuscleGroupDistributionCard";
import { TrainingDaysCard } from "../components/dashboard/TrainingDaysCard";
import { TopExercisesCard } from "../components/dashboard/TopExercisesCard";
import { useAppContext } from "../state/AppContext";

export function HomePage() {
  const { trainingSets, isLoadingTrainings } = useAppContext();

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
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" fontWeight={800}>
            Exa Trainer
          </Typography>
          <Typography color="text.secondary">
            Dashboard overview of your training results.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "7fr 5fr" },
            gap: 2,
          }}
        >
          <TrainingDaysCard trainingSets={trainingSets} />
          <TopExercisesCard trainingSets={trainingSets} />
        </Box>

        <MuscleGroupDistributionCard trainingSets={trainingSets} />
      </Stack>
    </Container>
  );
}

