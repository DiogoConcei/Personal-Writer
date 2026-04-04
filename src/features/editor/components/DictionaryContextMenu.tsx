import { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { getSynonyms, addToDictionary } from '@/tauri-bridge';
import styles from './DictionaryContextMenu.module.scss';
import { Languages, Plus, Check } from 'lucide-react';

interface DictionaryContextMenuProps {
  editor: Editor;
  x: number;
  y: number;
  word: string;
  suggestions: string[];
  onClose: () => void;
}

export function DictionaryContextMenu({ editor, x, y, word, suggestions, onClose }: DictionaryContextMenuProps) {
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!word) return;
      setLoading(true);
      try {
        const list = await getSynonyms(word);
        setSynonyms(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [word]);

  const replaceWord = (newWord: string) => {
    onClose(); // Fechar o menu PRIMEIRO
    // Usar requestAnimationFrame para garantir que o menu sumiu da DOM antes da transação pesada
    requestAnimationFrame(() => {
      editor.chain().focus().insertContent(newWord).run();
    });
  };

  const handleAddToDict = async () => {
    onClose();
    try {
      await addToDictionary(word);
      // O recheckSpelling será disparado naturalmente pela mudança do doc ou via comando manual se necessário
    } catch (e) {
      console.error(e);
    }
  };

  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - 250);

  return (
    <div className={styles.menu} style={{ top: adjustedY, left: adjustedX }} onMouseDown={e => e.stopPropagation()}>
      {suggestions.length > 0 && (
        <div className={styles.group}>
          <div className={styles.label}><Check size={10} /> Corrigir</div>
          {suggestions.map(s => (
            <button 
              key={s} 
              className={styles.item} 
              onMouseDown={(e) => { e.preventDefault(); replaceWord(s); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className={styles.group}>
        <div className={styles.label}><Languages size={10} /> Sinônimos</div>
        {loading ? (
          <div className={styles.status}>Buscando...</div>
        ) : synonyms.length > 0 ? (
          <div className={styles.pillGrid}>
            {synonyms.slice(0, 8).map(s => (
              <button 
                key={s} 
                className={styles.pill} 
                onMouseDown={(e) => { e.preventDefault(); replaceWord(s); }}
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.status}>Nenhum</div>
        )}
      </div>

      <div className={styles.divider} />

      <button 
        className={styles.actionItem} 
        onMouseDown={(e) => { e.preventDefault(); handleAddToDict(); }}
      >
        <Plus size={12} /> Aprender "{word}"
      </button>
    </div>
  );
}
