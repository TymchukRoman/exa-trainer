import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BarChart, LineChart } from "@mui/x-charts";
import dayjs from "dayjs";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Exercise } from "../components/Exercise";
import { getMuscleRegionIconSrc } from "../constants/muscleRegionIcons";
import { useAppContext } from "../state/AppContext";
import { formatDurationMs } from "../utils/duration";
import { formatMuscleGroupsForDisplay } from "../utils/muscleGroups";
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

export function ExerciseDetailsPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const exerciseId = params.id ?? "";

  const { trainingSets, exercises, muscleGroups, isLoadingTrainings } = useAppContext();

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const exerciseMap = useMemo(
    () => new Map(exercises.map((item) => [item.label.toLowerCase(), item])),
    [exercises],
  );

  const daysByExerciseId = useMemo(() => {
    const daysByLabel = new Map<string, Set<string>>();
    for (const set of trainingSets) {
      const k = set.exercise.toLowerCase();
      const byDate = daysByLabel.get(k) ?? new Set<string>();
      byDate.add(set.date);
      daysByLabel.set(k, byDate);
    }

    const daysById = new Map<string, number>();
    for (const [label, days] of daysByLabel.entries()) {
      const id = exerciseMap.get(label)?.id;
      if (id) daysById.set(id, days.size);
    }
    return daysById;
  }, [trainingSets, exerciseMap]);

  const selected = exerciseById.get(exerciseId);

  useEffect(() => {
    if (exercises.length === 0) return;
    if (exerciseId && exerciseById.has(exerciseId)) return;

    const top = [...exercises].sort((a, b) => {
      const ad = daysByExerciseId.get(a.id) ?? 0;
      const bd = daysByExerciseId.get(b.id) ?? 0;
      if (bd !== ad) return bd - ad;
      return a.label.localeCompare(b.label);
    })[0];

    if (top) {
      navigate(`/exercise/${top.id}`, { replace: true });
    }
  }, [exerciseId, exerciseById, navigate, exercises, daysByExerciseId]);

  const selectableExercises = useMemo(() => {
    return [...exercises].sort((a, b) => {
      const ad = daysByExerciseId.get(a.id) ?? 0;
      const bd = daysByExerciseId.get(b.id) ?? 0;
      if (bd !== ad) return bd - ad;
      return a.label.localeCompare(b.label);
    });
  }, [exercises, daysByExerciseId]);

  const filtered = useMemo(() => {
    if (!selected) return [];
    return trainingSets.filter((set) => set.exercise === selected.label);
  }, [trainingSets, selected]);

  const isDurationExercise = selected?.usesDuration ?? false;
  const isBodyweightOnly = selected?.isBodyweightOnly ?? false;

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
    for (const session of sessions) {
      const key = dayjs(session.date).startOf("week").format("YYYY-MM-DD");
      byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
    }
    return [...byWeek.entries()]
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([week, count]) => ({ week, count }));
  }, [sessions]);

  const weekdayAvgFrequency = useMemo(() => {
    const byWeekAndWeekday = new Map<string, Set<string>>();
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
    for (const session of sessions) {
      const weekKey = dayjs(session.date).startOf("week").format("YYYY-MM-DD");
      const weekday = dayjs(session.date).format("ddd");
      const key = `${weekKey}-${weekday}`;
      const set = byWeekAndWeekday.get(key) ?? new Set<string>();
      set.add(session.date);
      byWeekAndWeekday.set(key, set);
    }

    const weeks = new Set(weeklyFrequency.map((w) => w.week));
    const weekCount = weeks.size || 1;

    const totals = new Map<string, number>();
    for (const [key, dates] of byWeekAndWeekday.entries()) {
      const weekday = key.split("-").slice(3).join("-"); // handles YYYY-MM-DD-<weekday>
      totals.set(weekday, (totals.get(weekday) ?? 0) + dates.size);
    }

    const values = weekdays.map((w) => (totals.get(w) ?? 0) / weekCount);
    return { labels: weekdays as unknown as string[], values };
  }, [sessions, weeklyFrequency]);

  const totals = useMemo(() => {
    const totalSets = filtered.length;
    const totalReps = filtered.reduce((acc, s) => acc + s.reps, 0);
    const totalDurationMs = filtered.reduce((acc, s) => acc + (s.durationMs ?? 0), 0);
    const sessionCount = new Set(filtered.map((s) => s.date)).size;
    const avgWeight = totalSets ? filtered.reduce((acc, s) => acc + s.weight, 0) / totalSets : 0;
    const avgDurationMs = totalSets ? totalDurationMs / totalSets : 0;
    const avgRepsPerSet = totalSets ? totalReps / totalSets : 0;
    return {
      totalSets,
      totalReps,
      totalDurationMs,
      sessionCount,
      avgWeight,
      avgDurationMs,
      avgRepsPerSet,
    };
  }, [filtered]);

  const records = useMemo(() => {
    const maxWeight = filtered.length ? Math.max(...filtered.map((s) => s.weight)) : 0;
    const maxDurationMs = filtered.length ? Math.max(...filtered.map((s) => s.durationMs ?? 0)) : 0;
    const maxRepsPerSet = filtered.length ? Math.max(...filtered.map((s) => s.reps)) : 0;
    return { maxWeight, maxDurationMs, maxRepsPerSet };
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

  if (!selected) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="text.secondary">No exercises found.</Typography>
      </Container>
    );
  }

  const regions = Array.from(
    new Set(
      getExerciseRegions({
        exerciseLabel: selected.label,
        exerciseMap,
        muscleGroups,
      }),
    ),
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Autocomplete
          fullWidth
          options={selectableExercises}
          value={selected}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => option.label}
          renderOption={(props, option) => {
            const regions = Array.from(
              new Set(
                getExerciseRegions({
                  exerciseLabel: option.label,
                  exerciseMap,
                  muscleGroups,
                }),
              ),
            );
            const days = daysByExerciseId.get(option.id) ?? 0;
            return (
              <li {...props}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {regions.map((region) => (
                        <Box
                          key={`${option.id}-${region}`}
                          component="img"
                          src={getMuscleRegionIconSrc(region)}
                          alt={region}
                          sx={{ width: 18, height: 18, opacity: 0.9 }}
                        />
                      ))}
                    </Stack>
                    <Typography sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {option.label}
                    </Typography>
                  </Stack>
                  {days ? <Chip size="small" label={`${days} days`} /> : null}
                </Box>
              </li>
            );
          }}
          onChange={(_, value) => {
            if (!value) return;
            navigate(`/exercise/${value.id}`);
          }}
          renderInput={(params) => <TextField {...params} label="Exercise" />}
        />

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.25}>
              <Exercise
                label={selected.label}
                regions={regions}
                detailed
                description={formatMuscleGroupsForDisplay(muscleGroups, selected.muscleGroup)}
              />
              <Stack direction="row" spacing={0.75} flexWrap="wrap">
                {selected.isBodyweightOnly ? (
                  <Chip label="Bodyweight" size="small" variant="outlined" />
                ) : null}
                {selected.usesDuration ? <Chip label="Duration" size="small" variant="outlined" /> : null}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {filtered.length === 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary">No data for this exercise yet.</Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(6, 1fr)" },
                gap: 1.5,
              }}
            >
              {[
                { label: "Total sets", value: totals.totalSets },
                { label: "Total reps", value: totals.totalReps },
                { label: "Sessions", value: totals.sessionCount },
                !isBodyweightOnly ? { label: "Avg weight", value: `${totals.avgWeight.toFixed(1)} kg` } : null,
                isDurationExercise ? { label: "Avg time", value: formatDurationMs(totals.avgDurationMs) } : null,
                !isDurationExercise
                  ? { label: "Avg reps / set", value: totals.avgRepsPerSet.toFixed(1) }
                  : null,
              ]
                .filter(Boolean)
                .map((m) => (
                  <Card key={m!.label} variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {m!.label}
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {m!.value}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 1.5,
              }}
            >
              {(!isBodyweightOnly ? (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Max weight
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {records.maxWeight.toFixed(1)} kg
                    </Typography>
                  </CardContent>
                </Card>
              ) : null)}
              {(isDurationExercise ? (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Max time
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {formatDurationMs(records.maxDurationMs)}
                    </Typography>
                  </CardContent>
                </Card>
              ) : null)}
              {(!isDurationExercise ? (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Max reps / set
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {records.maxRepsPerSet}
                    </Typography>
                  </CardContent>
                </Card>
              ) : null)}
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
                  yAxis={[{ min: 0 }]}
                  series={[{ data: sessions.map((s) => s.sets), label: "Sets" }]}
                />
              </ChartCard>

              <ChartCard title={isDurationExercise ? "Time per session" : "Reps per session"}>
                <LineChart
                  height={280}
                  xAxis={[{ data: sessions.map((s) => s.date), scaleType: "point" }]}
                  yAxis={[{ min: 0 }]}
                  series={[
                    isDurationExercise
                      ? { data: sessions.map((s) => s.durationMs / 1000), label: "Duration (seconds)" }
                      : { data: sessions.map((s) => s.reps), label: "Reps" },
                  ]}
                />
              </ChartCard>

              <ChartCard title={isDurationExercise ? "Duration progression" : "Weight progression"}>
                {isDurationExercise ? (
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
                  series={[{ data: weeklyFrequency.map((w) => w.count), label: "Sessions per week" }]}
                />
              </ChartCard>

              <ChartCard title="Avg frequency by weekday">
                <BarChart
                  height={260}
                  xAxis={[{ data: weekdayAvgFrequency.labels, scaleType: "band" }]}
                  series={[{ data: weekdayAvgFrequency.values, label: "Avg sessions / week" }]}
                />
              </ChartCard>
            </Box>

            {isDurationExercise ? (
              <Typography variant="body2" color="text.secondary">
                Total tracked time: {formatDurationMs(totals.totalDurationMs)}
              </Typography>
            ) : null}
          </>
        )}
      </Stack>
    </Container>
  );
}

