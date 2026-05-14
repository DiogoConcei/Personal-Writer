use std::fs;
use std::path::Path;
use serde::{Serialize, Deserialize};
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;
use std::collections::HashMap;
use zip::write::FileOptions;
use std::io::{Write, Read};
use image::ImageReader;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

#[derive(Serialize, Deserialize, Debug)]
pub struct ImageAsset {
    pub name: String,
    pub path: String,
    pub full_path: String,
    pub modified_at: u64,
    pub width: u32,
    pub height: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PdfAsset {
    pub name: String,
    pub path: String,
    pub full_path: String,
    pub modified_at: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct DimensionCacheEntry {
    width: u32,
    height: u32,
    modified_at: u64,
}

#[tauri::command]
pub async fn export_workspace_zip(workspace_root: String, dest_zip_path: String) -> Result<(), String> {
    let root = Path::new(&workspace_root);
    let dest_path = Path::new(&dest_zip_path);

    let file = fs::File::create(dest_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    for entry in WalkDir::new(root)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !name.starts_with('.') && name != "node_modules" && name != ".snapshots" && name != ".git"
        })
        .filter_map(|e| e.ok()) {

        let path = entry.path();
        let name = path.strip_prefix(root).map_err(|e| e.to_string())?;

        if path.is_file() {
            zip.start_file(name.to_string_lossy().replace("\\", "/"), options)
                .map_err(|e| e.to_string())?;
            let mut f = fs::File::open(path).map_err(|e| e.to_string())?;
            let mut buffer = Vec::new();
            f.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
            zip.write_all(&buffer).map_err(|e| e.to_string())?;
        } else if !name.as_os_str().is_empty() {
            zip.add_directory(name.to_string_lossy().replace("\\", "/"), options)
                .map_err(|e| e.to_string())?;
        }
    }

    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn scan_workspace_images(workspace_root: String) -> Result<Vec<ImageAsset>, String> {
    let root = Path::new(&workspace_root);
    let cache_path = root.join(".dimensions_cache.json");
    
    // Carregar cache existente
    let mut cache: HashMap<String, DimensionCacheEntry> = if cache_path.exists() {
        fs::read_to_string(&cache_path)
            .ok()
            .and_then(|content| serde_json::from_str(&content).ok())
            .unwrap_or_default()
    } else {
        HashMap::new()
    };

    let mut images = Vec::new();
    let mut cache_updated = false;

    for entry in WalkDir::new(root)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !name.starts_with('.') && name != "node_modules" && name != ".snapshots" && name != ".git"
        })
        .filter_map(|e| e.ok()) {

        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                if ["png", "jpg", "jpeg", "gif", "webp"].contains(&ext_str.as_str()) {
                    let metadata = entry.metadata().map_err(|e| e.to_string())?;
                    let full_path = path.to_string_lossy().to_string();
                    let modified_at = metadata.modified()
                        .unwrap_or(UNIX_EPOCH)
                        .duration_since(UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs();

                    let relative_path = path.strip_prefix(root)
                        .map(|p| format!("./{}", p.to_string_lossy().replace("\\", "/")))
                        .unwrap_or_else(|_| full_path.clone());

                    // Verificar no cache
                    let (width, height) = if let Some(cached) = cache.get(&full_path) {
                        if cached.modified_at == modified_at {
                            (cached.width, cached.height)
                        } else {
                            // Arquivo mudou, re-escanear
                            let dims = match ImageReader::open(&path) {
                                Ok(reader) => reader.into_dimensions().unwrap_or((0, 0)),
                                Err(_) => (0, 0),
                            };
                            cache.insert(full_path.clone(), DimensionCacheEntry { width: dims.0, height: dims.1, modified_at });
                            cache_updated = true;
                            dims
                        }
                    } else {
                        // Novo arquivo
                        let dims = match ImageReader::open(&path) {
                            Ok(reader) => reader.into_dimensions().unwrap_or((0, 0)),
                            Err(_) => (0, 0),
                        };
                        cache.insert(full_path.clone(), DimensionCacheEntry { width: dims.0, height: dims.1, modified_at });
                        cache_updated = true;
                        dims
                    };

                    images.push(ImageAsset {
                        name: entry.file_name().to_string_lossy().to_string(),
                        path: relative_path,
                        full_path,
                        modified_at,
                        width,
                        height,
                    });
                }
            }
        }
    }

    // Salvar cache se houve atualizações
    if cache_updated {
        if let Ok(content) = serde_json::to_string(&cache) {
            let _ = fs::write(cache_path, content);
        }
    }

    images.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));
    Ok(images)
}

#[tauri::command]
pub async fn scan_workspace_pdfs(workspace_root: String) -> Result<Vec<PdfAsset>, String> {
    let root = Path::new(&workspace_root);
    let mut pdfs = Vec::new();

    for entry in WalkDir::new(root)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !name.starts_with('.') && name != "node_modules" && name != ".snapshots" && name != ".git"
        })
        .filter_map(|e| e.ok()) {

        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext.to_string_lossy().to_lowercase() == "pdf" {
                    let metadata = entry.metadata().map_err(|e| e.to_string())?;
                    let full_path = path.to_string_lossy().to_string();

                    let relative_path = path.strip_prefix(root)
                        .map(|p| format!("./{}", p.to_string_lossy().replace("\\", "/")))
                        .unwrap_or_else(|_| full_path.clone());

                    pdfs.push(PdfAsset {
                        name: entry.file_name().to_string_lossy().to_string(),
                        path: relative_path,
                        full_path,
                        modified_at: metadata.modified()
                            .unwrap_or(UNIX_EPOCH)
                            .duration_since(UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_secs(),
                    });
                }
            }
        }
    }

    pdfs.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));
    Ok(pdfs)
}

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
pub async fn copy_file_to_workspace(
    source_path: String,
    workspace_root: String,
    folder_name: String,
    sub_folder: Option<String>
) -> Result<String, String> {
    let mut dest_dir = Path::new(&workspace_root).join(&folder_name);

    if let Some(ref sub) = sub_folder {
        dest_dir = dest_dir.join(sub);
    }

    if !dest_dir.exists() {
        fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;
    }

    let source = Path::new(&source_path);
    let file_name = source.file_name().ok_or("Invalid file name")?;
    let dest_path = dest_dir.join(file_name);

    if source.canonicalize().ok() == dest_path.canonicalize().ok() {
        let relative_prefix = if let Some(sub) = sub_folder {
            format!("./{}/{}/", folder_name, sub.replace("\\", "/"))
        } else {
            format!("./{}/", folder_name)
        };
        return Ok(format!("{}{}", relative_prefix, file_name.to_string_lossy()));
    }

    if let Err(e) = fs::copy(source, &dest_path) {
        if dest_path.exists() {

            println!("Aviso: Falha ao sobrescrever arquivo em uso, mantendo versão existente: {}", e);
        } else {
            return Err(e.to_string());
        }
    }

    let relative_prefix = if let Some(sub) = sub_folder {
        format!("./{}/{}/", folder_name, sub.replace("\\", "/"))
    } else {
        format!("./{}/", folder_name)
    };

    Ok(format!("{}{}", relative_prefix, file_name.to_string_lossy()))
}

#[tauri::command]
pub async fn save_file_from_bytes_to_workspace(
    file_name: String,
    bytes: Vec<u8>,
    workspace_root: String,
    folder_name: String,
    sub_folder: Option<String>
) -> Result<String, String> {
    let mut dest_dir = Path::new(&workspace_root).join(&folder_name);

    if let Some(ref sub) = sub_folder {
        dest_dir = dest_dir.join(sub);
    }

    if !dest_dir.exists() {
        fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;
    }

    let dest_path = dest_dir.join(&file_name);
    fs::write(dest_path, bytes).map_err(|e| e.to_string())?;

    let relative_prefix = if let Some(sub) = sub_folder {
        format!("./{}/{}/", folder_name, sub.replace("\\", "/"))
    } else {
        format!("./{}/", folder_name)
    };

    Ok(format!("{}{}", relative_prefix, file_name))
}

#[tauri::command]
pub async fn copy_image_to_assets(source_path: String, workspace_root: String, sub_folder: Option<String>) -> Result<String, String> {
    copy_file_to_workspace(source_path, workspace_root, "assets".to_string(), sub_folder).await
}

#[tauri::command]
pub async fn save_image_from_bytes(file_name: String, bytes: Vec<u8>, workspace_root: String, sub_folder: Option<String>) -> Result<String, String> {
    save_file_from_bytes_to_workspace(file_name, bytes, workspace_root, "assets".to_string(), sub_folder).await
}

#[tauri::command]
pub async fn save_base64_image(
    base64_data: String,
    file_name: String,
    workspace_root: String,
) -> Result<String, String> {
    let dest_dir = Path::new(&workspace_root).join("assets").join("collages");

    if !dest_dir.exists() {
        fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;
    }

    // Decodificar Base64
    let bytes = BASE64.decode(base64_data).map_err(|e| e.to_string())?;
    
    let dest_path = dest_dir.join(&file_name);
    fs::write(dest_path, bytes).map_err(|e| e.to_string())?;

    Ok(format!("./assets/collages/{}", file_name))
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SnapshotInfo {
    pub id: String,
    pub timestamp: u64,
    pub is_locked: bool,
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
        let file_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();

        let is_locked = file_name.contains(".locked.");
        let id = file_name.split('.').next().unwrap_or_default().to_string();
        let timestamp = id.parse::<u64>().unwrap_or_default();

        if timestamp > 0 {
            snapshots.push(SnapshotInfo { id, timestamp, is_locked });
        }
    }

    snapshots.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(snapshots)
}

#[tauri::command]
pub async fn read_snapshot(path: String, workspace_root: String, snapshot_id: String) -> Result<String, String> {
    let file_name = Path::new(&path).file_name().ok_or("Invalid path")?.to_string_lossy();
    let dir = Path::new(&workspace_root).join(".snapshots").join(&*file_name);

    let normal_path = dir.join(format!("{}.txt", snapshot_id));
    let locked_path = dir.join(format!("{}.locked.txt", snapshot_id));

    if normal_path.exists() {
        fs::read_to_string(normal_path).map_err(|e| e.to_string())
    } else {
        fs::read_to_string(locked_path).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn toggle_snapshot_lock(path: String, workspace_root: String, snapshot_id: String) -> Result<bool, String> {
    let file_name = Path::new(&path).file_name().ok_or("Invalid path")?.to_string_lossy();
    let dir = Path::new(&workspace_root).join(".snapshots").join(&*file_name);

    let normal_path = dir.join(format!("{}.txt", snapshot_id));
    let locked_path = dir.join(format!("{}.locked.txt", snapshot_id));

    if normal_path.exists() {
        fs::rename(normal_path, locked_path).map_err(|e| e.to_string())?;
        Ok(true)
    } else if locked_path.exists() {
        fs::rename(locked_path, normal_path).map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        Err("Snapshot not found".to_string())
    }
}

#[tauri::command]
pub async fn search_files_by_name(workspace: String, query: String) -> Result<Vec<String>, String> {
    let root = Path::new(&workspace);
    let mut results = Vec::new();
    let query_lower = query.to_lowercase();

    for entry in WalkDir::new(root)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !name.starts_with('.') && name != "node_modules" && name != ".snapshots" && name != ".git"
        })
        .filter_map(|e| e.ok()) {

        let path = entry.path();
        if path.is_file() {
            let file_name = entry.file_name().to_string_lossy();
            if file_name.to_lowercase().contains(&query_lower) {
                results.push(path.to_string_lossy().to_string());
            }
        }
    }

    Ok(results)
}

#[tauri::command]
pub async fn delete_snapshot(path: String, workspace_root: String, snapshot_id: String) -> Result<(), String> {
    let file_name = Path::new(&path).file_name().ok_or("Invalid path")?.to_string_lossy();
    let dir = Path::new(&workspace_root).join(".snapshots").join(&*file_name);

    let normal_path = dir.join(format!("{}.txt", snapshot_id));
    let locked_path = dir.join(format!("{}.locked.txt", snapshot_id));

    if locked_path.exists() {
        return Err("Cannot delete a locked snapshot. Unlock it first.".to_string());
    }

    if normal_path.exists() {
        fs::remove_file(normal_path).map_err(|e| e.to_string())
    } else {
        Err("Snapshot not found".to_string())
    }
}
