import { create } from 'zustand';
import { readFile, FileNode } from '@/tauri-bridge';
import { Metadata, parseMarkdownMetadata } from '@/features/editor/store/editorStore';

export interface Entity extends Metadata {
  path: string;
  name: string;
  lastModified: number;
  excerpt: string;
  links: string[]; // Caminhos citados via [[ ]]
}

interface UniverseState {
  entities: Record<string, Entity>;
  isIndexing: boolean;
  lastIndexed: number | null;

  // Actions
  indexWorkspace: (files: FileNode[]) => Promise<void>;
  updateEntity: (path: string, content: string, lastModified?: number) => void;
  removeEntity: (path: string) => void;
  clearIndex: () => void;
  getBacklinks: (targetPath: string) => Entity[];
}

export const useUniverseStore = create<UniverseState>((set, get) => ({
  entities: {},
  isIndexing: false,
  lastIndexed: null,

  getBacklinks: (targetPath: string) => {
    const { entities } = get();
    const targetName = targetPath.split(/[\\/]/).pop()?.replace('.md', '');
    if (!targetName) return [];

    return Object.values(entities).filter(entity => {
      if (entity.path === targetPath) return false;
      // Verifica se o nome da nota ou o path está na lista de links da entidade
      return entity.links?.some(link => 
        link === targetName || link === targetPath || targetPath.endsWith(link + '.md')
      );
    });
  },

  indexWorkspace: async (files: FileNode[]) => {
    set({ isIndexing: true });
    const newEntities: Record<string, Entity> = {};
    const { listDirectory } = await import('@/tauri-bridge');

    const scan = async (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.is_dir) {
          // Ignorar pastas ocultas ou assets
          if (node.name.startsWith('.') || node.name === 'assets' || node.name === '.snapshots') continue;
          
          try {
            const subFiles = await listDirectory(node.path);
            await scan(subFiles);
          } catch (e) {
            console.error(`Erro ao ler subpasta ${node.path}:`, e);
          }
        } else if (node.name.endsWith('.md')) {
          try {
            const content = await readFile(node.path);
            const { metadata, markdown } = parseMarkdownMetadata(content);
            
            const links: string[] = [];
            const linkRegex = /\[\[(.*?)\]\]/g;
            let match;
            while ((match = linkRegex.exec(markdown)) !== null) {
              links.push(match[1]);
            }

            const excerpt = markdown
              .replace(/<[^>]*>/g, '')
              .replace(/[#*`[\]]/g, '')
              .substring(0, 150)
              .trim();

            newEntities[node.path] = {
              ...metadata,
              path: node.path,
              name: node.name.replace('.md', ''),
              lastModified: node.lastModified || node.modified_at || Date.now() / 1000,
              excerpt,
              links
            };
          } catch (e) {
            console.error(`Erro ao indexar ${node.path}:`, e);
          }
        }
      }
    };

    await scan(files);
    set({ entities: newEntities, isIndexing: false, lastIndexed: Date.now() });
  },

  updateEntity: (path: string, content: string, lastModified?: number) => {
    const { entities } = get();
    const { metadata, markdown } = parseMarkdownMetadata(content);
    
    const links: string[] = [];
    const linkRegex = /\[\[(.*?)\]\]/g;
    let match;
    while ((match = linkRegex.exec(markdown)) !== null) {
      links.push(match[1]);
    }

    const excerpt = markdown
      .replace(/<[^>]*>/g, '')
      .replace(/[#*`[\]]/g, '')
      .substring(0, 150)
      .trim();

    const fileName = path.split(/[\\/]/).pop() || '';

    const updatedEntity: Entity = {
      ...metadata,
      path,
      name: fileName.replace('.md', ''),
      lastModified: lastModified || Date.now() / 1000,
      excerpt,
      links
    };

    set({ 
      entities: { ...entities, [path]: updatedEntity } 
    });
  },

  removeEntity: (path: string) => {
    const { entities } = get();
    const newEntities = { ...entities };
    delete newEntities[path];
    set({ entities: newEntities });
  },

  clearIndex: () => {
    set({ entities: {}, lastIndexed: null });
  }
}));
