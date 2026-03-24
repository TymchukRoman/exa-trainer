use mongodb::Client;

use crate::settings::read_settings;

pub(crate) fn validate_mongo_url_for_platform(mongo_url: &str) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        if mongo_url.trim_start().starts_with("mongodb+srv://") {
            return Err(
                "On Android, mongodb+srv:// is not supported in this app runtime due to DNS SRV resolution limits. Use a direct mongodb:// URI with explicit hosts (for Atlas: copy 'Drivers -> Rust' non-SRV/standard connection format).".to_string(),
            );
        }
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = mongo_url;
    }
    Ok(())
}

pub(crate) async fn get_mongo_client(app: &tauri::AppHandle) -> Result<Client, String> {
    let settings = read_settings(app)?;
    let mongo_url = settings
        .mongo_connection_url
        .ok_or_else(|| "MongoDB connection string is not configured".to_string())?;
    validate_mongo_url_for_platform(&mongo_url)?;
    Client::with_uri_str(&mongo_url)
        .await
        .map_err(|e| format!("Failed to initialize MongoDB client: {e}"))
}
