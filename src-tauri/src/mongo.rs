use mongodb::Client;

use crate::settings::read_settings;

pub(crate) async fn get_mongo_client(app: &tauri::AppHandle) -> Result<Client, String> {
    let settings = read_settings(app)?;
    let mongo_url = settings
        .mongo_connection_url
        .ok_or_else(|| "MongoDB connection string is not configured".to_string())?;
    Client::with_uri_str(&mongo_url)
        .await
        .map_err(|e| format!("Failed to initialize MongoDB client: {e}"))
}
