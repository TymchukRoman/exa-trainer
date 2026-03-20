// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use mongodb::bson::{doc, DateTime as BsonDateTime, Document};
use mongodb::bson::oid::ObjectId;
use mongodb::Client;
use serde::{Deserialize, Serialize};
use std::fs;
use std::net::{TcpStream, ToSocketAddrs};
use std::path::PathBuf;
use std::time::Duration;
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct LocalSettings {
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

fn read_settings(app: &tauri::AppHandle) -> Result<LocalSettings, String> {
    let path = settings_path(&app)?;
    let raw = match fs::read_to_string(&path) {
        Ok(v) => v,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => return Ok(LocalSettings::default()),
        Err(err) => return Err(format!("Failed to read settings file: {err}")),
    };
    serde_json::from_str(&raw).map_err(|e| format!("Failed to parse settings: {e}"))
}

fn write_settings(app: &tauri::AppHandle, settings: &LocalSettings) -> Result<(), String> {
    let path = settings_path(app)?;
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {e}"))?;
    fs::write(path, json).map_err(|e| format!("Failed to write settings file: {e}"))?;
    Ok(())
}

#[derive(Debug, Clone, Serialize)]
struct LocalSettingsDto {
    mongo_connection_url: Option<String>,
    theme_mode: Option<String>,
}

#[tauri::command]
fn get_local_settings(app: tauri::AppHandle) -> Result<LocalSettingsDto, String> {
    let settings = read_settings(&app)?;
    Ok(LocalSettingsDto {
        mongo_connection_url: settings.mongo_connection_url,
        theme_mode: settings.theme_mode,
    })
}

/// Stores MongoDB connection URL locally (app config dir).
#[tauri::command]
fn set_mongo_connection_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
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
fn set_theme_mode(app: tauri::AppHandle, mode: String) -> Result<(), String> {
    if mode != "light" && mode != "dark" {
        return Err("Theme mode must be either 'light' or 'dark'".to_string());
    }
    let mut settings = read_settings(&app)?;
    settings.theme_mode = Some(mode);
    write_settings(&app, &settings)?;
    Ok(())
}

#[tauri::command]
fn check_mongo_connection(url: String) -> Result<bool, String> {
    let trimmed = url.trim();
    if !(trimmed.starts_with("mongodb://") || trimmed.starts_with("mongodb+srv://")) {
        return Err("Connection string must start with mongodb:// or mongodb+srv://".to_string());
    }
    if trimmed.starts_with("mongodb+srv://") {
        // SRV records require a MongoDB driver/DNS SRV resolution; treat valid format as reachable for now.
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

/// Backward-compatible single-field getter.
#[tauri::command]
fn get_mongo_connection_url(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let settings = read_settings(&app)?;
    Ok(settings.mongo_connection_url)
}

/// Backward-compatible theme getter.
#[tauri::command]
fn get_theme_mode(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let settings = read_settings(&app)?;
    Ok(settings.theme_mode)
}

#[tauri::command]
fn clear_mongo_connection_url(app: tauri::AppHandle) -> Result<(), String> {
    let mut settings = read_settings(&app)?;
    settings.mongo_connection_url = None;
    write_settings(&app, &settings)?;
    Ok(())
}

#[derive(Debug, Clone, Deserialize)]
struct TrainingSetInput {
    exercise: String,
    reps: i32,
    weight: f64,
    date: String,
}

#[derive(Debug, Clone, Serialize)]
struct TrainingSetOutput {
    id: String,
    exercise: String,
    reps: i32,
    weight: f64,
    date_ms: i64,
}

#[tauri::command]
async fn save_training_sets(
    app: tauri::AppHandle,
    sets: Vec<TrainingSetInput>,
) -> Result<usize, String> {
    if sets.is_empty() {
        return Err("No sets provided".to_string());
    }

    let settings = read_settings(&app)?;
    let mongo_url = settings
        .mongo_connection_url
        .ok_or_else(|| "MongoDB connection string is not configured".to_string())?;

    let client = Client::with_uri_str(&mongo_url)
        .await
        .map_err(|e| format!("Failed to initialize MongoDB client: {e}"))?;
    let collection = client
        .database("EXA_TRAINER")
        .collection::<Document>("sets");

    let documents: Result<Vec<Document>, String> = sets
        .into_iter()
        .map(|set_item| {
            if set_item.exercise.trim().is_empty() {
                return Err("Exercise name cannot be empty".to_string());
            }
            if set_item.reps <= 0 {
                return Err("Reps must be greater than zero".to_string());
            }
            if !set_item.weight.is_finite() {
                return Err("Weight must be a finite number".to_string());
            }

            let date = BsonDateTime::parse_rfc3339_str(&format!("{}T00:00:00Z", set_item.date))
                .map_err(|e| format!("Invalid date format: {e}"))?;

            Ok(doc! {
                "exercise": set_item.exercise.trim(),
                "reps": set_item.reps,
                "weight": set_item.weight,
                "date": date,
            })
        })
        .collect();

    let documents = documents?;
    let result = collection
        .insert_many(documents)
        .await
        .map_err(|e| format!("Failed to insert sets: {e}"))?;

    Ok(result.inserted_ids.len())
}

#[tauri::command]
async fn get_training_sets(app: tauri::AppHandle) -> Result<Vec<TrainingSetOutput>, String> {
    let settings = read_settings(&app)?;
    let mongo_url = settings
        .mongo_connection_url
        .ok_or_else(|| "MongoDB connection string is not configured".to_string())?;

    let client = Client::with_uri_str(&mongo_url)
        .await
        .map_err(|e| format!("Failed to initialize MongoDB client: {e}"))?;
    let collection = client
        .database("EXA_TRAINER")
        .collection::<Document>("sets");

    let mut cursor = collection
        .find(doc! {})
        .sort(doc! { "date": -1 })
        .await
        .map_err(|e| format!("Failed to fetch sets: {e}"))?;

    let mut output = Vec::new();
    while cursor
        .advance()
        .await
        .map_err(|e| format!("Failed to iterate sets: {e}"))?
    {
        let doc = cursor.deserialize_current().map_err(|e| e.to_string())?;
        let id = doc
            .get_object_id("_id")
            .map_err(|_| "Invalid set document: missing _id".to_string())?
            .to_hex();
        let exercise = doc
            .get_str("exercise")
            .map_err(|_| "Invalid set document: missing exercise".to_string())?
            .to_string();
        let reps = doc
            .get_i32("reps")
            .map_err(|_| "Invalid set document: missing reps".to_string())?;
        let weight = doc
            .get_f64("weight")
            .map_err(|_| "Invalid set document: missing weight".to_string())?;
        let date_ms = doc
            .get_datetime("date")
            .map_err(|_| "Invalid set document: missing date".to_string())?
            .timestamp_millis();

        output.push(TrainingSetOutput {
            id,
            exercise,
            reps,
            weight,
            date_ms,
        });
    }

    Ok(output)
}

#[tauri::command]
async fn delete_training_set(app: tauri::AppHandle, id: String) -> Result<u64, String> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| "Invalid set _id".to_string())?;

    let settings = read_settings(&app)?;
    let mongo_url = settings
        .mongo_connection_url
        .ok_or_else(|| "MongoDB connection string is not configured".to_string())?;

    let client = Client::with_uri_str(&mongo_url)
        .await
        .map_err(|e| format!("Failed to initialize MongoDB client: {e}"))?;

    let collection = client
        .database("EXA_TRAINER")
        .collection::<Document>("sets");

    let result = collection
        .delete_one(doc! { "_id": object_id })
        .await
        .map_err(|e| format!("Failed to delete set: {e}"))?;

    Ok(result.deleted_count)
}

#[derive(Debug, Clone, Deserialize)]
struct TrainingSetUpdateInput {
    reps: i32,
    weight: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DefaultExerciseSeed {
    label: String,
    muscle_group: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExerciseOutput {
    id: String,
    label: String,
    muscle_group: Vec<String>,
    is_default: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateExerciseInput {
    label: String,
    muscle_group: Vec<String>,
}

const DEFAULT_EXERCISES_JSON: &str = include_str!("../../src/data/exercises.json");

async fn get_mongo_client(app: &tauri::AppHandle) -> Result<Client, String> {
    let settings = read_settings(app)?;
    let mongo_url = settings
        .mongo_connection_url
        .ok_or_else(|| "MongoDB connection string is not configured".to_string())?;
    Client::with_uri_str(&mongo_url)
        .await
        .map_err(|e| format!("Failed to initialize MongoDB client: {e}"))
}

async fn seed_default_exercises_if_empty(
    collection: &mongodb::Collection<Document>,
) -> Result<(), String> {
    let existing = collection
        .find_one(doc! {})
        .await
        .map_err(|e| format!("Failed to check exercises collection: {e}"))?;
    if existing.is_some() {
        return Ok(());
    }

    let defaults: Vec<DefaultExerciseSeed> = serde_json::from_str(DEFAULT_EXERCISES_JSON)
        .map_err(|e| format!("Failed to parse default exercises json: {e}"))?;

    let docs: Vec<Document> = defaults
        .into_iter()
        .map(|item| {
            doc! {
                "label": item.label.trim().to_string(),
                "label_lower": item.label.trim().to_lowercase(),
                "muscle_group": item.muscle_group,
                "is_default": true
            }
        })
        .collect();

    collection
        .insert_many(docs)
        .await
        .map_err(|e| format!("Failed to seed default exercises: {e}"))?;
    Ok(())
}

#[tauri::command]
async fn get_exercises(app: tauri::AppHandle) -> Result<Vec<ExerciseOutput>, String> {
    let client = get_mongo_client(&app).await?;
    let collection = client
        .database("EXA_TRAINER")
        .collection::<Document>("exercices");

    seed_default_exercises_if_empty(&collection).await?;

    let mut cursor = collection
        .find(doc! {})
        .sort(doc! { "label_lower": 1 })
        .await
        .map_err(|e| format!("Failed to fetch exercises: {e}"))?;

    let mut output = Vec::new();
    while cursor
        .advance()
        .await
        .map_err(|e| format!("Failed to iterate exercises: {e}"))?
    {
        let doc = cursor.deserialize_current().map_err(|e| e.to_string())?;
        let id = doc
            .get_object_id("_id")
            .map_err(|_| "Invalid exercise document: missing _id".to_string())?
            .to_hex();
        let label = doc
            .get_str("label")
            .map_err(|_| "Invalid exercise document: missing label".to_string())?
            .to_string();
        let is_default = doc.get_bool("is_default").unwrap_or(false);
        let muscle_group = doc
            .get_array("muscle_group")
            .map_err(|_| "Invalid exercise document: missing muscle_group".to_string())?
            .iter()
            .filter_map(|v| v.as_str().map(|s| s.to_string()))
            .collect::<Vec<String>>();

        output.push(ExerciseOutput {
            id,
            label,
            muscle_group,
            is_default,
        });
    }
    Ok(output)
}

#[tauri::command]
async fn create_exercise(
    app: tauri::AppHandle,
    input: CreateExerciseInput,
) -> Result<String, String> {
    let label = input.label.trim();
    if label.is_empty() {
        return Err("Exercise name cannot be empty".to_string());
    }
    let muscle_group: Vec<String> = input
        .muscle_group
        .into_iter()
        .map(|v| v.trim().to_lowercase())
        .filter(|v| !v.is_empty())
        .collect();
    if muscle_group.is_empty() {
        return Err("At least one muscle group is required".to_string());
    }

    let client = get_mongo_client(&app).await?;
    let collection = client
        .database("EXA_TRAINER")
        .collection::<Document>("exercices");
    seed_default_exercises_if_empty(&collection).await?;

    let existing = collection
        .find_one(doc! { "label_lower": label.to_lowercase() })
        .await
        .map_err(|e| format!("Failed to check existing exercise: {e}"))?;
    if existing.is_some() {
        return Err("Exercise already exists".to_string());
    }

    let inserted = collection
        .insert_one(doc! {
            "label": label.to_string(),
            "label_lower": label.to_lowercase(),
            "muscle_group": muscle_group,
            "is_default": false
        })
        .await
        .map_err(|e| format!("Failed to create exercise: {e}"))?;

    let id = inserted
        .inserted_id
        .as_object_id()
        .ok_or_else(|| "Failed to read inserted exercise id".to_string())?
        .to_hex();
    Ok(id)
}

#[tauri::command]
async fn delete_exercise(app: tauri::AppHandle, id: String) -> Result<u64, String> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| "Invalid exercise _id".to_string())?;

    let client = get_mongo_client(&app).await?;
    let collection = client
        .database("EXA_TRAINER")
        .collection::<Document>("exercices");
    seed_default_exercises_if_empty(&collection).await?;

    let existing = collection
        .find_one(doc! { "_id": object_id })
        .await
        .map_err(|e| format!("Failed to read exercise: {e}"))?
        .ok_or_else(|| "Exercise not found".to_string())?;

    if existing.get_bool("is_default").unwrap_or(false) {
        return Err("Default exercises cannot be deleted".to_string());
    }

    let result = collection
        .delete_one(doc! { "_id": object_id })
        .await
        .map_err(|e| format!("Failed to delete exercise: {e}"))?;

    Ok(result.deleted_count)
}

#[tauri::command]
async fn update_training_set(
    app: tauri::AppHandle,
    id: String,
    input: TrainingSetUpdateInput,
) -> Result<u64, String> {
    if input.reps <= 0 {
        return Err("Reps must be greater than zero".to_string());
    }
    if !input.weight.is_finite() {
        return Err("Weight must be a finite number".to_string());
    }

    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| "Invalid set _id".to_string())?;

    let settings = read_settings(&app)?;
    let mongo_url = settings
        .mongo_connection_url
        .ok_or_else(|| "MongoDB connection string is not configured".to_string())?;

    let client = Client::with_uri_str(&mongo_url)
        .await
        .map_err(|e| format!("Failed to initialize MongoDB client: {e}"))?;

    let collection = client
        .database("EXA_TRAINER")
        .collection::<Document>("sets");

    let result = collection
        .update_one(
            doc! { "_id": object_id },
            doc! { "$set": { "reps": input.reps, "weight": input.weight } },
        )
        .await
        .map_err(|e| format!("Failed to update set: {e}"))?;

    Ok(result.modified_count)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_local_settings,
            set_mongo_connection_url,
            get_mongo_connection_url,
            clear_mongo_connection_url,
            set_theme_mode,
            get_theme_mode,
            check_mongo_connection,
            save_training_sets,
            get_training_sets,
            delete_training_set,
            update_training_set,
            get_exercises,
            create_exercise,
            delete_exercise
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
