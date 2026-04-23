use tauri::command;

#[command]
pub async fn toggle_plugin_daemon(id: String, enabled: bool) -> Result<String, String> {
    println!("[Rust Backend] Motor do Plugin alterado: id={}, ativado={}", id, enabled);
    
    // No futuro: lógica de inicialização ou desligamento de threads em Rust dependendo do `id`
    
    Ok(format!("Daemon para {} ajustado para {}", id, enabled))
}
