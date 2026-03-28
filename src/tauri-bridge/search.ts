import { invoke } from '@tauri-apps/api/core';

export async function searchFilesByName(workspace: string, query: string): Promise<string[]> {
  return invoke<string[]>('search_files_by_name', { workspace, query });
}
