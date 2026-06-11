import { useCanvasControls } from './CanvasControls';
import { NoteConfigPanel } from '../NoteConfigPanel/NoteConfigPanel';
import { PostItConfigPanel } from '../PostItConfigPanel/PostItConfigPanel';
import { PageConfigPanel } from '../PageConfigPanel/PageConfigPanel';
import { DrawingStylePanel } from '@/shared/components/DrawingStylePanel/DrawingStylePanel';
import { TextStylePanel } from '../TextStylePanel/TextStylePanel';
import styles from './CanvasControls.module.scss';
import { SidebarProps } from '@/shared/types';

export function Sidebar({
  isSepararActive,
  setIsSepararActive,
  selectedNoteEntity,
  handleFontSizeChange,
  updateSelectedNoteStyle,
  selectedTextEntity,
  handleTextFontSizeChange,
  handleTextFontFamilyChange,
  toggleTextBold,
  onAddPostIt,
  selectedPostItEntity,
  handlePostItFontSizeChange,
  updateSelectedPostItStyle,
  togglePostItBold,
  handlePostItFontFamilyChange,
  onAddPage,
  selectedPageEntity,
  updateSelectedPageStyle,
  handlePageFontSizeChange,
  handlePageFontFamilyChange,
  togglePageBold,
  isCollageActive,
  activateCollage,
  isAttachActive,
  onToggleAttach,
  onBatchAttach,
  selectedItemIds = [],
  canConfirmCollage,
  onConfirmCollage,
}: SidebarProps) {

  const { sideMenuMode, setSideMenuMode, open } = useCanvasControls();

  const renderContent = () => {
    if (sideMenuMode === "drawing") {
      return (
        <>
          <header className={styles.subHeader}>
            <h2>Ferramenta de Desenho</h2>
          </header>
          <DrawingStylePanel />
        </>
      );
    }

    if (sideMenuMode === "text") {
      return (
        <>
          <header className={styles.subHeader}>
            <h2>Ferramenta de Texto</h2>
          </header>
          <TextStylePanel 
            selectedTextEntity={selectedTextEntity}
            handleFontSizeChange={handleTextFontSizeChange || (() => {})}
            handleFontFamilyChange={handleTextFontFamilyChange || (() => {})}
            toggleBold={toggleTextBold || (() => {})}
          />
        </>
      );
    }

    if (sideMenuMode === "notes") {
      return (
        <>
          <header className={styles.subHeader}>
            <button
              className={styles.subBackButton}
              onClick={() => setSideMenuMode("main")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h2>Configurar Nota</h2>
          </header>

          {selectedNoteEntity && (
            <>
              <NoteConfigPanel
                selectedNoteEntity={selectedNoteEntity}
                handleFontSizeChange={handleFontSizeChange}
                updateSelectedNoteStyle={updateSelectedNoteStyle}
                setIsNoteGalleryOpen={(isOpen) => isOpen ? open('note') : undefined}
              />

              {isAttachActive && (
                <div className={styles.collageSelectionStatus} style={{ margin: 'var(--spacing-md)' }}>
                  <p>Selecionados: {selectedItemIds.length}</p>
                  <button 
                    className={`${styles.menuButton} ${styles.confirmButton}`}
                    onClick={onBatchAttach}
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    Confirmar Anexo
                  </button>
                </div>
              )}
            </>
          )}
        </>
      );
    }

    if (sideMenuMode === "postits") {
      return (
        <>
          <header className={styles.subHeader}>
            <button
              className={styles.subBackButton}
              onClick={() => setSideMenuMode("main")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h2>Configurar Post-it</h2>
          </header>

          {selectedPostItEntity && (
            <PostItConfigPanel
              selectedPostItEntity={selectedPostItEntity}
              handleFontSizeChange={handlePostItFontSizeChange || (() => {})}
              updateSelectedPostItStyle={updateSelectedPostItStyle || (() => {})}
              toggleBold={togglePostItBold || (() => {})}
              handleFontFamilyChange={handlePostItFontFamilyChange || (() => {})}
            />
          )}
        </>
      );
    }

    if (sideMenuMode === "pages") {
      return (
        <>
          <header className={styles.subHeader}>
            <button
              className={styles.subBackButton}
              onClick={() => setSideMenuMode("main")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h2>Configurar Página</h2>
          </header>

          {selectedPageEntity && (
            <PageConfigPanel
              selectedPageEntity={selectedPageEntity}
              handleFontSizeChange={handlePageFontSizeChange || (() => {})}
              updateSelectedPageStyle={updateSelectedPageStyle || (() => {})}
              handleFontFamilyChange={handlePageFontFamilyChange || (() => {})}
              toggleBold={togglePageBold || (() => {})}
            />
          )}
        </>
      );
    }

    return (
      <>
        <header>
          <h2>Adicionar</h2>
        </header>
        <div className={styles.content}>
          <button
            className={styles.menuButton}
            onClick={() => open('note')}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Nota
          </button>

          <button
            className={styles.menuButton}
            onClick={() => open('pdf')}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15h3a2 2 0 0 1 0 4h-3V12h3a2 2 0 0 1 0 4" />
            </svg>
            PDF
          </button>

          <button className={styles.menuButton} onClick={onAddPostIt}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8.5L15.5 3Z" />
              <path d="M15 3v6h6" />
            </svg>
            Post-it
          </button>

          <button className={styles.menuButton} onClick={onAddPage}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            Página
          </button>

          <button
            className={styles.menuButton}
            onClick={() => open('image')}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Imagem
          </button>

          <button 
            className={`${styles.menuButton} ${isAttachActive ? styles.active : ""}`}
            onClick={onToggleAttach}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Anexar
          </button>

          {isAttachActive && (
            <div className={styles.collageSelectionStatus}>
              <p>Selecionados: {selectedItemIds.length}</p>
              <button 
                className={`${styles.menuButton} ${styles.confirmButton}`}
                onClick={onBatchAttach}
              >
                Confirmar Anexo
              </button>
            </div>
          )}

          <button
            className={`${styles.menuButton} ${isSepararActive ? styles.active : ""}`}
            onClick={() => setIsSepararActive(!isSepararActive)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            Separar
          </button>

          <button 
            className={`${styles.menuButton} ${isCollageActive ? styles.active : ""}`}
            onClick={activateCollage}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
              <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
              <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
            </svg>
            Colagem
          </button>

          {isCollageActive && (
            <div className={styles.collageSelectionStatus}>
              <p>Selecionados: {selectedItemIds.length}/10</p>
              {canConfirmCollage && (
                <button 
                  className={`${styles.menuButton} ${styles.confirmButton}`}
                  onClick={onConfirmCollage}
                >
                  Confirmar Seleção
                </button>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <aside className={styles.sideMenu} onClick={(e) => e.stopPropagation()}>
      {renderContent()}
    </aside>
  );
}
