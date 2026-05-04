import React, { useState, useRef, useEffect } from 'react';
import { useMesaTrabalhoStore } from '../../store/moodBoardStore';
import { resolveAssetPath } from '@/tauri-bridge/fs';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { X, Trash2, Map, Layers, Package, GripHorizontal } from 'lucide-react';
import styles from './MesaTrabalho.module.scss';

interface Props {
  characterId: string;
  onClose: () => void;
}

export const CharacterDetailsModal: React.FC<Props> = ({ characterId, onClose }) => {
  const { rootPath } = useWorkspaceStore();
  const { 
    items, 
    groups, 
    boardName, 
    updateItem, 
    removeItem,
    modalZIndexes,
    bringDetailsToFront
  } = useMesaTrabalhoStore();

  const character = items.find(i => i.id === characterId);
  const zIndex = modalZIndexes[characterId] || 10001;
  
  // Posicionamento flutuante e arrastável
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  const inventory = items.filter(i => i.ownerId === characterId);
  const group = character ? groups.find(g => g.id === character.groupId) : null;

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      setPosition({
        x: initialPos.current.x + dx,
        y: initialPos.current.y + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!character) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    bringDetailsToFront(characterId);
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: position.x, y: position.y };
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateItem(character.id, { customName: e.target.value });
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o personagem "${character.customName || 'Sem Nome'}" e todos os seus itens?`)) {
      removeItem(character.id);
      onClose();
    }
  };

  return (
    <div 
      className={styles.detailsModalFloating} 
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        zIndex: zIndex
      }}
      onClick={e => {
        e.stopPropagation();
        bringDetailsToFront(characterId);
      }}
    >
      <header className={styles.detailsHeader} onMouseDown={handleMouseDown} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
        <div className={styles.headerTitle}>
          <GripHorizontal size={16} className={styles.gripIcon} />
          <Package size={18} />
          <span>Perfil do Personagem</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
      </header>

      <div className={styles.detailsContent}>
        <div className={styles.characterProfile}>
          <div className={styles.profileImage}>
            <img src={resolveAssetPath(character.path, rootPath) || ''} alt="Character" />
          </div>
          <div className={styles.profileMain}>
            <input 
              type="text" 
              className={styles.nameInput}
              placeholder="Nome do Personagem..."
              value={character.customName || ''}
              onChange={handleNameChange}
              autoFocus
            />
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <Map size={14} />
                <span>Mesa: <strong>{boardName}</strong></span>
              </div>
              <div className={styles.metaItem}>
                <Layers size={14} />
                <span>Grupo: <strong>{group?.title || 'Nenhum'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.inventorySection}>
          <h3>Inventário ({inventory.length})</h3>
          {inventory.length > 0 ? (
            <div className={styles.inventoryGrid}>
              {inventory.map(item => (
                <div key={item.id} className={styles.inventoryItem} title={item.category || 'Item'}>
                  <img src={resolveAssetPath(item.path, rootPath) || ''} alt="Inventory Item" />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyInventory}>
              Este personagem não possui itens atrelados.
              <br />
              <span>Arraste um item sobre ele na mesa para adicioná-lo.</span>
            </div>
          )}
        </div>
      </div>

      <footer className={styles.detailsFooter}>
        <button className={styles.deleteCharBtn} onClick={handleDelete}>
          <Trash2 size={16} />
          Excluir Personagem
        </button>
      </footer>
    </div>
  );
};
