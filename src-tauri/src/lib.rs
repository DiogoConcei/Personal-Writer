mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::fs::list_directory,
            commands::fs::read_file,
            commands::fs::write_file,
            commands::fs::create_directory,
            commands::fs::delete_item,
            commands::fs::rename_item,
            commands::fs::copy_image_to_assets,
            commands::fs::save_image_from_bytes,
            commands::fs::create_snapshot,

            commands::fs::list_snapshots,
            commands::fs::read_snapshot,
            commands::fs::delete_snapshot,
            commands::fs::toggle_snapshot_lock
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
