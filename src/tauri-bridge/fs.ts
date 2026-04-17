import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { exists as fsExists } from '@tauri-apps/plugin-fs';
import type { FileNode } from './types';

export async function exists(path: string): Promise<boolean> {
  return fsExists(path);
}

export async function exportWorkspaceZip(workspaceRoot: string): Promise<void> {
  const destPath = await saveDialog({
    filters: [{ name: 'Arquivo ZIP', extensions: ['zip'] }],
    defaultPath: 'workspace-backup.zip',
    title: 'Exportar Backup do Workspace',
  });

  if (destPath) {
    return invoke<void>('export_workspace_zip', { workspaceRoot, destZipPath: destPath });
  }
}

export function resolveAssetPath(path: string, workspaceRoot: string | null): string {
  if (path.startsWith('http')) return path;

  const isAbsolute = /^[a-zA-Z]:[\\/]/.test(path) || path.startsWith('/');
  if (isAbsolute) {
    return convertFileSrc(path);
  }

  if (workspaceRoot && path.startsWith('./')) {
    const relativePart = path.replace('./', '');
    const separator = workspaceRoot.includes('\\') ? '\\' : '/';
    const fullPath = `${workspaceRoot}${separator}${relativePart.replace(/[\\/]/g, separator)}`;
    return convertFileSrc(fullPath);
  }

  return path;
}

export interface ImageAsset {
  name: string;
  path: string;
  full_path: string;
  modified_at: number;
}

export interface PdfAsset {
  name: string;
  path: string;
  full_path: string;
  modified_at: number;
}

export async function scanWorkspaceImages(workspaceRoot: string): Promise<ImageAsset[]> {
  return invoke<ImageAsset[]>('scan_workspace_images', { workspaceRoot });
}

export async function scanWorkspacePdfs(workspaceRoot: string): Promise<PdfAsset[]> {
  return invoke<PdfAsset[]>('scan_workspace_pdfs', { workspaceRoot });
}

export async function selectDirectory(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Selecionar Workspace',
  });

  return typeof selected === 'string' ? selected : null;
}

export async function listDirectory(path: string): Promise<FileNode[]> {
  return invoke<FileNode[]>('list_directory', { path });
}

export async function readFile(path: string): Promise<string> {
  return invoke<string>('read_file', { path });
}

export async function writeFile(path: string, content: string): Promise<void> {
  return invoke<void>('write_file', { path, content });
}

export async function createDirectory(path: string): Promise<void> {
  return invoke<void>('create_directory', { path });
}

export async function deleteItem(path: string): Promise<void> {
  return invoke<void>('delete_item', { path });
}

export async function renameItem(oldPath: string, newPath: string): Promise<void> {
  return invoke<void>('rename_item', { oldPath: oldPath, newPath: newPath });
}

export async function copyFileToWorkspace(sourcePath: string, workspaceRoot: string, folderName: string, subFolder?: string): Promise<string> {
  return invoke<string>('copy_file_to_workspace', { sourcePath, workspaceRoot, folderName, subFolder });
}

export async function saveFileFromBytesToWorkspace(fileName: string, bytes: number[], workspaceRoot: string, folderName: string, subFolder?: string): Promise<string> {
  return invoke<string>('save_file_from_bytes_to_workspace', { fileName, bytes, workspaceRoot, folderName, subFolder });
}

export async function copyImageToAssets(sourcePath: String, workspaceRoot: string, subFolder?: string): Promise<string> {
  return invoke<string>('copy_image_to_assets', { sourcePath, workspaceRoot, subFolder });
}

export async function saveImageFromBytes(fileName: string, bytes: number[], workspaceRoot: string, subFolder?: string): Promise<string> {
  return invoke<string>('save_image_from_bytes', { fileName, bytes, workspaceRoot, subFolder });
}

export interface SnapshotInfo {
  id: string;
  timestamp: number;
  is_locked: boolean;
}

export async function createSnapshot(path: string, workspaceRoot: string, content: string): Promise<void> {
  return invoke<void>('create_snapshot', { path, workspaceRoot, content });
}

export async function listSnapshots(path: string, workspaceRoot: string): Promise<SnapshotInfo[]> {
  return invoke<SnapshotInfo[]>('list_snapshots', { path, workspaceRoot });
}

export async function readSnapshot(path: string, workspaceRoot: string, snapshotId: string): Promise<string> {
  return invoke<string>('read_snapshot', { path, workspaceRoot, snapshotId });
}

export async function deleteSnapshot(path: string, workspaceRoot: string, snapshotId: string): Promise<void> {
  return invoke<void>('delete_snapshot', { path, workspaceRoot, snapshotId });
}

export async function toggleSnapshotLock(path: string, workspaceRoot: string, snapshotId: string): Promise<boolean> {
  return invoke<boolean>('toggle_snapshot_lock', { path, workspaceRoot, snapshotId });
}
