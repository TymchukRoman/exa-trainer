use serde::{Deserialize, Serialize};
use std::fs;
use std::net::{TcpStream, ToSocketAddrs};
use std::path::PathBuf;
use std::time::Duration;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub(crate) struct LocalSettings {
    pub(crate) mongo_connection_url: Option<String>,
    pub(crate) theme_mode: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct LocalSettingsDto {
    mongo_connection_url: Option<String>,
    theme_mode: Option<String>,
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to resolve app config dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create config dir: {e}"))?;
    Ok(dir.join("exa_trainer_settings.json"))
}

pub(crate) fn read_settings(app: &tauri::AppHandle) -> Result<LocalSettings, String> {
    let path = settings_path(app)?;
    let raw = match fs::read_to_string(&path) {
        Ok(v) => v,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
            return Ok(LocalSettings::default())
        }
        Err(err) => return Err(format!("Failed to read settings file: {err}")),
    };
    serde_json::from_str(&raw).map_err(|e| format!("Failed to parse settings: {e}"))
}

fn write_settings(app: &tauri::AppHandle, settings: &LocalSettings) -> Result<(), String> {
    let path = settings_path(app)?;
    let json =
        serde_json::to_string_pretty(settings).map_err(|e| format!("Failed to serialize settings: {e}"))?;
    fs::write(path, json).map_err(|e| format!("Failed to write settings file: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn get_local_settings(app: tauri::AppHandle) -> Result<LocalSettingsDto, String> {
    let settings = read_settings(&app)?;
    Ok(LocalSettingsDto {
        mongo_connection_url: settings.mongo_connection_url,
        theme_mode: settings.theme_mode,
    })
}

#[tauri::command]
pub fn set_mongo_connection_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return Err("MongoDB connection string cannot be empty".to_string());
    }
    let mut settings = read_settings(&app)?;
    settings.mongo_connection_url = Some(trimmed.to_string());
    write_settings(&app, &settings)?;
    Ok(())
}

#[tauri::command]
pub fn set_theme_mode(app: tauri::AppHandle, mode: String) -> Result<(), String> {
    if mode != "light" && mode != "dark" {
        return Err("Theme mode must be either 'light' or 'dark'".to_string());
    }
    let mut settings = read_settings(&app)?;
    settings.theme_mode = Some(mode);
    write_settings(&app, &settings)?;
    Ok(())
}

#[tauri::command]
pub fn check_mongo_connection(url: String) -> Result<bool, String> {
    let trimmed = url.trim();
    if !(trimmed.starts_with("mongodb://") || trimmed.starts_with("mongodb+srv://")) {
        return Err("Connection string must start with mongodb:// or mongodb+srv://".to_string());
    }
    if trimmed.starts_with("mongodb+srv://") {
        return Ok(true);
    }

    let without_scheme = trimmed.trim_start_matches("mongodb://");
    let host_port = without_scheme
        .split('@')
        .next_back()
        .and_then(|s| s.split('/').next())
        .ok_or_else(|| "Invalid MongoDB connection string".to_string())?;

    let primary = host_port
        .split(',')
        .next()
        .ok_or_else(|| "Invalid MongoDB host segment".to_string())?;
    let primary_with_port = if primary.contains(':') {
        primary.to_string()
    } else {
        format!("{primary}:27017")
    };

    let mut addrs = primary_with_port
        .to_socket_addrs()
        .map_err(|_| "Unable to resolve MongoDB host".to_string())?;
    let addr = addrs
        .next()
        .ok_or_else(|| "Unable to resolve MongoDB host".to_string())?;
    TcpStream::connect_timeout(&addr, Duration::from_secs(3))
        .map(|_| true)
        .map_err(|e| format!("Unable to connect to MongoDB host: {e}"))
}

#[tauri::command]
pub fn get_mongo_connection_url(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let settings = read_settings(&app)?;
    Ok(settings.mongo_connection_url)
}

#[tauri::command]
pub fn get_theme_mode(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let settings = read_settings(&app)?;
    Ok(settings.theme_mode)
}

#[tauri::command]
pub fn clear_mongo_connection_url(app: tauri::AppHandle) -> Result<(), String> {
    let mut settings = read_settings(&app)?;
    settings.mongo_connection_url = None;
    write_settings(&app, &settings)?;
    Ok(())
}
