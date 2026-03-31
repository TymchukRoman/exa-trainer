use std::collections::BTreeMap;

use mongodb::bson::oid::ObjectId;
use mongodb::bson::{doc, Document};
use serde::{Deserialize, Serialize};

use crate::mongo::get_mongo_client;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DefaultExerciseSeed {
    label: String,
    muscle_group: Vec<String>,
    #[serde(default)]
    is_bodyweight_only: bool,
    #[serde(default)]
    uses_duration: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExerciseOutput {
    id: String,
    label: String,
    muscle_group: Vec<String>,
    is_default: bool,
    is_bodyweight_only: bool,
    uses_duration: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MuscleGroupOutput {
    pub id: String,
    pub name: String,
    pub region: String,
    pub alt_names: Vec<String>,
    pub image_url: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateExerciseInput {
    label: String,
    muscle_group: Vec<String>,
    is_bodyweight_only: bool,
    uses_duration: bool,
}

const DEFAULT_EXERCISES_JSON: &str = include_str!("../../src/data/exercises.json");
const MUSCLE_GROUPS_JSON: &str = include_str!("../../src/data/muscleGroups.json");

fn exercise_from_mongo_document(doc: &Document) -> Result<ExerciseOutput, String> {
    let id = doc
        .get_object_id("_id")
        .map_err(|_| "Invalid exercise document: missing _id".to_string())?
        .to_hex();
    let label = doc
        .get_str("label")
        .map_err(|_| "Invalid exercise document: missing label".to_string())?
        .to_string();
    let is_default = doc.get_bool("is_default").unwrap_or(false);
    let is_bodyweight_only = doc.get_bool("is_bodyweight_only").unwrap_or(false);
    let uses_duration = doc.get_bool("uses_duration").unwrap_or(false);
    let muscle_group = doc
        .get_array("muscle_group")
        .map_err(|_| "Invalid exercise document: missing muscle_group".to_string())?
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect::<Vec<String>>();

    Ok(ExerciseOutput {
        id,
        label,
        muscle_group,
        is_default,
        is_bodyweight_only,
        uses_duration,
    })
}

#[tauri::command]
pub fn get_muscle_groups() -> Result<Vec<MuscleGroupOutput>, String> {
    serde_json::from_str(MUSCLE_GROUPS_JSON).map_err(|e| format!("Failed to parse muscle groups json: {e}"))
}

#[tauri::command]
pub async fn get_exercises(app: tauri::AppHandle) -> Result<Vec<ExerciseOutput>, String> {
    let defaults: Vec<DefaultExerciseSeed> = serde_json::from_str(DEFAULT_EXERCISES_JSON)
        .map_err(|e| format!("Failed to parse default exercises json: {e}"))?;

    let client = get_mongo_client(&app).await?;
    let collection = client
        .database("EXA_TRAINER")
        .collection::<Document>("exercices");

    let mut cursor = collection
        .find(doc! {})
        .await
        .map_err(|e| format!("Failed to fetch exercises: {e}"))?;

    let mut by_label: BTreeMap<String, ExerciseOutput> = BTreeMap::new();
    // JSON defaults have priority over DB exercises.
    for item in defaults {
        let label = item.label.trim().to_string();
        let key = label.to_lowercase();
        if key.is_empty() {
            continue;
        }
        by_label.insert(
            key.clone(),
            ExerciseOutput {
                id: format!("default:{key}"),
                label,
                muscle_group: item.muscle_group,
                is_default: true,
                is_bodyweight_only: item.is_bodyweight_only,
                uses_duration: item.uses_duration,
            },
        );
    }

    while cursor
        .advance()
        .await
        .map_err(|e| format!("Failed to iterate exercises: {e}"))?
    {
        let doc = cursor.deserialize_current().map_err(|e| e.to_string())?;
        let ex = exercise_from_mongo_document(&doc)?;
        let key = ex.label.to_lowercase();

        // If a JSON default exists with the same label, keep the default and ignore the DB entry.
        if by_label.contains_key(&key) {
            continue;
        }
        by_label.insert(key, ex);
    }

    let mut output: Vec<ExerciseOutput> = by_label.into_values().collect();
    output.sort_by(|a, b| a.label.to_lowercase().cmp(&b.label.to_lowercase()));
    Ok(output)
}

#[tauri::command]
pub async fn create_exercise(
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
            "is_default": false,
            "is_bodyweight_only": input.is_bodyweight_only,
            "uses_duration": input.uses_duration
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
pub async fn delete_exercise(app: tauri::AppHandle, id: String) -> Result<u64, String> {
    let object_id = ObjectId::parse_str(&id).map_err(|_| "Invalid exercise _id".to_string())?;

    let client = get_mongo_client(&app).await?;
    let collection = client
        .database("EXA_TRAINER")
        .collection::<Document>("exercices");

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
