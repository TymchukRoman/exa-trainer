import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { getTrainingSets, TrainingSetRecord } from "../api/trainings";
import {
  checkMongoConnection,
  getLocalSettings,
  setMongoConnectionUrl,
  setThemeMode,
  ThemeMode,
} from "../api/settings";

export type AppContextValue = {
  data: unknown;
  setData: React.Dispatch<React.SetStateAction<unknown>>;
  isLoadingSettings: boolean;
  mongoConnectionUrl: string | null;
  themeMode: ThemeMode;
  isConfigured: boolean;
  saveMongoConnectionUrl: (url: string) => Promise<void>;
  checkMongoConnectionUrl: (url: string) => Promise<boolean>;
  saveThemeMode: (mode: ThemeMode) => Promise<void>;
  reloadSettings: () => Promise<void>;
  trainingSets: TrainingSetRecord[];
  groupedTrainingSets: GroupedTrainingByDate[];
  isLoadingTrainings: boolean;
  isFetchingTrainings: boolean;
  refetchTrainingSets: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export type GroupedTrainingByExercise = {
  exercise: string;
  sets: Array<{ id: string; reps: number; weight: number }>;
};

export type GroupedTrainingByDate = {
  date: string;
  exercises: GroupedTrainingByExercise[];
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<unknown>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [mongoConnectionUrl, setMongoConnectionUrlState] = useState<string | null>(null);
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");

  const reloadSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const settings = await getLocalSettings();
      setMongoConnectionUrlState(settings.mongoConnectionUrl);
      setThemeModeState(settings.themeMode ?? "light");
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    void reloadSettings();
  }, [reloadSettings]);

  const saveMongoConnectionUrl = useCallback(async (url: string) => {
    await setMongoConnectionUrl(url);
    setMongoConnectionUrlState(url);
  }, []);

  const checkMongoConnectionUrl = useCallback(async (url: string) => {
    return checkMongoConnection(url);
  }, []);

  const saveThemeMode = useCallback(async (mode: ThemeMode) => {
    await setThemeMode(mode);
    setThemeModeState(mode);
  }, []);

  const isConfigured = Boolean(mongoConnectionUrl?.trim());

  const trainingsQuery = useQuery({
    queryKey: ["training-sets"],
    queryFn: getTrainingSets,
    enabled: isConfigured,
  });

  const trainingSets = trainingsQuery.data ?? [];

  const groupedTrainingSets = useMemo<GroupedTrainingByDate[]>(() => {
    const dateMap = new Map<
      string,
      Map<string, Array<{ id: string; reps: number; weight: number }>>
    >();

    for (const setItem of trainingSets) {
      const exerciseMap = dateMap.get(setItem.date) ?? new Map();
      const setsForExercise = exerciseMap.get(setItem.exercise) ?? [];
      setsForExercise.push({ id: setItem.id, reps: setItem.reps, weight: setItem.weight });
      exerciseMap.set(setItem.exercise, setsForExercise);
      dateMap.set(setItem.date, exerciseMap);
    }

    return [...dateMap.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, exerciseMap]) => ({
        date,
        exercises: [...exerciseMap.entries()].map(([exercise, sets]) => ({
          exercise,
          sets,
        })),
      }));
  }, [trainingSets]);

  const refetchTrainingSets = useCallback(async () => {
    await trainingsQuery.refetch();
  }, [trainingsQuery]);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      setData,
      isLoadingSettings,
      mongoConnectionUrl,
      themeMode,
      isConfigured,
      saveMongoConnectionUrl,
      checkMongoConnectionUrl,
      saveThemeMode,
      reloadSettings,
      trainingSets,
      groupedTrainingSets,
      isLoadingTrainings: trainingsQuery.isLoading,
      isFetchingTrainings: trainingsQuery.isFetching,
      refetchTrainingSets,
    }),
    [
      data,
      isLoadingSettings,
      mongoConnectionUrl,
      themeMode,
      isConfigured,
      saveMongoConnectionUrl,
      checkMongoConnectionUrl,
      saveThemeMode,
      reloadSettings,
      trainingSets,
      groupedTrainingSets,
      trainingsQuery.isLoading,
      trainingsQuery.isFetching,
      refetchTrainingSets,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return value;
}

