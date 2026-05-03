/**
 * Status de um plugin no sistema.
 */
export type PluginStatus = 'not-installed' | 'installed' | 'enabled' | 'disabled';

/**
 * Metadados de um plugin.
 */
export interface PluginMetadata {
  id: string;
  title: string;
  description: string;
  version: string;
  category: 'Writer' | 'Design' | 'Planning';
  level: 1 | 2 | 3 | 4;
  status: PluginStatus;
  remoteAssets?: string[]; // URLs ou caminhos para baixar se for 'not-installed'
}
