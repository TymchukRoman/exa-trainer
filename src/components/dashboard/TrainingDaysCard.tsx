import { Box, Card, CardContent, Divider, Stack, Tooltip, Typography } from "@mui/material";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { TrainingSetRecord } from "../../api/trainings";
import { getDaySummaryMap } from "../../utils/trainingStats";

dayjs.extend(isoWeek);

const WEEKS = 15;

export function TrainingDaysCard({ trainingSets }: { trainingSets: TrainingSetRecord[] }) {
  const theme = useTheme();

  const heatmap = useMemo(() => {
    const today = dayjs().startOf("day");
    const currentMonday = today.startOf("isoWeek");
    const oldestMonday = currentMonday.subtract(WEEKS - 1, "week");

    const cells: { day: dayjs.Dayjs; inRange: boolean }[] = [];
    for (let w = 0; w < WEEKS; w++) {
      const monday = oldestMonday.add(w, "week");
      for (let d = 0; d < 7; d++) {
        const day = monday.add(d, "day");
        const inRange = !day.isAfter(today, "day");
        cells.push({ day, inRange });
      }
    }

    const summary = getDaySummaryMap(trainingSets);
    const counts = cells.filter((c) => c.inRange).map((c) => summary.get(c.day.format("YYYY-MM-DD"))?.count ?? 0);
    const nonZero = counts.filter((c) => c > 0);
    const max = nonZero.length ? Math.max(...nonZero) : 0;

    const sorted = [...nonZero].sort((a, b) => a - b);
    const q = (p: number) => sorted[Math.floor((sorted.length - 1) * p)] ?? 0;
    const t1 = q(0.25);
    const t2 = q(0.5);
    const t3 = q(0.75);

    const level = (count: number) => {
      if (count <= 0) return 0;
      if (count <= t1) return 1;
      if (count <= t2) return 2;
      if (count <= t3) return 3;
      return 4;
    };

    const lightModeColors = ["#e0e0e0", "#b3d9ff", "#7fc4ff", "#3aa0ff", "#1a73e8"];
    const darkModeColors = ["#2a2a2a", "#2f4f7a", "#2e6da4", "#2c8be3", "#1a73e8"];
    const colors = theme.palette.mode === "dark" ? darkModeColors : lightModeColors;

    return { cells, summary, max, level, colors };
  }, [trainingSets, theme.palette.mode]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography variant="h6" fontWeight={800}>
              Training days
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last {WEEKS} weeks
            </Typography>
          </Stack>

          <Divider />

          {heatmap.max === 0 ? (
            <Typography color="text.secondary">
              No training data yet. Click the + button to add your first sets.
            </Typography>
          ) : (
            <Box sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateRows: "repeat(7, 12px)",
                  gridAutoColumns: "12px",
                  gridAutoFlow: "column",
                  gap: "5px",
                  justifyContent: "start",
                  overflowX: "auto",
                }}
              >
                {heatmap.cells.map(({ day, inRange }) => {
                  const dateStr = day.format("YYYY-MM-DD");
                  if (!inRange) {
                    return <Box key={`empty-${dateStr}`} sx={{ width: 12, height: 12 }} />;
                  }
                  const details = heatmap.summary.get(dateStr);
                  const count = details?.count ?? 0;
                  const l = heatmap.level(count);

                  return (
                    <Tooltip
                      key={dateStr}
                      arrow
                      title={
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {dateStr}
                          </Typography>
                          <Typography variant="body2">
                            {count} set{count === 1 ? "" : "s"}
                          </Typography>
                          {details?.exercises.length ? (
                            <Box sx={{ mt: 0.5 }}>
                              {details.exercises.slice(0, 4).map((item) => (
                                <Typography key={`${dateStr}-${item.exercise}`} variant="caption" display="block">
                                  {item.exercise}: {item.sets}
                                </Typography>
                              ))}
                            </Box>
                          ) : null}
                        </Box>
                      }
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "3px",
                          backgroundColor: heatmap.colors[l],
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Less
                </Typography>
                <Box sx={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {[1, 2, 3, 4].map((l) => (
                    <Box
                      key={l}
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "3px",
                        backgroundColor: heatmap.colors[l],
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  More
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
