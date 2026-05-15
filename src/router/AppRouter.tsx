import { Box, CircularProgress } from "@mui/material";
import { useMemo, type ReactNode } from "react";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  type RouteObject,
} from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { ExerciseDetailsPage } from "../screens/ExerciseDetailsPage";
import { ExercisesPage } from "../screens/ExercisesPage";
import { HomePage } from "../screens/HomePage";
import { PersonalRecordsPage } from "../screens/PersonalRecordsPage";
import { SettingsPage } from "../screens/SettingsPage";
import { TrainingPage } from "../screens/TrainingPage";
import { TrainingsListPage } from "../screens/TrainingsListPage";
import { useAppContext } from "../state/AppContext";

function buildRoutes(isConfigured: boolean): RouteObject[] {
  const guard = (page: ReactNode) =>
    isConfigured ? page : <Navigate to="/settings" replace />;

  return [
    { path: "/training", element: guard(<TrainingPage />) },
    { path: "/trainings", element: guard(<TrainingsListPage />) },
    { path: "/records", element: guard(<PersonalRecordsPage />) },
    { path: "/exercise", element: guard(<ExerciseDetailsPage />) },
    { path: "/exercise/:id", element: guard(<ExerciseDetailsPage />) },
    { path: "/exercises", element: guard(<ExercisesPage />) },
    { path: "/settings", element: <SettingsPage /> },
    { path: "/progression", element: <Navigate to="/" replace /> },
    { path: "/", element: guard(<HomePage />) },
    {
      path: "*",
      element: <Navigate to={isConfigured ? "/" : "/settings"} replace />,
    },
  ];
}

export function AppRouter() {
  const { isLoadingSettings, isConfigured } = useAppContext();

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          element: <AppShell />,
          children: buildRoutes(isConfigured),
        },
      ]),
    [isConfigured],
  );

  if (isLoadingSettings) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return <RouterProvider router={router} />;
}
