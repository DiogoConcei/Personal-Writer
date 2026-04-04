import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { checkSpelling, SpellError } from '@/tauri-bridge';

// Função para converter offset de bytes (UTF-8) para offset de caracteres (UTF-16/ProseMirror)
function byteToCharIndex(text: string, byteOffset: number): number {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  const slice = bytes.slice(0, byteOffset);
  const decoder = new TextDecoder();
  return decoder.decode(slice).length;
}

export interface SpellingOptions {
  debounce: number;
}

export const Spelling = Extension.create<SpellingOptions>({
  name: 'spelling',

  addOptions() {
    return {
      debounce: 1000,
    };
  },

  addProseMirrorPlugins() {
    const { debounce } = this.options;
    let timeout: any = null;
    let docVersion = 0;

    return [
      new Plugin({
        key: new PluginKey('spelling'),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldSet) {
            const errors = tr.getMeta('spelling_errors');
            if (errors) {
              const { doc, text, version } = errors;
              
              // Se a versão do documento mudou desde que a requisição foi feita, ignorar
              if (version !== docVersion) return oldSet.map(tr.mapping, tr.doc);

              const decoList = errors.list.map((err: SpellError) => {
                // Converter os índices de bytes do Rust para caracteres do ProseMirror
                const from = byteToCharIndex(text, err.start);
                const to = byteToCharIndex(text, err.end);
                
                // IMPORTANTE: Adicionar 1 para compensar o offset do nó de texto no ProseMirror
                // mas apenas se estivermos dentro de um nó. Para simplicidade, usamos resolve().
                return Decoration.inline(from + 1, to + 1, {
                  class: 'misspelled',
                  'data-word': err.word,
                  'data-suggestions': JSON.stringify(err.suggestions),
                });
              });
              return DecorationSet.create(doc, decoList);
            }
            return oldSet.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
        view() {
          return {
            update(view, prevState) {
              const docChanged = !view.state.doc.eq(prevState.doc);
              if (docChanged) {
                docVersion++;
                const currentVersion = docVersion;
                
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(async () => {
                  const text = view.state.doc.textContent;
                  if (!text.trim()) return;

                  try {
                    const errors = await checkSpelling(text);
                    
                    // Só despacha se ainda estivermos na mesma versão do documento
                    if (currentVersion === docVersion) {
                      view.dispatch(view.state.tr.setMeta('spelling_errors', {
                        list: errors,
                        text: text,
                        doc: view.state.doc,
                        version: currentVersion
                      }));
                    }
                  } catch (e) {
                    console.error('Spellcheck error:', e);
                  }
                }, debounce);
              }
            },
            destroy() {
              if (timeout) clearTimeout(timeout);
            },
          };
        },
      }),
    ];
  },
});
