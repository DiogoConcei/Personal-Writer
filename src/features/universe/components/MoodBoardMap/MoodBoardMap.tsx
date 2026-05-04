import { useState } from "react";
import { useUIStore } from "@/store/uiStore";
import { useMoodBoardStore } from "../../store/moodBoardStore";
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import { resolveAssetPath } from "@/tauri-bridge/fs";
import { ArrowLeft, Image as ImageIcon, Trash2, Edit2, Check, X } from "lucide-react";
import styles from "./MoodBoardMap.module.scss";

export default function MoodBoardMap() {
  const setActivePanel = useUIStore((state) => state.setActivePanel);
  const { boardName, backgroundImage } = useMoodBoardStore();
  const { rootPath } = useWorkspaceStore();

  const [mockBoards, setMockBoards] = useState([
    { id: "1", name: boardName, backgroundImage, active: true },
    { id: "2", name: "Personagens & Protagonistas", backgroundImage: null, active: false },
    { id: "3", name: "Ambientação e Cenários", backgroundImage: null, active: false },
    { id: "4", name: "Referências de Luta", backgroundImage: null, active: false },
    { id: "5", name: "Paleta de Cores", backgroundImage: null, active: false },
    { id: "6", name: "Linha do Tempo Visual", backgroundImage: null, active: false },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleSelectBoard = (id: string) => {
    // Por enquanto apenas volta para o moodboard principal
    setActivePanel("moodboard");
  };

  const handleEditClick = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveName = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (editName.trim()) {
      setMockBoards(prev => prev.map(b => b.id === id ? { ...b, name: editName } : b));
    }
    setEditingId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMockBoards(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Mapa de Murais</h1>
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
          {mockBoards.map((board) => (
            <div 
              key={board.id} 
              className={styles.boardCard}
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
        </div>
      </main>
    </div>
  );
}
