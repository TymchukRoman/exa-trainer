import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { TrainingSetRecord } from "../../api/trainings";
import { PersonalRecordStat } from "../../utils/trainingStats";

type Emphasis = "weight" | "reps";

export function ExerciseRecordsCard({
  title,
  subtitle,
  trainingSets,
  emphasis,
  getRecords,
  maxItems,
}: {
  title: string;
  subtitle: string;
  trainingSets: TrainingSetRecord[];
  emphasis: Emphasis;
  getRecords: (sets: TrainingSetRecord[]) => PersonalRecordStat[];
  maxItems?: number;
}) {
  const allRecords = useMemo(() => getRecords(trainingSets), [trainingSets, getRecords]);
  const visible = typeof maxItems === "number" ? allRecords.slice(0, maxItems) : allRecords;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" flexWrap="wrap" gap={1}>
            <Typography variant="h6" fontWeight={800}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>
          <Divider />

          {visible.length === 0 ? (
            <Typography color="text.secondary">No records for the current filters.</Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 1.25,
              }}
            >
              {visible.map((record) => (
                <Stack key={record.exercise} spacing={0.25}>
                  <Typography fontWeight={700} variant="body2">
                    {record.exercise}
                  </Typography>
                  <Typography variant="body1" fontWeight={800}>
                    {emphasis === "weight" ? `${record.weight} kg` : `${record.reps} reps`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {emphasis === "weight" ? `${record.reps} reps` : `${record.weight} kg`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {record.date}
                  </Typography>
                </Stack>
              ))}
            </Box>
          )}

          {typeof maxItems === "number" && allRecords.length > maxItems ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Showing top {maxItems}. Open Personal Records for the full list.
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
