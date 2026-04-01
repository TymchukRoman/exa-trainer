import {
  Box,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import type { ExerciseRecord } from "../../api/exercises";
import type { TrainingSetRecord } from "../../api/trainings";
import { getMuscleRegionIconSrc } from "../../constants/muscleRegionIcons";
import { useAppContext } from "../../state/AppContext";
import { buildMuscleGroupById } from "../../utils/muscleGroups";
import type { MuscleRegion } from "../../utils/trainingRegions";

type TimeWindow = "week" | "month";

export function MuscleRegionDistributionCard({
  trainingSets,
  exercises,
}: {
  trainingSets: TrainingSetRecord[];
  exercises: ExerciseRecord[];
}) {
  const { muscleGroups } = useAppContext();
  const [window, setWindow] = useState<TimeWindow>("month");
  const exerciseMap = useMemo(
    () => new Map(exercises.map((item) => [item.label.toLowerCase(), item])),
    [exercises],
  );
  const muscleById = useMemo(() => buildMuscleGroupById(muscleGroups), [muscleGroups]);

  const distribution = useMemo(() => {
    const daysBack = window === "week" ? 7 : 30;
    const start = dayjs().subtract(daysBack - 1, "day").startOf("day");

    const filtered = trainingSets.filter((set) => {
      const date = dayjs(set.date);
      return !date.isBefore(start, "day");
    });

    const counts = new Map<MuscleRegion, number>();
    for (const set of filtered) {
      const groups = exerciseMap.get(set.exercise.toLowerCase())?.muscleGroup ?? ["other"];
      const regions = new Set<MuscleRegion>();
      for (const groupId of groups) {
        const rawRegion = muscleById.get(groupId)?.region;
        const region = rawRegion?.trim().toLowerCase() as MuscleRegion | undefined;
        if (region) regions.add(region);
      }
      for (const region of regions) {
        counts.set(region, (counts.get(region) ?? 0) + 1);
      }
    }

    const total = [...counts.values()].reduce((acc, val) => acc + val, 0);
    const rows = [...counts.entries()]
      .map(([region, count]) => ({
        region,
        count,
        percent: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { rows, total };
  }, [trainingSets, window, exerciseMap, muscleById]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Muscle regions distribution
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Based on set counts for the selected period
              </Typography>
            </Box>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={window}
              onChange={(_, value: TimeWindow | null) => {
                if (value) setWindow(value);
              }}
            >
              <ToggleButton value="week">Last week</ToggleButton>
              <ToggleButton value="month">Last month</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Divider />

          {distribution.rows.length === 0 ? (
            <Typography color="text.secondary">No data in selected period.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {distribution.rows.map((row) => {
                const iconSrc = getMuscleRegionIconSrc(row.region);
                return (
                  <Box key={row.region}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          component="img"
                          src={iconSrc}
                          alt={row.region}
                          sx={{ width: 18, height: 18, opacity: 0.75 }}
                        />
                        <Typography sx={{ textTransform: "capitalize" }}>{row.region}</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {row.count} sets ({row.percent.toFixed(1)}%)
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, row.percent)}
                      sx={{ mt: 0.75, height: 8, borderRadius: 8 }}
                    />
                  </Box>
                );
              })}
              <Typography variant="caption" color="text.secondary">
                Total region hits: {distribution.total}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

