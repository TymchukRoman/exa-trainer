import { List, ListItemButton, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import type { WorkoutSuggestionItem } from "../../utils/trainingSuggestions";
import { Exercise } from "../Exercise";

export function WorkoutSuggestionList({
  title,
  items,
  showLastDone,
  onSelect,
}: {
  title: string;
  items: WorkoutSuggestionItem[];
  showLastDone: boolean;
  onSelect: (label: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      <List dense disablePadding>
        {items.map((item) => (
          <ListItemButton
            key={item.label}
            onClick={() => onSelect(item.label)}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <Stack spacing={0.25} sx={{ width: "100%" }}>
              <Exercise
                label={item.label}
                regions={item.regions}
                to={item.exerciseId ? `/exercise/${item.exerciseId}` : undefined}
              />
              {showLastDone && item.lastDoneDate ? (
                <Typography variant="caption" color="text.secondary">
                  Last done: {dayjs(item.lastDoneDate, "YYYY-MM-DD").format("MMM D, YYYY")}
                </Typography>
              ) : null}
            </Stack>
          </ListItemButton>
        ))}
      </List>
    </Stack>
  );
}
