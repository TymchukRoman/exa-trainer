import { Button, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { parseDurationToMs } from "../../utils/duration";

export type InlineSetInput = {
  reps: number;
  weight: number;
  durationMs?: number;
};

export function InlineAddSetForm({
  usesDuration,
  isBodyweightOnly,
  isSaving,
  onSubmit,
  onCancel,
}: {
  usesDuration: boolean;
  isBodyweightOnly: boolean;
  isSaving: boolean;
  onSubmit: (set: InlineSetInput) => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [metricInput, setMetricInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const reps = usesDuration ? 1 : Number(metricInput);
    const parsedDuration = usesDuration ? parseDurationToMs(metricInput) : null;
    const durationMs = parsedDuration ?? undefined;
    const weight = isBodyweightOnly ? 0 : Number(weightInput);

    if (usesDuration && !parsedDuration) {
      setError('Use duration format like "1h 2m 1s".');
      return;
    }
    if (!usesDuration && (!Number.isFinite(reps) || reps <= 0)) {
      setError("Reps must be greater than zero.");
      return;
    }
    if (!isBodyweightOnly && !Number.isFinite(weight)) {
      setError("Weight must be a valid number.");
      return;
    }

    await onSubmit({ reps, weight, durationMs });
    setMetricInput("");
    setWeightInput("");
  };

  return (
    <Stack spacing={1}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          label={usesDuration ? "Duration" : "Reps"}
          placeholder={usesDuration ? "1h 2m 1s" : undefined}
          type={usesDuration ? "text" : "number"}
          value={metricInput}
          onChange={(e) => setMetricInput(e.target.value)}
          inputProps={usesDuration ? undefined : { min: 1 }}
          error={Boolean(error)}
          helperText={error}
          size="small"
          fullWidth
        />
        {isBodyweightOnly ? null : (
          <TextField
            label="Weight (kg)"
            type="number"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            inputProps={{ min: -999999, step: 0.5 }}
            size="small"
            fullWidth
          />
        )}
        <Button
          variant="contained"
          size="small"
          disabled={isSaving}
          onClick={() => void handleSubmit()}
          sx={{ whiteSpace: "nowrap" }}
        >
          Add set
        </Button>
        {onCancel ? (
          <Button size="small" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}
