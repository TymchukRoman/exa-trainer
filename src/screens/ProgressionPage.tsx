import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { BarChart, LineChart } from "@mui/x-charts";
import { useAppContext } from "../state/AppContext";
import dayjs from "dayjs";

type SessionAgg = {
  date: string;
  sets: number;
  reps: number;
  avgWeight: number;
  maxWeight: number;
};

export function ProgressionPage() {
  const { trainingSets, exercises, isLoadingTrainings } = useAppContext();

  const selectableExercises = useMemo(() => {
    const names = new Set<string>(exercises.map((e) => e.label));
    for (const set of trainingSets) names.add(set.exercise);
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [exercises, trainingSets]);

  const [exercise, setExercise] = useState<string>(selectableExercises[0] ?? "");
  useEffect(() => {
    if (!exercise && selectableExercises.length > 0) {
      setExercise(selectableExercises[0]);
      return;
    }
    if (exercise && !selectableExercises.includes(exercise)) {
      setExercise(selectableExercises[0] ?? "");
    }
  }, [exercise, selectableExercises]);

  const filtered = useMemo(
    () => trainingSets.filter((set) => set.exercise === exercise),
    [trainingSets, exercise],
  );

  const sessions = useMemo<SessionAgg[]>(() => {
    const byDate = new Map<string, { sets: number; reps: number; sumWeight: number; maxWeight: number }>();
    for (const set of filtered) {
      const current = byDate.get(set.date) ?? {
        sets: 0,
        reps: 0,
        sumWeight: 0,
        maxWeight: Number.NEGATIVE_INFINITY,
      };
      current.sets += 1;
      current.reps += set.reps;
      current.sumWeight += set.weight;
      current.maxWeight = Math.max(current.maxWeight, set.weight);
      byDate.set(set.date, current);
    }
    return [...byDate.entries()]
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([date, agg]) => ({
        date,
        sets: agg.sets,
        reps: agg.reps,
        avgWeight: agg.sets ? agg.sumWeight / agg.sets : 0,
        maxWeight: Number.isFinite(agg.maxWeight) ? agg.maxWeight : 0,
      }));
  }, [filtered]);

  const weeklyFrequency = useMemo(() => {
    const byWeek = new Map<string, number>();
    for (const set of filtered) {
      const key = dayjs(set.date).startOf("week").format("YYYY-MM-DD");
      byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
    }
    return [...byWeek.entries()]
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([week, count]) => ({ week, count }));
  }, [filtered]);

  const totals = useMemo(() => {
    const totalSets = filtered.length;
    const totalReps = filtered.reduce((acc, s) => acc + s.reps, 0);
    const maxWeight = filtered.length ? Math.max(...filtered.map((s) => s.weight)) : 0;
    const avgWeight = filtered.length
      ? filtered.reduce((acc, s) => acc + s.weight, 0) / filtered.length
      : 0;
    const sessionCount = new Set(filtered.map((s) => s.date)).size;
    return { totalSets, totalReps, maxWeight, avgWeight, sessionCount };
  }, [filtered]);

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
          Progression
        </Typography>
        <Typography color="text.secondary">
          Exercise-level progression by sets, reps, weights and frequency.
        </Typography>

        <TextField
          select
          fullWidth
          label="Exercise"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          SelectProps={{ native: true }}
        >
          {selectableExercises.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </TextField>

        {filtered.length === 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary">
                No data for this exercise yet.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(5, 1fr)" },
                gap: 1.5,
              }}
            >
              {[
                { label: "Total sets", value: totals.totalSets },
                { label: "Total reps", value: totals.totalReps },
                { label: "Sessions", value: totals.sessionCount },
                { label: "Max weight", value: `${totals.maxWeight.toFixed(1)} kg` },
                { label: "Avg weight", value: `${totals.avgWeight.toFixed(1)} kg` },
              ].map((m) => (
                <Card key={m.label} variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      {m.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {m.value}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                    Sets per session
                  </Typography>
                  <LineChart
                    height={280}
                    xAxis={[{ data: sessions.map((s) => s.date), scaleType: "point" }]}
                    series={[{ data: sessions.map((s) => s.sets), label: "Sets" }]}
                  />
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                    Reps per session
                  </Typography>
                  <LineChart
                    height={280}
                    xAxis={[{ data: sessions.map((s) => s.date), scaleType: "point" }]}
                    series={[{ data: sessions.map((s) => s.reps), label: "Reps" }]}
                  />
                </CardContent>
              </Card>
            </Box>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                  Weight progression
                </Typography>
                <LineChart
                  height={280}
                  xAxis={[{ data: sessions.map((s) => s.date), scaleType: "point" }]}
                  series={[
                    { data: sessions.map((s) => s.avgWeight), label: "Avg weight (kg)" },
                    { data: sessions.map((s) => s.maxWeight), label: "Max weight (kg)" },
                  ]}
                />
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                  Exercise frequency (weekly)
                </Typography>
                <BarChart
                  height={260}
                  xAxis={[{ data: weeklyFrequency.map((w) => w.week), scaleType: "band" }]}
                  series={[{ data: weeklyFrequency.map((w) => w.count), label: "Sets per week" }]}
                />
              </CardContent>
            </Card>
          </>
        )}
      </Stack>
    </Container>
  );
}

