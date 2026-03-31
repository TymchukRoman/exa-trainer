import { Autocomplete, Box, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { getMuscleRegionIconSrc } from "../../constants/muscleRegionIcons";
import type { MuscleGroupRecord } from "../../api/muscleGroups";

export function MuscleGroupPicker({
  catalog,
  value,
  options,
  onChange,
  label = "Muscle groups",
  placeholder = "Any",
  helperText,
}: {
  catalog: MuscleGroupRecord[];
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
}) {
  const byId = new Map(catalog.map((m) => [m.id, m]));

  return (
    <Autocomplete
      multiple
      options={options}
      value={value}
      onChange={(_, next) => onChange(next)}
      disableCloseOnSelect
      getOptionLabel={(id) => byId.get(id)?.name ?? id}
      renderOption={(props, id) => {
        const item = byId.get(id);
        const region = item?.region ?? "core";
        const src = getMuscleRegionIconSrc(region);
        return (
          <li {...props}>
            <Tooltip title={`${item?.name ?? id} (region: ${region})`} placement="right">
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  component="img"
                  src={src}
                  alt={region}
                  sx={{ width: 18, height: 18, opacity: 0.9 }}
                />
                <Typography>{item?.name ?? id}</Typography>
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

