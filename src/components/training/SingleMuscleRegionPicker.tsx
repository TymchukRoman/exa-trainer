import { Autocomplete, Box, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { getMuscleRegionIconSrc } from "../../constants/muscleRegionIcons";

export function SingleMuscleRegionPicker({
  value,
  options,
  onChange,
  label = "Muscle region",
  placeholder = "Select region",
  helperText,
}: {
  value: string | null;
  options: string[];
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
}) {
  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={(_, next) => onChange(next)}
      getOptionLabel={(region) => region}
      renderOption={(props, region) => {
        const src = getMuscleRegionIconSrc(region);
        return (
          <li {...props}>
            <Tooltip title={region} placement="right">
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  component="img"
                  src={src}
                  alt={region}
                  sx={{ width: 18, height: 18, opacity: 0.9 }}
                />
                <Typography>{region}</Typography>
              </Stack>
            </Tooltip>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={placeholder} helperText={helperText} />
      )}
      fullWidth
    />
  );
}
