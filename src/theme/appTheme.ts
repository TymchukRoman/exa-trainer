import { createTheme } from "@mui/material/styles";
import { ThemeMode } from "../api/settings";

export function createAppTheme(mode: ThemeMode) {
  return createTheme({
    palette: {
      mode,
    },
    shape: {
      borderRadius: 10,
    },
  });
}

