import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useMoodBoardStore } from '../store/moodBoardStore';
import { resolveAssetPath } from '@/tauri-bridge/fs';
import ImageViewer from '@/features/editor/components/ImageViewer';
import styles from './MoodBoard.module.scss';
import { Image as ImageIcon, RefreshCw, Search } from 'lucide-react';

export default function MoodBoard() {
  const { rootPath } = useWorkspaceStore();
  const { images, isLoading, refresh, error } = useMoodBoardStore();
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (rootPath && images.length === 0 && !isLoading) {
      refresh(rootPath);
    }
  }, [rootPath, refresh]);

  const handleRefresh = () => {
    if (rootPath) refresh(rootPath);
  };

  const filteredImages = images.filter(img => 
    img.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (activeImage) {
    return (
      <div className={styles.viewerWrapper}>
        <ImageViewer path={activeImage} onBack={() => setActiveImage(null)} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.header__title}>
          <h1>Mood Board Espacial</h1>
          <span className={styles.count}>{filteredImages.length} imagens</span>
        </div>
        
        <div className={styles.actions}>
          <div className={styles.search}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Filtrar imagens..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <button 
            className={styles.refreshBtn} 
            onClick={handleRefresh} 
            disabled={isLoading}
            title="Atualizar Galeria"
          >
            <RefreshCw size={18} className={isLoading ? styles.spin : ''} />
          </button>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {isLoading && images.length === 0 ? (
        <div className={styles.loading}>
          <RefreshCw size={48} className={styles.spin} />
          <p>Varrendo workspace...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className={styles.empty}>
          <ImageIcon size={64} />
          <p>{filter ? 'Nenhuma imagem corresponde ao filtro.' : 'Nenhuma imagem encontrada no seu workspace.'}</p>
        </div>
      ) : (
        <div className={styles.masonry}>
          {filteredImages.map((img) => (
            <div 
              key={img.full_path} 
              className={styles.item}
              onClick={() => setActiveImage(img.full_path)}
            >
              <img 
                src={resolveAssetPath(img.path, rootPath)} 
                alt={img.name}
                loading="lazy"
              />
              <div className={styles.overlay}>
                <span className={styles.name}>{img.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
