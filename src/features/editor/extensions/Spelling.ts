import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { checkSpellingBatch, SpellError } from '@/tauri-bridge';
import { SpellingOptions, SpellingStorage, SpellingPluginState } from '@/shared/types';

const encoder = new TextEncoder();

function buildByteToCharMap(text: string): Uint32Array {
  const bytes = encoder.encode(text);
  const map = new Uint32Array(bytes.length + 1);

  let charIndex = 0;
  let byteIndex = 0;

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

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spelling: {
      recheckSpelling: () => ReturnType;
    };
  }
}

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

              let decos = pluginState.decorations.map(tr.mapping, tr.doc);

              if (isFullCheck) {
                decos = DecorationSet.empty;
              }

              const decoList: Decoration[] = [];
              results.forEach(({ pos, node, errors }: { pos: number, node: any, errors: SpellError[] }) => {

                if (!isFullCheck) {
                  const existingInNode = decos.find(pos, pos + node.nodeSize);
                  if (existingInNode.length > 0) {
                    decos = decos.remove(existingInNode);
                  }
                }

                if (errors.length > 0) {

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
                  const nodesToClear: { pos: number, node: any }[] = [];

                  view.state.doc.descendants((node, pos) => {
                    // Ignorar blocos de código e matemática
                    if (node.type.name === 'codeBlock' || node.type.name === 'mathematics') {
                      node.descendants((child, childPos) => {
                        if (child.isText) {
                          nodesToClear.push({ pos: pos + 1 + childPos, node: child });
                        }
                      });
                      return false;
                    }

                    if (node.isText && node.text) {
                      // Ignorar texto que tenha a marca 'code' (inline code)
                      if (node.marks.some(mark => mark.type.name === 'code')) {
                        nodesToClear.push({ pos, node });
                        return true;
                      }

                      if (isFullCheck || !checkedNodes.has(node)) {
                        nodesToCheck.push({ pos, node });
                      }
                    }
                    return true;
                  });

                  if (nodesToCheck.length === 0 && nodesToClear.length === 0) return;

                  try {
                    const texts = nodesToCheck.map(item => item.node.text!);
                    const batchErrors = nodesToCheck.length > 0 ? await checkSpellingBatch(texts) : [];

                    if (currentVersion === docVersion) {
                      const checkResults = nodesToCheck.map((item, index) => {
                        checkedNodes.add(item.node);
                        return {
                          pos: item.pos,
                          node: item.node,
                          errors: batchErrors[index]
                        };
                      });

                      const clearResults = nodesToClear.map(item => ({
                        pos: item.pos,
                        node: item.node,
                        errors: []
                      }));

                      view.dispatch(view.state.tr.setMeta('spelling_errors', {
                        results: [...checkResults, ...clearResults],
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
