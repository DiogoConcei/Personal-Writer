import { create } from 'zustand';
import { readFile, writeFile, FileNode, exists } from '@/tauri-bridge';
import { Metadata, parseMarkdownMetadata, stringifyYAML } from '@/features/editor/store/metadataParser';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';

export interface Entity extends Metadata {
  path: string;
  name: string;
  lastModified: number;
  excerpt: string;
  links: string[];
  previewImage?: string;
}

interface UniverseSettings {
  galleryTitle?: string;
}

interface UniverseState {
  entities: Record<string, Entity>;
  isIndexing: boolean;
  lastIndexed: number | null;
  galleryTitle: string;

  indexWorkspace: (files: FileNode[]) => Promise<void>;
  updateEntity: (path: string, content: string, lastModified?: number) => void;
  removeEntity: (path: string) => void;
  clearIndex: () => void;
  getBacklinks: (targetPath: string) => Entity[];
  updateEntitiesOrder: (paths: string[]) => Promise<void>;
  
  // Configurações do Universo
  loadSettings: () => Promise<void>;
  updateGalleryTitle: (title: string) => Promise<void>;
}

const SETTINGS_FILE = '.universe.json';

export const useUniverseStore = create<UniverseState>((set, get) => ({
  entities: {},
  isIndexing: false,
  lastIndexed: null,
  galleryTitle: 'Elenco do Universo',

  loadSettings: async () => {
    const { rootPath } = useWorkspaceStore.getState();
    if (!rootPath) return;

    try {
      const separator = rootPath.includes('\\') ? '\\' : '/';
      const configPath = `${rootPath}${separator}${SETTINGS_FILE}`;

      const fileExists = await exists(configPath);
      if (fileExists) {
        const content = await readFile(configPath);
        const settings: UniverseSettings = JSON.parse(content);
        if (settings.galleryTitle) {
          set({ galleryTitle: settings.galleryTitle });
        }
      }
    } catch (err) {
      console.error('Erro ao carregar configurações do universo:', err);
    }
  },

  updateGalleryTitle: async (title: string) => {
    set({ galleryTitle: title });
    
    const { rootPath } = useWorkspaceStore.getState();
    if (!rootPath) return;

    try {
      const separator = rootPath.includes('\\') ? '\\' : '/';
      const configPath = `${rootPath}${separator}${SETTINGS_FILE}`;
      
      let currentSettings: UniverseSettings = {};
      const fileExists = await exists(configPath);
      if (fileExists) {
        const content = await readFile(configPath);
        currentSettings = JSON.parse(content);
      }

      currentSettings.galleryTitle = title;
      await writeFile(configPath, JSON.stringify(currentSettings, null, 2));
    } catch (err) {
      console.error('Erro ao salvar título da galeria:', err);
    }
  },

  getBacklinks: (targetPath: string) => {
    const { entities } = get();
    const targetName = targetPath.split(/[\\/]/).pop()?.replace('.md', '');
    if (!targetName) return [];

    return Object.values(entities).filter(entity => {
      if (entity.path === targetPath) return false;

      return entity.links?.some(link =>
        link === targetName || link === targetPath || targetPath.endsWith(link + '.md')
      );
    });
  },

  updateEntitiesOrder: async (paths: string[]) => {
    const { entities } = get();
    const updatedEntities = { ...entities };

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const entity = updatedEntities[path];
      if (entity) {
        if (!entity.fields) entity.fields = {};
        entity.fields.order = i;

        try {

          const fullContent = await readFile(path);
          const { markdown } = parseMarkdownMetadata(fullContent);

          const newYaml = stringifyYAML(entity);
          const newContent = `${newYaml}\n\n${markdown}`;

          await writeFile(path, newContent);
          updatedEntities[path] = { ...entity };
        } catch (e) {
          console.error(`Erro ao salvar nova ordem para ${path}:`, e);
        }
      }
    }

    set({ entities: updatedEntities });
  },

  indexWorkspace: async (files: FileNode[]) => {
    set({ isIndexing: true });
    const newEntities: Record<string, Entity> = {};
    const { listDirectory } = await import('@/tauri-bridge');

    const scan = async (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.is_dir) {

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

            const imgMatch = markdown.match(/<img\s+src=["'](.*?)["']/i) || markdown.match(/!\[.*?\]\((.*?)\)/i);
            const previewImage = imgMatch ? imgMatch[1] : undefined;

            const excerpt = markdown
              .replace(/<[^>]*>/g, '')
              .replace(/[#*`[\]]/g, '')
              .substring(0, 150)
              .trim();

            newEntities[node.path] = {
              ...metadata,
              path: node.path,
              name: node.name.replace('.md', ''),
              lastModified: node.modified_at || Date.now() / 1000,
              excerpt,
              links,
              previewImage
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

    // Extrair a primeira imagem do corpo do texto (HTML <img> ou Markdown ![]())
    const imgMatch = markdown.match(/<img\s+src=["'](.*?)["']/i) || markdown.match(/!\[.*?\]\((.*?)\)/i);
    const previewImage = imgMatch ? imgMatch[1] : undefined;

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
      links,
      previewImage
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
