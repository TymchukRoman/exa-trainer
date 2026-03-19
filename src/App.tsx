import { AppShell } from "./components/AppShell";
import { AppRouter } from "./router/AppRouter";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { useMemo } from "react";
import { useAppContext } from "./state/AppContext";
import { createAppTheme } from "./theme/appTheme";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export default function App() {
  const { themeMode } = useAppContext();
  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppShell>
          <AppRouter />
        </AppShell>
      </ThemeProvider>
    </LocalizationProvider>
  );
}
