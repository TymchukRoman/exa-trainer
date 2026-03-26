import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  IconButton,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import { formatDurationMs } from "../utils/duration";

export function TrainingSetItem({
  index,
  reps,
  weight,
  durationMs,
  isBodyweightOnly,
  onEdit,
  onDelete,
}: {
  index: number;
  reps: number;
  weight: number;
  durationMs?: number;
  isBodyweightOnly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const performanceText = durationMs ? formatDurationMs(durationMs) : `${reps} reps`;
  const loadText = isBodyweightOnly ? "" : ` @ ${weight} kg`;
  return (
    <ListItem disableGutters>
      <ListItemText
        primary={`Set ${index + 1}: ${performanceText}${loadText}`}
      />
      {(onEdit || onDelete) && (
        <ListItemSecondaryAction>
          {onEdit ? (
            <IconButton edge="end" aria-label="Edit set" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          ) : null}
          {onDelete ? (
            <IconButton
              edge="end"
              aria-label="Delete set"
              onClick={onDelete}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          ) : null}
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
}

