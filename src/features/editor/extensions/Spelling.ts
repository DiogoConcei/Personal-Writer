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

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spelling: {
      recheckSpelling: () => ReturnType;
    };
  }
}

interface SpellingPluginState {
  decorations: DecorationSet;
  forceCheck: boolean;
}

export const Spelling = Extension.create<SpellingOptions>({
  name: 'spelling',

  addOptions() {
    return {
      debounce: 1000,
    };
  },

  addCommands() {
    return {
      recheckSpelling: () => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta('recheck_spelling', true);
        }
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const { debounce } = this.options;
    const pluginKey = new PluginKey<SpellingPluginState>('spelling');
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let docVersion = 0;

    return [
      new Plugin<SpellingPluginState>({
        key: pluginKey,
        state: {
          init() {
            return { decorations: DecorationSet.empty, forceCheck: false };
          },
          apply(tr, pluginState) {
            const data = tr.getMeta('spelling_errors');
            const forceCheck = tr.getMeta('recheck_spelling');

            if (data) {
              const { results, version } = data;
              
              if (version !== docVersion) {
                return { 
                  decorations: pluginState.decorations.map(tr.mapping, tr.doc),
                  forceCheck: !!forceCheck 
                };
              }

              const decoList: Decoration[] = [];
              results.forEach(({ pos, text, errors }: { pos: number, text: string, errors: SpellError[] }) => {
                errors.forEach((err) => {
                  const from = byteToCharIndex(text, err.start);
                  const to = byteToCharIndex(text, err.end);
                  
                  decoList.push(Decoration.inline(pos + from, pos + to, {
                    class: 'misspelled',
                    'data-word': err.word,
                    'data-suggestions': JSON.stringify(err.suggestions),
                  }));
                });
              });

              return { decorations: DecorationSet.create(tr.doc, decoList), forceCheck: !!forceCheck };
            }

            return { 
              decorations: pluginState.decorations.map(tr.mapping, tr.doc),
              forceCheck: !!forceCheck 
            };
          },
        },
        props: {
          decorations(state) {
            return pluginKey.getState(state)?.decorations || DecorationSet.empty;
          },
        },
        view() {
          return {
            update(view, prevState) {
              const state = pluginKey.getState(view.state);
              const docChanged = !view.state.doc.eq(prevState.doc);
              
              if (docChanged || state?.forceCheck) {
                docVersion++;
                const currentVersion = docVersion;
                
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(async () => {
                  const checkPromises: Promise<{ pos: number, text: string, errors: SpellError[] }>[] = [];
                  
                  // Verificação nó-a-nó (KI-027)
                  view.state.doc.descendants((node, pos) => {
                    if (node.isText && node.text) {
                      checkPromises.push((async () => {
                        try {
                          const errors = await checkSpelling(node.text!);
                          return { pos, text: node.text!, errors };
                        } catch (e) {
                          return { pos, text: node.text!, errors: [] };
                        }
                      })());
                    }
                    return true;
                  });

                  const results = await Promise.all(checkPromises);
                  
                  if (currentVersion === docVersion) {
                    view.dispatch(view.state.tr.setMeta('spelling_errors', {
                      results,
                      version: currentVersion
                    }));
                  }
                }, state?.forceCheck ? 0 : debounce);
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
