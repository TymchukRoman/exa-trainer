mod exercises;
mod mongo;
mod settings;
mod sets;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            settings::get_local_settings,
            settings::set_mongo_connection_url,
            settings::get_mongo_connection_url,
            settings::clear_mongo_connection_url,
            settings::set_theme_mode,
            settings::get_theme_mode,
            settings::check_mongo_connection,
            sets::save_training_sets,
            sets::get_training_sets,
            sets::delete_training_set,
            sets::update_training_set,
            exercises::get_exercises,
            exercises::create_exercise,
            exercises::delete_exercise
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
