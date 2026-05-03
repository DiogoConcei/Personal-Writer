import { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { usePluginStore } from '@/features/settings/store/pluginStore';
import { FileNode } from '@/tauri-bridge';
import { Search, FileText, FileImage, Type, LayoutGrid, PanelLeft, FolderOpen, Settings as SettingsIcon } from 'lucide-react';
import styles from './CommandPalette.module.scss';

type ResultItem =
  | { type: 'file'; node: FileNode; path: string; name: string }
  | { type: 'action'; id: string; name: string; icon: any; action: () => void };

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

export default function CommandPalette() {
  const { files, rootPath, setActiveFile, selectWorkspace } = useWorkspaceStore();
  const { isCommandPaletteOpen, setCommandPaletteOpen, toggleSidebar, setActivePanel, activePanel } = useUIStore();
  const { typography, setTypography } = useEditorStore();
  const { plugins } = usePluginStore();

  const isDashboardEnabled = plugins.find(p => p.id === 'universe-dashboard')?.status === 'enabled';

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'k' || e.key === 'f')) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  const getAllFiles = (nodes: FileNode[]): { node: FileNode, path: string }[] => {
    let result: { node: FileNode, path: string }[] = [];
    nodes.forEach(node => {
      if (node.name.startsWith('.')) return;
      if (node.is_dir && node.children) {
        result = result.concat(getAllFiles(node.children));
      } else if (!node.is_dir) {
        result.push({ node, path: node.path });
      }
    });
    return result;
  };

  const allFiles = getAllFiles(files);

  const actions: ResultItem[] = ([
    { type: 'action', id: 'toggle-sidebar', name: 'Alternar Sidebar', icon: <PanelLeft size={16} />, action: toggleSidebar },
    isDashboardEnabled ? { type: 'action', id: 'toggle-dashboard', name: 'Alternar Dashboard', icon: <LayoutGrid size={16} />, action: () => setActivePanel(activePanel === 'editor' ? 'dashboard' : 'editor') } : null,
    { type: 'action', id: 'toggle-typography', name: 'Mudar Fonte (Sans/Serif)', icon: <Type size={16} />, action: () => setTypography(typography === 'sans' ? 'serif' : 'sans') },
    { type: 'action', id: 'open-settings', name: 'Abrir Configurações / Plugins', icon: <SettingsIcon size={16} />, action: () => setActivePanel('settings') },
    { type: 'action', id: 'change-workspace', name: 'Trocar Workspace', icon: <FolderOpen size={16} />, action: selectWorkspace },
  ].filter(Boolean) as ResultItem[]);

  const filteredItems: ResultItem[] = [
    ...allFiles
      .filter(f => f.node.name.toLowerCase().includes(query.toLowerCase()))
      .map(f => ({ type: 'file' as const, node: f.node, path: f.path, name: f.node.name })),
    ...actions.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
  ];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: ResultItem) => {
    if (item.type === 'file') {
      setActiveFile(item.path);
      if (activePanel !== 'editor') setActivePanel('editor');
    } else if (item.type === 'action') {
      item.action();
    }
    setCommandPaletteOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter' && filteredItems.length > 0) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setCommandPaletteOpen(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.inputWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Buscar arquivos ou comandos (ex: Alternar Sidebar)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.list} ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className={styles.empty}>Nenhum resultado encontrado.</div>
          ) : (
            filteredItems.map((item, index) => {
              const isActive = index === selectedIndex;
              if (item.type === 'file') {
                const isImage = IMAGE_EXTENSIONS.some(ext => item.name.toLowerCase().endsWith(ext));
                return (
                  <button
                    key={item.path}
                    className={`${styles.item} ${isActive ? styles['item--active'] : ''}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {isImage ? <FileImage size={16} /> : <FileText size={16} />}
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.name.replace(/\.md$/, '')}</span>
                      <span className={styles.itemPath}>{item.path.replace(rootPath || '', '')}</span>
                    </div>
                  </button>
                );
              } else {
                return (
                  <button
                    key={item.id}
                    className={`${styles.item} ${isActive ? styles['item--active'] : ''} ${styles['item--action']}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {item.icon}
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemPath}>Comando</span>
                    </div>
                  </button>
                );
              }
            })
          )}
        </div>

        <div className={styles.footer}>
          <span><kbd>↑</kbd> <kbd>↓</kbd> para navegar</span>
          <span><kbd>↵</kbd> para selecionar</span>
          <span><kbd>esc</kbd> para fechar</span>
        </div>
      </div>
    </div>
  );
}
