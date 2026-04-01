import { Autocomplete, Box, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { getMuscleRegionIconSrc } from "../../constants/muscleRegionIcons";

export function MuscleRegionPicker({
  value,
  options,
  onChange,
  label = "Muscle regions",
  placeholder = "Any",
  helperText,
}: {
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
}) {
  return (
    <Autocomplete
      multiple
      options={options}
      value={value}
      onChange={(_, next) => onChange(next)}
      disableCloseOnSelect
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

