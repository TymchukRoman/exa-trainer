import { Box, Link, Stack, Tooltip, Typography } from "@mui/material";
import { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { getMuscleRegionIconSrc } from "../constants/muscleRegionIcons";

export type ExerciseProps = {
  label: string;
  regions: string[];
  description?: ReactNode;
  detailed?: boolean;
  iconSize?: number;
  to?: string;
};

export function Exercise({
  label,
  regions,
  description,
  detailed = false,
  iconSize = 18,
  to,
}: ExerciseProps) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ minWidth: 0 }}>
        {to ? (
          <Link
            component={RouterLink}
            to={to}
            underline="hover"
            color="inherit"
            sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {label}
          </Link>
        ) : (
          <Typography fontWeight={700} sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </Typography>
        )}
        <Stack direction="row" spacing={0.5} alignItems="center">
          {regions.map((region) => (
            <Tooltip key={`${label}-${region}`} title={region}>
              <Box
                component="img"
                src={getMuscleRegionIconSrc(region)}
                alt={region}
                sx={{ width: iconSize, height: iconSize, opacity: 0.9 }}
              />
            </Tooltip>
          ))}
        </Stack>
      </Stack>

      {detailed ? (
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      ) : null}
    </Stack>
  );
}

