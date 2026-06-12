import React from 'react';
import { Type, MousePointer2, Hand, ZoomIn, ZoomOut, RotateCcw, ImagePlus, Pencil, Eraser, Link, Layers, Map, Settings2, Layout, LayoutPanelLeft, Save, Wallpaper } from 'lucide-react';
import { MesaToolbarProps } from '@/shared/types';
import styles from '../MesaTrabalho/MesaTrabalho.module.scss';

export const MesaToolbar: React.FC<MesaToolbarProps> = ({
  boardName,
  boardMode,
  isEditingName,
  tempName,
  isPencilActive,
  isEraserActive,
  isTextToolActive,
  isConnecting,
  isGroupingMode,
  isPanModeActive,
  isSettingsOpen,
  onSetTempName,
  onSaveName,
  onSetIsEditingName,
  activateSelectTool,
  activatePanTool,
  zoomIn,
  zoomOut,
  handleResetView,
  onOpenGallery,
  activatePencilTool,
  activateEraserTool,
  activateTextTool,
  handleToggleConnectionMode,
  handleToggleGroupingMode,
  setActivePanel,
  setIsSettingsOpen,
  setBoardMode,
  onSaveBoard
}) => {
  return (
    <div className={styles.toolbar} onClick={(e) => e.stopPropagation()}>
      <div className={styles.toolbarGroup}>
        <div className={styles.boardTitle}>
          {isEditingName ? (
            <input
              autoFocus
              className={styles.titleInput}
              value={tempName}
              onChange={(e) => onSetTempName(e.target.value)}
              onBlur={onSaveName}
              onKeyDown={(e) => e.key === 'Enter' && onSaveName()}
            />
          ) : (
            <h2 onClick={() => onSetIsEditingName(true)}>{boardName || 'Mesa Sem Nome'}</h2>
          )}
        </div>
      </div>

      <div className={styles.toolbarGroup}>
        <button 
          className={`${styles.toolbarBtn} ${!isPanModeActive && !isPencilActive && !isEraserActive && !isTextToolActive ? styles.active : ''}`} 
          title="Selecionar"
          onClick={activateSelectTool}
        >
          <MousePointer2 size={16} />
        </button>
        <button 
          className={`${styles.toolbarBtn} ${isPanModeActive ? styles.active : ''}`} 
          title="Mover Tela (H)"
          onClick={activatePanTool}
        >
          <Hand size={16} />
        </button>
        
        <div className={styles.divider}></div>

        <button className={styles.toolbarBtn} title="Aumentar Zoom" onClick={zoomIn}><ZoomIn size={16} /></button>
        <button className={styles.toolbarBtn} title="Diminuir Zoom" onClick={zoomOut}><ZoomOut size={16} /></button>
        <button className={styles.toolbarBtn} title="Resetar Visualização" onClick={handleResetView}><RotateCcw size={16} /></button>

        <div className={styles.divider}></div>

        <button className={styles.toolbarBtn} title="Adicionar Imagem" onClick={() => onOpenGallery('item')}><ImagePlus size={16} /></button>
        <button 
          className={`${styles.toolbarBtn} ${isPencilActive ? styles.active : ''}`} 
          title="Desenhar (Lápis)"
          onClick={activatePencilTool}
        >
          <Pencil size={16} />
        </button>
        <button 
          className={`${styles.toolbarBtn} ${isEraserActive ? styles.active : ''}`} 
          title="Borracha (Excluir Desenho)"
          onClick={activateEraserTool}
        >
          <Eraser size={16} />
        </button>
        <button 
          className={`${styles.toolbarBtn} ${isTextToolActive ? styles.active : ''}`} 
          title="Texto"
          onClick={activateTextTool}
        >
          <Type size={16} />
        </button>

        <div className={styles.divider}></div>

        {boardMode !== 'free' && (
          <button 
            className={`${styles.toolbarBtn} ${isConnecting ? styles.active : ''}`} 
            title="Vincular Itens (L)"
            onClick={handleToggleConnectionMode}
          >
            <Link size={16} />
          </button>
        )}
        {boardMode !== 'planning' && (
          <button 
            className={`${styles.toolbarBtn} ${isGroupingMode ? styles.active : ''}`} 
            title="Agrupar Itens (G)"
            onClick={handleToggleGroupingMode}
          >
            <Layers size={16} />
          </button>
        )}

        <div className={styles.divider}></div>

        <button 
          className={styles.toolbarBtn} 
          title="Ver Mapa de Murais"
          onClick={() => setActivePanel('moodboard-map')}
        >
          <Map size={16} />
        </button>

        <div className={styles.settingsDropdown}>
          <button 
            className={`${styles.toolbarBtn} ${isSettingsOpen ? styles.active : ''}`} 
            title="Configurações da Mesa"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Settings2 size={16} />
          </button>
          
          {isSettingsOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.menuHeader}>Configurações</div>
              <button className={styles.menuItem} onClick={() => setActivePanel('moodboard-map')}>
                <Map size={14} /> Ver Todas as Mesas
              </button>
              <button className={styles.menuItem} onClick={() => onOpenGallery('background')}>
                <Wallpaper size={14} /> Mudar Imagem de Fundo
              </button>
              <div className={styles.menuDivider}></div>
              <div className={styles.menuLabel}>Modo da Mesa</div>
              <div className={styles.modeToggle}>
                <button 
                  className={`${styles.modeBtn} ${boardMode === 'free' ? styles.active : ''}`}
                  onClick={() => setBoardMode('free')}
                >
                  <Layout size={14} /> Livre
                </button>
                <button 
                  className={`${styles.modeBtn} ${boardMode === 'planning' ? styles.active : ''}`}
                  onClick={() => setBoardMode('planning')}
                >
                  <LayoutPanelLeft size={14} /> Planejamento
                </button>
              </div>
              <div className={styles.menuDivider}></div>
              <button className={styles.menuItem} onClick={() => setActivePanel('dashboard')}>
                Sair da Mesa
              </button>
            </div>
          )}
        </div>

        <div className={styles.divider}></div>
        <button className={styles.toolbarBtn} title="Salvar Mesa (Manual)" onClick={onSaveBoard}><Save size={16} /></button>
      </div>
    </div>
  );
};
