import { useState, useEffect, useRef } from 'react';
import styles from './LocationHeader.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { Metadata, parseMarkdownMetadata } from '@/features/editor/store/metadataParser';
import { 
  MapPin, Music, Play, Pause, Plus, Trash2, 
  ChevronRight, Info, User, X
} from 'lucide-react';
import ImageGallery from '@/features/editor/components/ImageGallery/ImageGallery';
import Modal from '@/shared/components/Modal/Modal';
import { AttributeGrid } from './AttributeGrid';
import { readFile, listDirectory, resolveAssetPath } from '@/tauri-bridge';

interface CharacterLink {
  path: string;
  name: string;
  icon?: string;
}

import { Backlinks } from './Backlinks';

export function LocationHeader() {
  const { rootPath, activeFile, setActiveFile } = useWorkspaceStore();
  const { metadata, setMetadata, save } = useEditorStore();
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState<CharacterLink[]>([]);
  
  // Player de Áudio
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const noteName = activeFile ? activeFile.split(/[\\/]/).pop()?.replace('.md', '') : 'Nova Localização';

  useEffect(() => {
    if (showCharacterPicker) {
      loadCharacters();
    }
  }, [showCharacterPicker]);

  const loadCharacters = async () => {
    if (!rootPath) return;
    try {
      const files = await listDirectory(rootPath);
      const characters: CharacterLink[] = [];
      
      const scanFiles = async (nodes: any[]) => {
        for (const node of nodes) {
          if (node.is_dir) {
            await scanFiles(node.children || []);
          } else if (node.path.endsWith('.md')) {
            const content = await readFile(node.path);
            const { metadata: meta } = parseMarkdownMetadata(content);
            if (meta.type === 'character') {
              characters.push({
                path: node.path,
                name: node.name.replace('.md', ''),
                icon: meta.icon
              });
            }
          }
        }
      };

      await scanFiles(files);
      setAvailableCharacters(characters);
    } catch (e) {
      console.error('Erro ao carregar personagens:', e);
    }
  };

  const updateMetadata = (newData: Metadata) => {
    setMetadata(newData);
    // Forçar salvamento no disco para persistir mudanças de cabeçalho (images/fields)
    if (activeFile) {
      save(activeFile, rootPath || undefined);
    }
  };

  const addImage = (src: string) => {
    const images = [...(metadata.images || [])];
    if (!images.includes(src)) {
      images.push(src);
      updateMetadata({ ...metadata, images });
    }
    setShowImagePicker(false);
  };

  const removeImage = (src: string) => {
    const images = (metadata.images || []).filter(img => img !== src);
    updateMetadata({ ...metadata, images });
  };

  const linkCharacter = (char: CharacterLink) => {
    const linked = [...(metadata.linked_characters || [])];
    if (!linked.includes(char.path)) {
      linked.push(char.path);
      updateMetadata({ ...metadata, linked_characters: linked });
    }
    setShowCharacterPicker(false);
  };

  const unlinkCharacter = (path: string) => {
    const linked = (metadata.linked_characters || []).filter(p => p !== path);
    updateMetadata({ ...metadata, linked_characters: linked });
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const time = (Number(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(Number(e.target.value));
    }
  };

  return (
    <div className={styles.locationHeader}>
      {/* Galeria de Imagens */}
      {(metadata.images && metadata.images.length > 0) || showImagePicker ? (
        <div className={styles.gallery}>
          <div className={styles.galleryScroll}>
            {metadata.images?.map((img, idx) => (
              <div key={idx} className={styles.galleryItem}>
                <img src={resolveAssetPath(img, rootPath)} alt={`Location ${idx}`} />
                <button className={styles.removeImg} onClick={() => removeImage(img)}><X size={14} /></button>
              </div>
            ))}
            <button className={styles.addImgBtn} onClick={() => setShowImagePicker(true)}>
              <Plus size={24} />
              <span>Adicionar Foto</span>
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.galleryPlaceholder} onClick={() => setShowImagePicker(true)}>
          <MapPin size={32} />
          <span>Clique para adicionar imagens desta localização</span>
        </div>
      )}

      <div className={styles.mainContent}>
        <div className={styles.hero}>
          <div className={styles.info}>
            <div className={styles.badgeRow}>
              <span className={styles.typeTag}><MapPin size={12} /> Localização</span>
              {metadata.music && (
                <span className={`${styles.musicIndicator} ${isPlaying ? styles.active : ''}`}>
                  <Music size={12} />
                </span>
              )}
              <ChevronRight size={14} className={styles.separator} />
              <span className={styles.statusTag}>Explorado</span>
            </div>
            <h1 className={styles.name}>{noteName}</h1>
          </div>

          {/* Player de Música */}
          {metadata.music && (
            <div className={styles.audioPlayer}>
              <audio 
                ref={audioRef} 
                src={resolveAssetPath(metadata.music, rootPath)} 
                onTimeUpdate={onTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />
              <button className={styles.playBtn} onClick={togglePlay}>
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>
              <div className={styles.playerInfo}>
                <span className={styles.trackName}>
                  {metadata.music.split(/[\\/]/).pop() || 'Trilha Sonora'}
                </span>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={progress} 
                  onChange={handleSeek}
                  className={styles.progressBar}
                />
              </div>
            </div>
          )}
        </div>

        {/* Personagens Vinculados */}
        <div className={styles.linkedSection}>
          <div className={styles.sectionHeader}>
            <User size={14} />
            <span>Personagens Presentes</span>
          </div>
          <div className={styles.tagsGrid}>
            {metadata.linked_characters?.map(path => {
              const charName = path.split(/[\\/]/).pop()?.replace('.md', '');
              return (
                <div key={path} className={styles.charTag}>
                  <span className={styles.tagName} onClick={() => setActiveFile(path)}>{charName}</span>
                  <button className={styles.unlinkBtn} onClick={() => unlinkCharacter(path)}><X size={12} /></button>
                </div>
              );
            })}
            <button className={styles.addTagBtn} onClick={() => setShowCharacterPicker(true)}>
              <Plus size={14} /> Vincular
            </button>
          </div>
        </div>

        <div className={styles.attributesSection}>
          <div className={styles.sectionHeader}>
            <Info size={14} />
            <span>Detalhes da Localização</span>
          </div>
          <AttributeGrid metadata={metadata} onUpdate={updateMetadata} />
        </div>
        
        {activeFile && <Backlinks targetPath={activeFile} />}
      </div>

      {showImagePicker && (
        <Modal isOpen={true} onClose={() => setShowImagePicker(false)} title="Adicionar Imagem" size="lg">
          <ImageGallery onSelect={addImage} onClose={() => setShowImagePicker(false)} />
        </Modal>
      )}

      {showCharacterPicker && (
        <Modal isOpen={true} onClose={() => setShowCharacterPicker(false)} title="Vincular Personagem">
          <div className={styles.charPicker}>
            {availableCharacters.length > 0 ? (
              availableCharacters
                .filter(c => !metadata.linked_characters?.includes(c.path))
                .map(char => (
                  <button key={char.path} className={styles.charOption} onClick={() => linkCharacter(char)}>
                    <div className={styles.charIcon}>
                      {char.icon && char.icon.length < 5 ? <span>{char.icon}</span> : <User size={16} />}
                    </div>
                    <span>{char.name}</span>
                  </button>
                ))
            ) : (
              <p className={styles.emptyMsg}>Nenhum personagem encontrado no workspace.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

