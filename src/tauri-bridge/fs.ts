import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { FileNode } from './types';

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

export async function copyImageToAssets(sourcePath: String, workspaceRoot: string, subFolder?: string): Promise<string> {
  return invoke<string>('copy_image_to_assets', { sourcePath, workspaceRoot, subFolder });
}

export async function saveImageFromBytes(fileName: string, bytes: number[], workspaceRoot: string, subFolder?: string): Promise<string> {
  return invoke<string>('save_image_from_bytes', { fileName, bytes, workspaceRoot, subFolder });
}

export interface SnapshotInfo {
  id: string;
  timestamp: number;
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
