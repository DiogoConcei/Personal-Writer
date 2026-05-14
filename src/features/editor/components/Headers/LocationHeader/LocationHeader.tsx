import { useState, useEffect, useRef } from 'react';
import styles from './LocationHeader.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { parseMarkdownMetadata } from '@/features/editor/store/metadataParser';
import { EditorMetadata, LocationHeaderProps, CharacterLink } from '@/shared/types';
import {
  MapPin, Music, Play, Pause, Plus,
  ChevronRight, Info, User, X
} from 'lucide-react';
import ImageGallery from "@/features/SlashMenu/components/ImageGallery/ImageGallery";
import Modal from '@/shared/components/Modal/Modal/Modal';
import { AttributeGrid } from "../../Metadata/AttributeGrid/AttributeGrid";
import { readFile, listDirectory, resolveAssetPath } from '@/tauri-bridge';
import { Backlinks } from "../../Insights/Backlinks/Backlinks";

export function LocationHeader({ metadata: propMetadata, readOnly }: LocationHeaderProps) {
  const { rootPath, activeFile, setActiveFile } = useWorkspaceStore();
  const { metadata: storeMetadata, setMetadata, save } = useEditorStore();

  const metadata = propMetadata || storeMetadata;

  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState<CharacterLink[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const noteName = activeFile ? activeFile.split(/[\\/]/).pop()?.replace('.md', '') : 'Nova Localização';

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (showCharacterPicker && !readOnly) {
      loadCharacters();
    }
  }, [showCharacterPicker, readOnly]);

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

  const updateMetadata = (newData: EditorMetadata) => {
    if (readOnly) return;
    setMetadata(newData);

    if (activeFile) {
      save(activeFile, rootPath || undefined);
    }
  };

  const addImage = (src: string) => {
    if (readOnly) return;
    const images = [...(metadata.images || [])];
    if (!images.includes(src)) {
      images.push(src);
      updateMetadata({ ...metadata, images });
    }
    setShowImagePicker(false);
  };

  const removeImage = (src: string) => {
    if (readOnly) return;
    const images = (metadata.images || []).filter(img => img !== src);
    updateMetadata({ ...metadata, images });
  };

  const linkCharacter = (char: CharacterLink) => {
    if (readOnly) return;
    const linked = [...(metadata.linked_characters || [])];
    if (!linked.includes(char.path)) {
      linked.push(char.path);
      updateMetadata({ ...metadata, linked_characters: linked });
    }
    setShowCharacterPicker(false);
  };

  const unlinkCharacter = (path: string) => {
    if (readOnly) return;
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

  const handleStartEditing = () => {
    if (readOnly) return;
    setEditedName(noteName || '');
    setIsEditingName(true);
  };

  const handleRename = async () => {
    if (!activeFile || !editedName || editedName === noteName) {
      setIsEditingName(false);
      return;
    }

    const { renameItem } = useWorkspaceStore.getState();
    await renameItem(activeFile, editedName);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  return (
    <div className={`${styles.locationHeader} ${readOnly ? styles['locationHeader--readonly'] : ''}`}>
      {(metadata.images && metadata.images.length > 0) || (showImagePicker && !readOnly) ? (
        <div className={styles.gallery}>
          <div className={styles.galleryScroll}>
            {metadata.images?.map((img: string, idx: number) => (
              <div key={idx} className={styles.galleryItem}>
                <img src={resolveAssetPath(img, rootPath) || undefined} alt={`Location ${idx}`} />
                {!readOnly && <button className={styles.removeImg} onClick={() => removeImage(img)}><X size={14} /></button>}
              </div>
            ))}
            {!readOnly && (
              <button className={styles.addImgBtn} onClick={() => setShowImagePicker(true)}>
                <Plus size={24} />
                <span>Adicionar Foto</span>
              </button>
            )}
          </div>
        </div>
      ) : !readOnly ? (
        <div className={styles.galleryPlaceholder} onClick={() => setShowImagePicker(true)}>
          <MapPin size={32} />
          <span>Clique para adicionar imagens desta localização</span>
        </div>
      ) : null}

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

            {isEditingName ? (
              <input
                ref={nameInputRef}
                className={styles.nameInput}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <h1
                className={`${styles.name} ${!readOnly ? styles['name--editable'] : ''}`}
                onClick={handleStartEditing}
                title={readOnly ? "" : "Clique para renomear"}
              >
                {noteName}
              </h1>
            )}
          </div>

          {metadata.music && (
            <div className={styles.audioPlayer}>
              <audio
                ref={audioRef}
                src={resolveAssetPath(metadata.music, rootPath) || undefined}
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
                  disabled={readOnly}
                />
              </div>
            </div>
          )}
        </div>

        <div className={styles.linkedSection}>
          <div className={styles.sectionHeader}>
            <User size={14} />
            <span>Personagens Presentes</span>
          </div>
          <div className={styles.tagsGrid}>
            {metadata.linked_characters?.map((path: string) => {
              const charName = path.split(/[\\/]/).pop()?.replace('.md', '');
              return (
                <div key={path} className={styles.charTag}>
                  <span className={styles.tagName} onClick={() => !readOnly && setActiveFile(path)}>{charName}</span>
                  {!readOnly && <button className={styles.unlinkBtn} onClick={() => unlinkCharacter(path)}><X size={12} /></button>}
                </div>
              );
            })}
            {!readOnly && (
              <button className={styles.addTagBtn} onClick={() => setShowCharacterPicker(true)}>
                <Plus size={14} /> Vincular
              </button>
            )}
          </div>
        </div>

        <div className={styles.attributesSection}>
          <div className={styles.sectionHeader}>
            <Info size={14} />
            <span>Detalhes da Localização</span>
          </div>
          <AttributeGrid metadata={metadata} onUpdate={updateMetadata} readOnly={readOnly} />
        </div>

        {!readOnly && activeFile && <Backlinks targetPath={activeFile} />}
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
