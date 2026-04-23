import { invoke } from '@tauri-apps/api/core';

export async function togglePluginDaemon(id: string, enabled: boolean): Promise<string> {
  try {
    return await invoke<string>('toggle_plugin_daemon', { id, enabled });
  } catch (error) {
    console.error('Falha ao alternar daemon do plugin:', error);
    throw error;
  }
}
