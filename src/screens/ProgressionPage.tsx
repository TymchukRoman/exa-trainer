import {
  Autocomplete,
  Chip,
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
import { formatDurationMs } from "../utils/duration";
import { getMuscleRegionIconSrc } from "../constants/muscleRegionIcons";
import { getExerciseRegions } from "../utils/trainingRegions";

type SessionAgg = {
  date: string;
  sets: number;
  reps: number;
  durationMs: number;
  avgWeight: number;
  maxWeight: number;
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

export function ProgressionPage() {
  const { trainingSets, exercises, muscleGroups, isLoadingTrainings } = useAppContext();

  const daysByExercise = useMemo(() => {
    const byExercise = new Map<string, Set<string>>();
    for (const set of trainingSets) {
      const byDate = byExercise.get(set.exercise) ?? new Set<string>();
      byDate.add(set.date);
      byExercise.set(set.exercise, byDate);
    }
    return new Map<string, number>(
      [...byExercise.entries()].map(([exerciseName, days]) => [exerciseName, days.size]),
    );
  }, [trainingSets]);

  const selectableExercises = useMemo(() => {
    const names = new Set<string>(exercises.map((e) => e.label));
    for (const set of trainingSets) names.add(set.exercise);
    return [...names].sort((a, b) => {
      const ad = daysByExercise.get(a) ?? 0;
      const bd = daysByExercise.get(b) ?? 0;
      if (bd !== ad) return bd - ad;
      return a.localeCompare(b);
    });
  }, [exercises, trainingSets, daysByExercise]);

  const exerciseMap = useMemo(
    () => new Map(exercises.map((item) => [item.label.toLowerCase(), item])),
    [exercises],
  );

  const [exercise, setExercise] = useState<string>(selectableExercises[0] ?? "");
  const selectedExerciseMeta = useMemo(
    () => exercises.find((item) => item.label.toLowerCase() === exercise.toLowerCase()),
    [exercises, exercise],
  );
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
    const byDate = new Map<
      string,
      { sets: number; reps: number; durationMs: number; sumWeight: number; maxWeight: number }
    >();
    for (const set of filtered) {
      const current = byDate.get(set.date) ?? {
        sets: 0,
        reps: 0,
        durationMs: 0,
        sumWeight: 0,
        maxWeight: Number.NEGATIVE_INFINITY,
      };
      current.sets += 1;
      current.reps += set.reps;
      current.durationMs += set.durationMs ?? 0;
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
        durationMs: agg.durationMs,
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
        <Typography color="text.secondary">
          Exercise-level progression by sets, reps/time, weights and frequency.
        </Typography>

        <Autocomplete
          fullWidth
          options={selectableExercises}
          value={exercise || null}
          onChange={(_, value) => setExercise(value ?? "")}
          getOptionLabel={(option) => option}
          renderOption={(props, option) => (
            <li {...props}>
              <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {getExerciseRegions({
                      exerciseLabel: option,
                      exerciseMap,
                      muscleGroups,
                    }).map((region) => (
                      <Box
                        key={`${option}-${region}`}
                        component="img"
                        src={getMuscleRegionIconSrc(region)}
                        alt={region}
                        sx={{ width: 18, height: 18, opacity: 0.9 }}
                      />
                    ))}
                  </Stack>
                  <Typography sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>{option}</Typography>
                </Stack>
                {daysByExercise.get(option) ? (
                  <Chip size="small" label={`${daysByExercise.get(option)} days`} />
                ) : null}
              </Box>
            </li>
          )}
          renderInput={(params) => <TextField {...params} label="Exercise" />}
        />

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
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              <ChartCard title="Sets per session">
                <LineChart
                  height={280}
                  xAxis={[{ data: sessions.map((s) => s.date), scaleType: "point" }]}
                  series={[{ data: sessions.map((s) => s.sets), label: "Sets" }]}
                />
              </ChartCard>
              <ChartCard title={selectedExerciseMeta?.usesDuration ? "Time per session" : "Reps per session"}>
                <LineChart
                  height={280}
                  xAxis={[{ data: sessions.map((s) => s.date), scaleType: "point" }]}
                  series={[
                    selectedExerciseMeta?.usesDuration
                      ? {
                          data: sessions.map((s) => s.durationMs / 1000),
                          label: "Duration (seconds)",
                        }
                      : { data: sessions.map((s) => s.reps), label: "Reps" },
                  ]}
                />
              </ChartCard>
              <ChartCard title={selectedExerciseMeta?.usesDuration ? "Duration progression" : "Weight progression"}>
                {selectedExerciseMeta?.usesDuration ? (
                  <LineChart
                    height={280}
                    xAxis={[{ data: sessions.map((s) => s.date), scaleType: "point" }]}
                    series={[{ data: sessions.map((s) => s.durationMs / 1000), label: "Duration (seconds)" }]}
                  />
                ) : (
                  <LineChart
                    height={280}
                    xAxis={[{ data: sessions.map((s) => s.date), scaleType: "point" }]}
                    series={[
                      { data: sessions.map((s) => s.avgWeight), label: "Avg weight (kg)" },
                      { data: sessions.map((s) => s.maxWeight), label: "Max weight (kg)" },
                    ]}
                  />
                )}
              </ChartCard>
              <ChartCard title="Exercise frequency (weekly)">
                <BarChart
                  height={260}
                  xAxis={[{ data: weeklyFrequency.map((w) => w.week), scaleType: "band" }]}
                  series={[{ data: weeklyFrequency.map((w) => w.count), label: "Sets per week" }]}
                />
              </ChartCard>
            </Box>
            {selectedExerciseMeta?.usesDuration ? (
              <Typography variant="body2" color="text.secondary">
                Total tracked time:{" "}
                {formatDurationMs(sessions.reduce((acc, item) => acc + item.durationMs, 0))}
              </Typography>
            ) : null}
          </>
        )}
      </Stack>
    </Container>
  );
}

