mod commands;
use commands::dictionary::DictionaryState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let dictionary_state = DictionaryState::new();

    tauri::Builder::default()
        .manage(dictionary_state)
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle();
            let state = handle.state::<DictionaryState>();

            let aff_path = handle.path().resolve("resources/dict/pt_BR.aff", tauri::path::BaseDirectory::Resource).unwrap();
            let dic_path = handle.path().resolve("resources/dict/pt_BR.dic", tauri::path::BaseDirectory::Resource).unwrap();
            let th_path = handle.path().resolve("resources/dict/th_pt_BR.dat", tauri::path::BaseDirectory::Resource).unwrap();

            let personal_path = dirs::data_dir()
                .unwrap_or_else(|| std::env::current_dir().unwrap())
                .join("editor-hibrido")
                .join("user_dictionary.txt");

            state.init(aff_path, dic_path, personal_path, th_path);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::fs::list_directory,
            commands::fs::read_file,
            commands::fs::write_file,
            commands::fs::create_directory,
            commands::fs::delete_item,
            commands::fs::rename_item,
            commands::fs::copy_image_to_assets,
            commands::fs::save_image_from_bytes,
            commands::fs::save_base64_image_to_workspace,
            commands::fs::copy_file_to_workspace,
            commands::fs::save_file_from_bytes_to_workspace,
            commands::fs::create_snapshot,

            commands::fs::list_snapshots,
            commands::fs::read_snapshot,
            commands::fs::delete_snapshot,
            commands::fs::toggle_snapshot_lock,

            commands::dictionary::check_spelling,
            commands::dictionary::check_spelling_batch,
            commands::dictionary::get_spell_suggestions,
            commands::dictionary::get_synonyms,
            commands::dictionary::add_to_dictionary,

            commands::fs::scan_workspace_images,
            commands::fs::scan_workspace_pdfs,
            commands::fs::export_workspace_zip,
            commands::plugins::toggle_plugin_daemon
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
