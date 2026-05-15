import { Card, CardContent, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import type { ExerciseRecord } from "../../api/exercises";
import type { MuscleGroupRecord } from "../../api/muscleGroups";
import type { TrainingSetRecord } from "../../api/trainings";
import { buildWorkoutSuggestions } from "../../utils/trainingSuggestions";
import { SingleMuscleRegionPicker } from "./SingleMuscleRegionPicker";
import { WorkoutSuggestionList } from "./WorkoutSuggestionList";

export function SelectWorkoutSection({
  exercises,
  trainingSets,
  muscleGroups,
  today,
  sessionExerciseLabels,
  onSelectExercise,
}: {
  exercises: ExerciseRecord[];
  trainingSets: TrainingSetRecord[];
  muscleGroups: MuscleGroupRecord[];
  today: string;
  sessionExerciseLabels: string[];
  onSelectExercise: (label: string) => void;
}) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const m of muscleGroups) set.add(m.region);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [muscleGroups]);

  const suggestions = useMemo(() => {
    if (!selectedRegion) {
      return { previouslyDone: [], tryThis: [] };
    }
    return buildWorkoutSuggestions({
      exercises,
      trainingSets,
      muscleGroups,
      region: selectedRegion,
      today,
      sessionExerciseLabels,
    });
  }, [
    selectedRegion,
    exercises,
    trainingSets,
    muscleGroups,
    today,
    sessionExerciseLabels,
  ]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Select workout</Typography>

          <SingleMuscleRegionPicker
            value={selectedRegion}
            options={regionOptions}
            onChange={setSelectedRegion}
            helperText="Pick a region to see exercise suggestions"
          />

          {!selectedRegion ? (
            <Typography color="text.secondary">
              Select a muscle region to see recommended exercises.
            </Typography>
          ) : (
            <Stack spacing={2}>
              <WorkoutSuggestionList
                title="Previously done"
                items={suggestions.previouslyDone}
                showLastDone
                onSelect={onSelectExercise}
              />
              {suggestions.previouslyDone.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No matching exercises in your history for this region (or all are already in
                  today&apos;s session).
                </Typography>
              ) : null}

              <WorkoutSuggestionList
                title="Try this"
                items={suggestions.tryThis}
                showLastDone={false}
                onSelect={onSelectExercise}
              />
              {suggestions.tryThis.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No new catalog exercises to suggest for this region.
                </Typography>
              ) : null}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
