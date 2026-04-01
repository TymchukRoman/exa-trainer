import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "../screens/HomePage";
import { PersonalRecordsPage } from "../screens/PersonalRecordsPage";
import { ExercisesPage } from "../screens/ExercisesPage";
import { SettingsPage } from "../screens/SettingsPage";
import { TrainingsListPage } from "../screens/TrainingsListPage";
import { ExerciseDetailsPage } from "../screens/ExerciseDetailsPage";
import { useAppContext } from "../state/AppContext";
import { Box, CircularProgress } from "@mui/material";

export function AppRouter() {
  const { isLoadingSettings, isConfigured } = useAppContext();

  if (isLoadingSettings) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isConfigured ? <HomePage /> : <Navigate to="/settings" replace />}
      />
      <Route
        path="/trainings"
        element={isConfigured ? <TrainingsListPage /> : <Navigate to="/settings" replace />}
      />
      <Route
        path="/records"
        element={isConfigured ? <PersonalRecordsPage /> : <Navigate to="/settings" replace />}
      />
      <Route
        path="/exercise"
        element={isConfigured ? <ExerciseDetailsPage /> : <Navigate to="/settings" replace />}
      />
      <Route
        path="/exercise/:id"
        element={isConfigured ? <ExerciseDetailsPage /> : <Navigate to="/settings" replace />}
      />
      <Route
        path="/exercises"
        element={isConfigured ? <ExercisesPage /> : <Navigate to="/settings" replace />}
      />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/progression" element={<Navigate to="/" replace />} />
      <Route
        path="*"
        element={<Navigate to={isConfigured ? "/" : "/settings"} replace />}
      />
    </Routes>
  );
}

