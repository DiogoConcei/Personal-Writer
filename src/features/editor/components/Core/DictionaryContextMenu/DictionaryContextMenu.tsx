import { useEffect, useState } from 'react';
import { getSynonyms, addToDictionary, getSpellSuggestions } from '@/tauri-bridge';
import styles from './DictionaryContextMenu.module.scss';
import { Languages, Plus, Check, Loader2 } from 'lucide-react';
import { DictionaryContextMenuProps } from '@/shared/types';

export function DictionaryContextMenu({ editor, x, y, word, onClose }: DictionaryContextMenuProps) {
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!word) return;
      setLoading(true);
      try {

        const [synList, sugList] = await Promise.all([
          getSynonyms(word),
          getSpellSuggestions(word)
        ]);
        setSynonyms(synList);
        setSuggestions(sugList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [word]);

  const replaceWord = (newWord: string) => {
    onClose();

    requestAnimationFrame(() => {
      editor.chain().focus().insertContent(newWord).run();
    });
  };

  const handleAddToDict = async () => {
    onClose();
    try {
      await addToDictionary(word);

      (editor.commands as any).recheckSpelling();
    } catch (e) {
      console.error(e);
    }
  };

  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - 250);

  return (
    <div
      className={styles.menu}
      style={{
        '--menu-y': `${adjustedY}px`,
        '--menu-x': `${adjustedX}px`
      } as React.CSSProperties}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className={styles.group}>
        <div className={styles.label}><Check size={10} /> Corrigir</div>
        {loading ? (
          <div className={styles.status}><Loader2 size={10} className={styles.spin} /> Buscando...</div>
        ) : suggestions.length > 0 ? (
          suggestions.map(s => (
            <button
              key={s}
              className={styles.item}
              onMouseDown={(e) => { e.preventDefault(); replaceWord(s); }}
            >
              {s}
            </button>
          ))
        ) : (
          <div className={styles.status}>Nenhuma sugestão</div>
        )}
      </div>

      <div className={styles.group}>
        <div className={styles.label}><Languages size={10} /> Sinônimos</div>
        {loading ? (
          <div className={styles.status}><Loader2 size={10} className={styles.spin} /> Buscando...</div>
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
          <div className={styles.status}>Nenhum sinônimo encontrado</div>
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
