import { Box, Card, CardContent, Divider, List, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { TrainingSetRecord } from "../../api/trainings";
import { getPersonalRecords } from "../../utils/trainingStats";
import { TrainingSetItem } from "../TrainingSetItem";

export function PersonalRecordsPanel({
  trainingSets,
  maxItems,
}: {
  trainingSets: TrainingSetRecord[];
  maxItems?: number;
}) {
  const records = useMemo(() => getPersonalRecords(trainingSets), [trainingSets]);
  const visible = typeof maxItems === "number" ? records.slice(0, maxItems) : records;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography variant="h6" fontWeight={800}>
              Personal records
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Max weight per exercise
            </Typography>
          </Stack>
          <Divider />

          {visible.length === 0 ? (
            <Typography color="text.secondary">
              Add sets to see personal records per exercise.
            </Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 1.5,
              }}
            >
              {visible.map((record) => (
                <Box
                  key={record.exercise}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                  }}
                >
                  <Typography fontWeight={800}>{record.exercise}</Typography>
                  <List dense disablePadding sx={{ mt: 0.5 }}>
                    <TrainingSetItem index={0} reps={record.reps} weight={record.weight} />
                  </List>
                  <Typography color="text.secondary" sx={{ mt: 0.25 }}>
                    Date: {record.date}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {typeof maxItems === "number" && records.length > maxItems ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Showing top {maxItems}. Open Personal Records for full list.
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

