import { invoke } from '@tauri-apps/api/core';
import type { FileNode } from './types';

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
  return invoke<void>('rename_item', { oldPath, newPath });
}

export async function copyImageToAssets(sourcePath: string, workspaceRoot: string): Promise<string> {
  return invoke<string>('copy_image_to_assets', { sourcePath, workspaceRoot });
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
