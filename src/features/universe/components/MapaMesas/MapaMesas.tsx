import { useState, useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { useMesaTrabalhoStore } from "../../store/moodBoardStore";
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import { resolveAssetPath } from "@/tauri-bridge/fs";
import { ArrowLeft, Image as ImageIcon, Trash2, Edit2, Check, X, Plus, Loader2 } from "lucide-react";
import styles from "./MapaMesas.module.scss";

export default function MoodBoardMap() {
  const setActivePanel = useUIStore((state) => state.setActivePanel);
  const { allBoards, loadAllBoards, loadBoard, createBoard, deleteBoard, boardId: activeBoardId } = useMesaTrabalhoStore();
  const { rootPath } = useWorkspaceStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (rootPath) {
      loadAllBoards(rootPath).finally(() => setIsInitialLoading(false));
    }
  }, [rootPath, loadAllBoards]);

  const handleSelectBoard = async (id: string) => {
    if (rootPath) {
      await loadBoard(rootPath, id);
      setActivePanel("moodboard");
    }
  };

  const handleAddBoard = async () => {
    if (rootPath) {
      const id = await createBoard(rootPath, `Novo Mural ${allBoards.length + 1}`);
      setEditingId(id);
      setEditName(`Novo Mural ${allBoards.length + 1}`);
    }
  };

  const handleEditClick = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveName = async (e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent, id: string) => {
    e.stopPropagation();
    if (editName.trim() && rootPath) {
      // Para renomear, carregamos o mural, mudamos o nome e salvamos
      // Como o allBoards é apenas leitura rápida, precisamos garantir a persistência no arquivo
      const currentBoardId = useMesaTrabalhoStore.getState().boardId;
      await loadBoard(rootPath, id);
      useMesaTrabalhoStore.getState().setBoardName(editName);
      await useMesaTrabalhoStore.getState().saveBoard(rootPath);
      
      // Se estávamos editando outro mural, volta para ele (ou limpa se era o mesmo)
      if (currentBoardId && currentBoardId !== id) {
        await loadBoard(rootPath, currentBoardId);
      }
    }
    setEditingId(null);
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (rootPath && window.confirm('Tem certeza que deseja excluir este mural?')) {
      await deleteBoard(rootPath, id);
    }
  };

  if (isInitialLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.canvasLoading}>
          <Loader2 className="animate-spin" size={48} />
          <span>Carregando murais...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1>Mapa de Murais</h1>
          <button className={styles.addBtn} onClick={handleAddBoard}>
            <Plus size={18} />
            Novo Mural
          </button>
        </div>
        
        <button 
          className={styles.backBtn}
          onClick={() => setActivePanel("moodboard")}
        >
          <ArrowLeft size={18} />
          Voltar ao Mural
        </button>
      </header>

      <main className={styles.content}>
        <div className={styles.grid}>
          {allBoards.map((board) => (
            <div 
              key={board.id} 
              className={`${styles.boardCard} ${board.id === activeBoardId ? styles.activeCard : ''}`}
              onClick={() => handleSelectBoard(board.id)}
            >
              <div className={styles.imageContainer}>
                {board.backgroundImage ? (
                  <img 
                    src={resolveAssetPath(board.backgroundImage, rootPath)} 
                    alt={board.name} 
                  />
                ) : (
                  <ImageIcon size={48} className={styles.placeholderIcon} />
                )}
                
                <div className={styles.cardActions}>
                  <button 
                    className={styles.actionBtn} 
                    onClick={(e) => handleEditClick(e, board.id, board.name)}
                    title="Renomear mural"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                    onClick={(e) => handleDeleteClick(e, board.id)}
                    title="Excluir mural"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {editingId === board.id ? (
                <div className={styles.editNameContainer} onClick={e => e.stopPropagation()}>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' ? handleSaveName(e, board.id) : null}
                    onBlur={(e) => handleSaveName(e, board.id)}
                    autoFocus
                  />
                  <button onClick={(e) => handleSaveName(e, board.id)} title="Confirmar"><Check size={14} /></button>
                  <button onClick={() => setEditingId(null)} title="Cancelar"><X size={14} /></button>
                </div>
              ) : (
                <span className={styles.boardName}>{board.name}</span>
              )}
            </div>
          ))}

          <div className={styles.boardCard} onClick={handleAddBoard}>
            <div className={styles.imageContainer} style={{ borderStyle: 'dashed', opacity: 0.6 }}>
              <Plus size={48} className={styles.placeholderIcon} />
            </div>
            <span className={styles.boardName} style={{ opacity: 0.6 }}>Criar novo mural...</span>
          </div>
        </div>
      </main>
    </div>
  );
}


