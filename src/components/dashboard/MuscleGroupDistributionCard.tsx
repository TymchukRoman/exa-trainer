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
import { TrainingSetRecord } from "../../api/trainings";
import { getExerciseMeta } from "../../utils/exerciseCatalog";

type TimeWindow = "week" | "month";

export function MuscleGroupDistributionCard({
  trainingSets,
}: {
  trainingSets: TrainingSetRecord[];
}) {
  const [window, setWindow] = useState<TimeWindow>("month");

  const distribution = useMemo(() => {
    const daysBack = window === "week" ? 7 : 30;
    const start = dayjs().subtract(daysBack - 1, "day").startOf("day");

    const filtered = trainingSets.filter((set) => {
      const date = dayjs(set.date);
      return !date.isBefore(start, "day");
    });

    const counts = new Map<string, number>();
    for (const set of filtered) {
      const groups = getExerciseMeta(set.exercise)?.muscleGroup ?? ["other"];
      for (const group of groups) {
        counts.set(group, (counts.get(group) ?? 0) + 1);
      }
    }

    const total = [...counts.values()].reduce((acc, val) => acc + val, 0);
    const rows = [...counts.entries()]
      .map(([group, count]) => ({
        group,
        count,
        percent: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { rows, total };
  }, [trainingSets, window]);

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
                Muscle group distribution
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
            <Typography color="text.secondary">
              No data in selected period.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {distribution.rows.map((row) => (
                <Box key={row.group}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ textTransform: "capitalize" }}>{row.group}</Typography>
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
              ))}
              <Typography variant="caption" color="text.secondary">
                Total group hits: {distribution.total}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

