use std::fs;
use std::path::Path;
use serde::{Serialize, Deserialize};
use std::time::UNIX_EPOCH;

#[derive(Serialize, Deserialize, Debug)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
    pub modified_at: u64,
}

#[tauri::command]
pub async fn list_directory(path: String) -> Result<Vec<FileNode>, String> {
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    let mut nodes = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let path_buf = entry.path();
        
        nodes.push(FileNode {
            name: entry.file_name().to_string_lossy().to_string(),
            path: path_buf.to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            children: None,
            modified_at: metadata.modified()
                .unwrap_or(UNIX_EPOCH)
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        });
    }

    Ok(nodes)
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_item(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.exists() {
        if p.is_dir() {
            fs::remove_dir_all(path).map_err(|e| e.to_string())
        } else {
            fs::remove_file(path).map_err(|e| e.to_string())
        }
    } else {
        Err("Path does not exist".to_string())
    }
}

#[tauri::command]
pub async fn rename_item(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(old_path, new_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn copy_image_to_assets(source_path: String, workspace_root: String) -> Result<String, String> {
    let assets_dir = Path::new(&workspace_root).join("assets");
    
    if !assets_dir.exists() {
        fs::create_dir_all(&assets_dir).map_err(|e| e.to_string())?;
    }

    let source = Path::new(&source_path);
    let file_name = source.file_name().ok_or("Invalid file name")?;
    let dest_path = assets_dir.join(file_name);

    fs::copy(source, &dest_path).map_err(|e| e.to_string())?;

    Ok(format!("./assets/{}", file_name.to_string_lossy()))
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SnapshotInfo {
    pub id: String,
    pub timestamp: u64,
}

#[tauri::command]
pub async fn create_snapshot(path: String, workspace_root: String, content: String) -> Result<(), String> {
    let snapshots_base = Path::new(&workspace_root).join(".snapshots");
    let file_name = Path::new(&path).file_name().ok_or("Invalid path")?.to_string_lossy();
    let file_snapshots_dir = snapshots_base.join(&*file_name);

    if !file_snapshots_dir.exists() {
        fs::create_dir_all(&file_snapshots_dir).map_err(|e| e.to_string())?;
    }

    let now = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let snapshot_path = file_snapshots_dir.join(format!("{}.txt", now));
    fs::write(snapshot_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_snapshots(path: String, workspace_root: String) -> Result<Vec<SnapshotInfo>, String> {
    let file_name = Path::new(&path).file_name().ok_or("Invalid path")?.to_string_lossy();
    let file_snapshots_dir = Path::new(&workspace_root).join(".snapshots").join(&*file_name);

    if !file_snapshots_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(file_snapshots_dir).map_err(|e| e.to_string())?;
    let mut snapshots = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let id = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
        let timestamp = id.parse::<u64>().unwrap_or_default();

        snapshots.push(SnapshotInfo { id, timestamp });
    }

    snapshots.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(snapshots)
}

#[tauri::command]
pub async fn read_snapshot(path: String, workspace_root: String, snapshot_id: String) -> Result<String, String> {
    let file_name = Path::new(&path).file_name().ok_or("Invalid path")?.to_string_lossy();
    let snapshot_path = Path::new(&workspace_root)
        .join(".snapshots")
        .join(&*file_name)
        .join(format!("{}.txt", snapshot_id));

    fs::read_to_string(snapshot_path).map_err(|e| e.to_string())
}
