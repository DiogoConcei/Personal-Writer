import { useMemo, useState, useEffect } from 'react';
import { useUniverseStore } from '@/features/universe/store/universeStore';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { convertFileSrc } from '@tauri-apps/api/core';
import styles from './CharacterGallery.module.scss';
import { Search, Filter, User, X } from 'lucide-react';

export default function CharacterGallery() {
  const { entities, isIndexing, galleryTitle, updateGalleryTitle, loadSettings } = useUniverseStore();
  const { setActiveFile, rootPath } = useWorkspaceStore();
  const { setActivePanel, setPreview } = useUIStore();

  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [localTitle, setLocalTitle] = useState(galleryTitle);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setLocalTitle(galleryTitle);
  }, [galleryTitle]);

  const characters = useMemo(() => {
    return Object.values(entities).filter(e => e.type === 'character');
  }, [entities]);

  const handleTitleBlur = () => {
    if (localTitle.trim() && localTitle !== galleryTitle) {
      updateGalleryTitle(localTitle.trim());
    } else {
      setLocalTitle(galleryTitle);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const filterKeys = useMemo(() => {
    const keys = new Set<string>();
    characters.forEach(c => {
      if (c.fields) {
        Object.keys(c.fields).forEach(k => {
          if (k !== 'summary') keys.add(k);
        });
      }
    });
    return Array.from(keys);
  }, [characters]);

  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    filterKeys.forEach(key => {
      const values = new Set<string>();
      characters.forEach(c => {
        const val = c.fields?.[key];
        if (val) values.add(String(val));
      });
      options[key] = Array.from(values).sort();
    });
    return options;
  }, [characters, filterKeys]);

  const filteredCharacters = useMemo(() => {
    return characters.filter(c => {

      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;

      for (const [key, value] of Object.entries(activeFilters)) {
        if (value && String(c.fields?.[key]) !== value) return false;
      }

      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [characters, search, activeFilters]);

  const handleOpen = (path: string) => {
    setActiveFile(path);
    setActivePanel('editor');
  };

  const getImageUrl = (icon?: string) => {
    if (!icon) return null;
    if (icon.includes('/') || icon.includes('\\') || icon.includes('.')) {
      if (icon.startsWith('./') && rootPath) {
        const relativePart = icon.replace('./', '');
        const separator = rootPath.includes('\\') ? '\\' : '/';
        const fullPath = `${rootPath}${separator}${relativePart.replace(/[\\/]/g, separator)}`;
        return convertFileSrc(fullPath);
      }
      return icon;
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.header__title}>
          <User size={24} />
          <div className={styles.titleWrapper}>
            <input
              className={styles.titleInput}
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              placeholder="Nome da galeria..."
              spellCheck={false}
            />
            <span className={styles.countBadge}>{filteredCharacters.length}</span>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.search}>
            <Search size={18} />
            <input
              placeholder="Buscar personagem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
          </div>

          <div className={styles.filters}>
            <Filter size={18} />
            {filterKeys.map(key => (
              <select
                key={key}
                value={activeFilters[key] || ''}
                onChange={(e) => setActiveFilters({ ...activeFilters, [key]: e.target.value })}
                className={activeFilters[key] ? styles['filter--active'] : ''}
              >
                <option value="">{key}</option>
                {filterOptions[key].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ))}
            {Object.keys(activeFilters).length > 0 && (
              <button className={styles.clearBtn} onClick={() => setActiveFilters({})}>Limpar</button>
            )}
          </div>
        </div>
      </header>

      {isIndexing && <div className={styles.loading}>Indexando novos dados...</div>}

      <div className={styles.grid}>
        {filteredCharacters.map(char => {
          const imageUrl = getImageUrl(char.icon);
          const isEmoji = char.icon && !imageUrl;

          return (
            <div
              key={char.path}
              className={styles.card}
              onClick={() => handleOpen(char.path)}
              onMouseEnter={(e) => setPreview({
                entityPath: char.path,
                position: { x: e.clientX, y: e.clientY }
              })}
              onMouseLeave={() => setPreview({ entityPath: null, position: null })}
            >
              <div className={styles.card__imageWrapper}>
                {imageUrl ? (
                  <img src={imageUrl || undefined} alt={char.name} className={styles.card__image} />
                ) : (
                  <div className={styles.card__placeholder}>
                    {isEmoji ? <span>{char.icon}</span> : <User size={48} />}
                  </div>
                )}
                <div className={styles.card__overlay} />
              </div>

              <div className={styles.card__info}>
                <h3 className={styles.card__name}>{char.name}</h3>
                <div className={styles.card__meta}>
                   {Object.entries(char.fields || {})
                     .filter(([k]) => k !== 'summary')
                     .slice(0, 2)
                     .map(([k, v]) => (
                       <span key={k}>{String(v)}</span>
                     ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCharacters.length === 0 && !isIndexing && (
        <div className={styles.empty}>
          <p>Nenhum personagem encontrado com os filtros atuais.</p>
        </div>
      )}
    </div>
  );
}
