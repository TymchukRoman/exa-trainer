import { Card, CardContent, Divider, List, ListItem, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { TrainingSetRecord } from "../../api/trainings";
import { getTopExercises } from "../../utils/trainingStats";
import { useAppContext } from "../../state/AppContext";
import { getExerciseRegions } from "../../utils/trainingRegions";
import { Exercise } from "../Exercise";

export function TopExercisesCard({ trainingSets }: { trainingSets: TrainingSetRecord[] }) {
  const { exercises, muscleGroups } = useAppContext();
  const topExercises = getTopExercises(trainingSets);
  const exerciseMap = useMemo(
    () => new Map(exercises.map((item) => [item.label.toLowerCase(), item])),
    [exercises],
  );

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
                  <Stack spacing={0.25} sx={{ width: "100%" }}>
                    <Exercise
                      label={item.exercise}
                      to={
                        exerciseMap.get(item.exercise.toLowerCase())?.id
                          ? `/exercise/${exerciseMap.get(item.exercise.toLowerCase())?.id}`
                          : undefined
                      }
                      regions={Array.from(
                        new Set(
                          getExerciseRegions({
                            exerciseLabel: item.exercise,
                            exerciseMap,
                            muscleGroups,
                          }),
                        ),
                      )}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Sets: {item.count} • Avg weight: {item.avgWeight.toFixed(1)} kg
                    </Typography>
                  </Stack>
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

