import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  Chip,
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  Stack,
  Typography,
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
  const loadText = isBodyweightOnly || weight === 0 ? null : `${weight} kg`;
  return (
    <ListItem disableGutters>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ whiteSpace: "nowrap" }}>{`Set ${index + 1}:`}</Typography>
        <Chip size="small" label={performanceText} />
        {loadText ? <Chip size="small" label={loadText} variant="outlined" /> : null}
      </Stack>
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

