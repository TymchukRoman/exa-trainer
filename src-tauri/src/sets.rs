use mongodb::bson::oid::ObjectId;
use mongodb::bson::{doc, DateTime as BsonDateTime, Document};
use serde::{Deserialize, Serialize};

use crate::mongo::get_mongo_client;

#[derive(Debug, Clone, Deserialize)]
pub struct TrainingSetInput {
    exercise: String,
    reps: i32,
    weight: f64,
    date: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct TrainingSetOutput {
    id: String,
    exercise: String,
    reps: i32,
    weight: f64,
    date_ms: i64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TrainingSetUpdateInput {
    reps: i32,
    weight: f64,
}

#[tauri::command]
pub async fn save_training_sets(
    app: tauri::AppHandle,
    sets: Vec<TrainingSetInput>,
) -> Result<usize, String> {
    if sets.is_empty() {
        return Err("No sets provided".to_string());
    }

    let client = get_mongo_client(&app).await?;
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

    let result = collection
        .insert_many(documents?)
        .await
        .map_err(|e| format!("Failed to insert sets: {e}"))?;

    Ok(result.inserted_ids.len())
}

#[tauri::command]
pub async fn get_training_sets(app: tauri::AppHandle) -> Result<Vec<TrainingSetOutput>, String> {
    let client = get_mongo_client(&app).await?;
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
pub async fn delete_training_set(app: tauri::AppHandle, id: String) -> Result<u64, String> {
    let object_id = ObjectId::parse_str(&id).map_err(|_| "Invalid set _id".to_string())?;
    let client = get_mongo_client(&app).await?;
    let collection = client
        .database("EXA_TRAINER")
        .collection::<Document>("sets");

    let result = collection
        .delete_one(doc! { "_id": object_id })
        .await
        .map_err(|e| format!("Failed to delete set: {e}"))?;

    Ok(result.deleted_count)
}

#[tauri::command]
pub async fn update_training_set(
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

    let object_id = ObjectId::parse_str(&id).map_err(|_| "Invalid set _id".to_string())?;
    let client = get_mongo_client(&app).await?;
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
