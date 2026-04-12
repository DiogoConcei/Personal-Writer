import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { checkSpellingBatch, SpellError } from '@/tauri-bridge';

// UMA instância reutilizável para evitar GC excessivo
const encoder = new TextEncoder();

/**
 * Converte offset de bytes (UTF-8 do Rust) para índice de caracteres (UTF-16 do JS/ProseMirror)
 * de forma eficiente construindo um mapa de mapeamento uma única vez para a string.
 */
function buildByteToCharMap(text: string): Uint32Array {
  const bytes = encoder.encode(text);
  const map = new Uint32Array(bytes.length + 1);
  
  let charIndex = 0;
  let byteIndex = 0;
  
  // Itera por caracteres (codepoints) da string JS
  for (const char of text) {
    const charBytes = encoder.encode(char).length;
    for (let i = 0; i < charBytes; i++) {
      map[byteIndex + i] = charIndex;
    }
    byteIndex += charBytes;
    charIndex++;
  }
  map[byteIndex] = charIndex;
  return map;
}

export interface SpellingOptions {
  debounce: number;
}

export interface SpellingStorage {
  pluginKey: PluginKey<SpellingPluginState> | null;
}

export interface SpellingPluginState {
  decorations: DecorationSet;
  forceCheck: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spelling: {
      recheckSpelling: () => ReturnType;
    };
  }
}

// Cache global de nós já verificados (ProseMirror Nodes são imutáveis)
const checkedNodes = new WeakSet<any>();

export const Spelling = Extension.create<SpellingOptions, SpellingStorage>({
  name: 'spelling',

  addOptions() {
    return {
      debounce: 150,
    };
  },

  addStorage() {
    return {
      pluginKey: null,
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
    this.storage.pluginKey = pluginKey;
    
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
              const { results, version, isFullCheck } = data;
              
              if (version !== docVersion) {
                return { 
                  decorations: pluginState.decorations.map(tr.mapping, tr.doc),
                  forceCheck: !!forceCheck 
                };
              }

              // Mapear decorações existentes para a posição atual de forma eficiente
              let decos = pluginState.decorations.map(tr.mapping, tr.doc);

              // Se for check total (ex: carregamento), limpa tudo
              if (isFullCheck) {
                decos = DecorationSet.empty;
              }

              const decoList: Decoration[] = [];
              results.forEach(({ pos, node, errors }: { pos: number, node: any, errors: SpellError[] }) => {
                // Remover decorações antigas APENAS no range deste nó
                if (!isFullCheck) {
                  const existingInNode = decos.find(pos, pos + node.nodeSize);
                  if (existingInNode.length > 0) {
                    decos = decos.remove(existingInNode);
                  }
                }

                if (errors.length > 0) {
                  // Constrói o mapa de offsets apenas UMA vez para este parágrafo/nó
                  const byteToChar = buildByteToCharMap(node.text!);
                  
                  errors.forEach((err) => {
                    const from = byteToChar[err.start];
                    const to = byteToChar[err.end];
                    
                    decoList.push(Decoration.inline(pos + from, pos + to, {
                      class: 'misspelled',
                      'data-word': err.word,
                    }));
                  });
                }
              });

              return { decorations: decos.add(tr.doc, decoList), forceCheck: !!forceCheck };
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
                const isFullCheck = !!state?.forceCheck;
                
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(async () => {
                  const nodesToCheck: { pos: number, node: any }[] = [];
                  
                  // Coleta Delta (KI-032): Só agrupa nós novos ou modificados
                  view.state.doc.descendants((node, pos) => {
                    if (node.isText && node.text) {
                      if (isFullCheck || !checkedNodes.has(node)) {
                        nodesToCheck.push({ pos, node });
                      }
                    }
                    return true;
                  });

                  if (nodesToCheck.length === 0) return;

                  try {
                    const texts = nodesToCheck.map(item => item.node.text!);
                    const batchErrors = await checkSpellingBatch(texts);
                    
                    if (currentVersion === docVersion) {
                      const results = nodesToCheck.map((item, index) => {
                        checkedNodes.add(item.node);
                        return {
                          pos: item.pos,
                          node: item.node,
                          errors: batchErrors[index]
                        };
                      });

                      view.dispatch(view.state.tr.setMeta('spelling_errors', {
                        results,
                        version: currentVersion,
                        isFullCheck
                      }));
                    }
                  } catch (e) {
                    console.error('Erro na verificação ortográfica em lote:', e);
                  }
                }, isFullCheck ? 0 : debounce);
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
