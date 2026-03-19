import { Card, CardContent, Divider, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import { TrainingSetRecord } from "../../api/trainings";
import { getTopExercises } from "../../utils/trainingStats";

export function TopExercisesCard({ trainingSets }: { trainingSets: TrainingSetRecord[] }) {
  const topExercises = getTopExercises(trainingSets);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={800}>
            Top exercises
          </Typography>
          <Divider />

          {topExercises.length === 0 ? (
            <Typography color="text.secondary">No records yet.</Typography>
          ) : (
            <List dense disablePadding>
              {topExercises.map((item) => (
                <ListItem key={item.exercise} disableGutters>
                  <ListItemText
                    primary={item.exercise}
                    secondary={`Sets: ${item.count} • Avg weight: ${item.avgWeight.toFixed(1)} kg`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

