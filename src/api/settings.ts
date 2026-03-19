import { invoke } from "@tauri-apps/api/core";

export type ThemeMode = "light" | "dark";

export type LocalSettings = {
  mongoConnectionUrl: string | null;
  themeMode: ThemeMode | null;
};

type LocalSettingsDto = {
  mongo_connection_url: string | null;
  theme_mode: string | null;
};

export async function getLocalSettings(): Promise<LocalSettings> {
  const raw = await invoke<LocalSettingsDto>("get_local_settings");
  const themeMode =
    raw.theme_mode === "dark" || raw.theme_mode === "light"
      ? raw.theme_mode
      : null;
  return {
    mongoConnectionUrl: raw.mongo_connection_url ?? null,
    themeMode,
  };
}

export async function setMongoConnectionUrl(url: string): Promise<void> {
  await invoke("set_mongo_connection_url", { url });
}

export async function checkMongoConnection(url: string): Promise<boolean> {
  return invoke<boolean>("check_mongo_connection", { url });
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await invoke("set_theme_mode", { mode });
}

