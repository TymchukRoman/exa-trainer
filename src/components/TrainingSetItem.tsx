import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  IconButton,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";

export function TrainingSetItem({
  index,
  reps,
  weight,
  onEdit,
  onDelete,
}: {
  index: number;
  reps: number;
  weight: number;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <ListItem disableGutters>
      <ListItemText
        primary={`Set ${index + 1}: ${reps} reps @ ${weight} kg`}
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

